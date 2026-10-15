#!/usr/bin/env python3
"""Copy Product Vault Idea pages into Idea Vault, then archive the sources.

Resume-safe one-shot (migration already completed 2026-08-29).

Reads mina_aiagent/.env plus optional PRODUCT_VAULT_DATABASE_ID
(only required when re-running this script — not part of Mina's day-to-day .env):
  NOTION_TOKEN
  IDEA_VAULT_DATABASE_ID          # Idea Vault (dest); falls back to NOTION_DATABASE_ID
  PRODUCT_VAULT_DATABASE_ID       # Product Vault (source) — set only for this script

Does not print tokens. Does not delete source pages (archives them).
Skips titles starting with \"Market:\" (those belong in Market Vault).
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

NOTION_VERSION = "2022-06-28"
ROOT = Path(__file__).resolve().parents[1]
ENV = ROOT / ".env"
STATE_PATH = ROOT / ".tmp" / "idea_migrate_state.json"
LOG_PATH = ROOT / ".tmp" / "idea_migrate.log"
ENTRY_TYPE_PROP = "Entry Type"
SKIP_PROP_TYPES = {
    "created_by",
    "last_edited_by",
    "created_time",
    "last_edited_time",
    "formula",
    "rollup",
    "unique_id",
    "button",
    "relation",
}
SKIP_BLOCK_TYPES = {"child_page", "child_database", "unsupported", "table", "table_row"}


def load_env() -> None:
    if not ENV.exists():
        sys.exit(f"Missing {ENV}")
    for line in ENV.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip()
        if key and key not in os.environ:
            os.environ[key] = value


def token() -> str:
    value = os.environ.get("NOTION_TOKEN", "").strip()
    if not value:
        sys.exit("Missing NOTION_TOKEN")
    return value


def dest_db() -> str:
    value = (
        os.environ.get("IDEA_VAULT_DATABASE_ID", "").strip()
        or os.environ.get("NOTION_DATABASE_ID", "").strip()
    )
    if not value:
        sys.exit("Missing IDEA_VAULT_DATABASE_ID (Idea Vault)")
    return value


def source_db() -> str:
    value = os.environ.get("PRODUCT_VAULT_DATABASE_ID", "").strip()
    if not value:
        sys.exit("Missing PRODUCT_VAULT_DATABASE_ID")
    return value


def log(msg: str) -> None:
    line = msg.rstrip()
    print(line, flush=True)
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as fh:
        fh.write(line + "\n")


def notion(method: str, path: str, body: dict | None = None) -> dict:
    url = f"https://api.notion.com/v1{path}"
    data = json.dumps(body).encode() if body is not None else None
    last_err: Exception | None = None
    for attempt in range(8):
        req = urllib.request.Request(
            url,
            data=data,
            method=method,
            headers={
                "Authorization": f"Bearer {token()}",
                "Notion-Version": NOTION_VERSION,
                "Content-Type": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                raw = resp.read()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode(errors="replace")
            if exc.code == 429:
                retry_after = exc.headers.get("Retry-After")
                wait = float(retry_after) if retry_after else 2 ** attempt
                time.sleep(max(wait, 1.0))
                continue
            if exc.code in (500, 502, 503, 504) and attempt < 7:
                time.sleep(2 ** min(attempt, 5))
                continue
            raise RuntimeError(f"Notion {method} {path} {exc.code}: {detail[:800]}") from exc
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            last_err = exc
            time.sleep(2 ** min(attempt, 5))
    raise RuntimeError(f"Notion {method} {path} failed: {last_err}")


def load_state() -> dict:
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text())
    return {"copied": {}, "archived": [], "failed": [], "skipped": []}


def save_state(state: dict) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, indent=2))


def page_title(props: dict) -> str:
    for prop in props.values():
        if prop.get("type") == "title":
            return "".join(t.get("plain_text", "") for t in prop.get("title", []))
    return ""


def query_all(database_id: str, filter_obj: dict | None = None) -> list[dict]:
    pages: list[dict] = []
    cursor = None
    while True:
        body: dict = {"page_size": 100}
        if filter_obj:
            body["filter"] = filter_obj
        if cursor:
            body["start_cursor"] = cursor
        resp = notion("POST", f"/databases/{database_id}/query", body)
        pages.extend(resp.get("results", []))
        if not resp.get("has_more"):
            break
        cursor = resp.get("next_cursor")
    return pages


def source_idea_pages() -> list[dict]:
    pages = query_all(
        source_db(),
        {"property": ENTRY_TYPE_PROP, "select": {"equals": "Idea"}},
    )
    keep: list[dict] = []
    for page in pages:
        title = page_title(page["properties"])
        if title.startswith("Market:"):
            continue
        keep.append(page)
    keep.sort(key=lambda p: page_title(p["properties"]).lower())
    return keep


def copy_files(files: list[dict]) -> list[dict]:
    out: list[dict] = []
    for item in files:
        name = item.get("name") or "file"
        if item.get("type") == "external" and item.get("external", {}).get("url"):
            out.append({"name": name, "external": {"url": item["external"]["url"]}})
        elif item.get("type") == "file" and item.get("file", {}).get("url"):
            out.append({"name": name, "external": {"url": item["file"]["url"]}})
    return out


def copyable_properties(props: dict, dest_schema: dict) -> dict:
    out: dict = {}
    for name, prop in props.items():
        if name not in dest_schema:
            continue
        ptype = prop.get("type")
        if ptype in SKIP_PROP_TYPES:
            continue
        if dest_schema[name].get("type") != ptype:
            continue
        value = prop.get(ptype)
        if ptype == "title":
            out[name] = {"title": value or []}
        elif ptype == "rich_text":
            out[name] = {"rich_text": value or []}
        elif ptype == "number":
            if value is not None:
                out[name] = {"number": value}
        elif ptype == "url":
            if value:
                out[name] = {"url": value}
        elif ptype == "select":
            if value and value.get("name"):
                out[name] = {"select": {"name": value["name"]}}
        elif ptype == "multi_select":
            names = [{"name": opt["name"]} for opt in (value or []) if opt.get("name")]
            out[name] = {"multi_select": names}
        elif ptype == "status":
            if value and value.get("name"):
                out[name] = {"status": {"name": value["name"]}}
        elif ptype == "files":
            files = copy_files(value or [])
            if files:
                out[name] = {"files": files}
        elif ptype == "checkbox":
            out[name] = {"checkbox": bool(value)}
        elif ptype == "date":
            if value and value.get("start"):
                date: dict = {"start": value["start"]}
                if value.get("end"):
                    date["end"] = value["end"]
                if value.get("time_zone"):
                    date["time_zone"] = value["time_zone"]
                out[name] = {"date": date}
        elif ptype == "email":
            if value:
                out[name] = {"email": value}
        elif ptype == "phone_number":
            if value:
                out[name] = {"phone_number": value}
    return out


def sanitize_icon_or_cover(obj: dict | None) -> dict | None:
    if not obj:
        return None
    otype = obj.get("type")
    if otype == "emoji":
        return {"type": "emoji", "emoji": obj.get("emoji")}
    if otype == "external" and obj.get("external", {}).get("url"):
        return {"type": "external", "external": {"url": obj["external"]["url"]}}
    if otype == "file" and obj.get("file", {}).get("url"):
        return {"type": "external", "external": {"url": obj["file"]["url"]}}
    return None


def drop_nulls(value):
    if isinstance(value, dict):
        return {k: drop_nulls(v) for k, v in value.items() if v is not None}
    if isinstance(value, list):
        return [drop_nulls(v) for v in value]
    return value


def sanitize_block(block: dict) -> dict | None:
    btype = block.get("type")
    if not btype or btype in SKIP_BLOCK_TYPES:
        return None
    inner = block.get(btype)
    if not isinstance(inner, dict):
        return None
    cleaned = drop_nulls(json.loads(json.dumps(inner)))
    cleaned.pop("children", None)
    return {"type": btype, btype: cleaned}


def list_children(block_id: str) -> list[dict]:
    out: list[dict] = []
    cursor = None
    while True:
        path = f"/blocks/{block_id}/children?page_size=100"
        if cursor:
            path += f"&start_cursor={cursor}"
        resp = notion("GET", path)
        out.extend(resp.get("results", []))
        if not resp.get("has_more"):
            break
        cursor = resp.get("next_cursor")
    return out


def copy_children(src_id: str, dest_id: str) -> None:
    children = list_children(src_id)
    if not children:
        return
    payloads: list[dict] = []
    recurse: list[tuple[int, str]] = []
    for block in children:
        sanitized = sanitize_block(block)
        if not sanitized:
            continue
        idx = len(payloads)
        payloads.append(sanitized)
        if block.get("has_children"):
            recurse.append((idx, block["id"]))
    created: list[dict] = []
    for start in range(0, len(payloads), 100):
        chunk = payloads[start : start + 100]
        try:
            resp = notion("PATCH", f"/blocks/{dest_id}/children", {"children": chunk})
            created.extend(resp.get("results", []))
        except RuntimeError as exc:
            log(f"    block batch failed ({exc}); retrying one-by-one")
            for item in chunk:
                try:
                    resp = notion("PATCH", f"/blocks/{dest_id}/children", {"children": [item]})
                    created.extend(resp.get("results", []))
                except RuntimeError as inner:
                    log(f"    skipped block {item.get('type')}: {inner}")
                    created.append({})
        time.sleep(0.15)
    for idx, src_block_id in recurse:
        if idx >= len(created) or not created[idx].get("id"):
            continue
        copy_children(src_block_id, created[idx]["id"])


def create_dest_page(src: dict, dest_schema: dict) -> str:
    props = copyable_properties(src["properties"], dest_schema)
    body: dict = {"parent": {"database_id": dest_db()}, "properties": props}
    icon = sanitize_icon_or_cover(src.get("icon"))
    cover = sanitize_icon_or_cover(src.get("cover"))
    if icon:
        body["icon"] = icon
    if cover:
        body["cover"] = cover
    try:
        created = notion("POST", "/pages", body)
    except RuntimeError:
        slim = {
            "parent": {"database_id": dest_db()},
            "properties": {
                "Name": props.get(
                    "Name",
                    {
                        "title": [
                            {
                                "type": "text",
                                "text": {"content": page_title(src["properties"])[:200]},
                            }
                        ]
                    },
                )
            },
        }
        if "Status" in props:
            slim["properties"]["Status"] = props["Status"]
        if "Entry Type" in props:
            slim["properties"]["Entry Type"] = props["Entry Type"]
        created = notion("POST", "/pages", slim)
        remaining = {k: v for k, v in props.items() if k not in slim["properties"]}
        if remaining:
            try:
                notion("PATCH", f"/pages/{created['id']}", {"properties": remaining})
            except RuntimeError as exc:
                log(f"    properties patch partial fail: {exc}")
    copy_children(src["id"], created["id"])
    return created["id"]


def remap_relations(copied: dict[str, str]) -> None:
    """Remap Idea↔Idea relations when both sides moved; leave App/Company links as-is."""
    for src_id, dest_id in copied.items():
        src = notion("GET", f"/pages/{src_id}")
        payload: dict = {}
        for rel_name in ("Related Product Vault", "Direct Competitors"):
            rel = src.get("properties", {}).get(rel_name, {})
            if rel.get("type") != "relation":
                continue
            mapped = []
            for item in rel.get("relation", []):
                rid = item.get("id")
                if not rid:
                    continue
                # Prefer dest twin if this related page also migrated; else keep original id
                # (Apps/Companies remaining in Product Vault still resolve via relation DB).
                mapped.append({"id": copied.get(rid, rid)})
            if mapped:
                payload[rel_name] = {"relation": mapped}
        if payload:
            try:
                notion("PATCH", f"/pages/{dest_id}", {"properties": payload})
            except RuntimeError as exc:
                log(f"  relation remap failed for {dest_id}: {exc}")
            time.sleep(0.12)


def archive_page(page_id: str) -> None:
    notion("PATCH", f"/pages/{page_id}", {"archived": True})


def main() -> int:
    load_env()
    log("Loading schemas…")
    dest_meta = notion("GET", f"/databases/{dest_db()}")
    src_meta = notion("GET", f"/databases/{source_db()}")
    dest_schema = dest_meta["properties"]
    dest_title = "".join(t.get("plain_text", "") for t in dest_meta.get("title", []))
    src_title = "".join(t.get("plain_text", "") for t in src_meta.get("title", []))
    log(f"Source: {src_title}")
    log(f"Dest:   {dest_title}")

    sources = source_idea_pages()
    log(f"Source Idea pages: {len(sources)}")

    dest_pages = query_all(dest_db())
    dest_by_name = {
        page_title(p["properties"]).strip().lower(): p["id"] for p in dest_pages
    }
    log(f"Dest existing pages: {len(dest_pages)}")

    state = load_state()
    copied: dict[str, str] = dict(state.get("copied") or {})
    archived = set(state.get("archived") or [])
    failed: list[list[str]] = list(state.get("failed") or [])
    skipped: list[list[str]] = list(state.get("skipped") or [])

    for i, src in enumerate(sources, 1):
        src_id = src["id"]
        title = page_title(src["properties"]) or src_id
        if src_id in copied:
            log(f"[{i}/{len(sources)}] skip already copied {title}")
            continue
        key = title.strip().lower()
        if key and key in dest_by_name:
            copied[src_id] = dest_by_name[key]
            save_state(
                {
                    "copied": copied,
                    "archived": list(archived),
                    "failed": failed,
                    "skipped": skipped,
                }
            )
            log(f"[{i}/{len(sources)}] dest already has {title}")
            continue
        log(f"[{i}/{len(sources)}] copying {title}")
        try:
            dest_id = create_dest_page(src, dest_schema)
            copied[src_id] = dest_id
            dest_by_name[key] = dest_id
            save_state(
                {
                    "copied": copied,
                    "archived": list(archived),
                    "failed": failed,
                    "skipped": skipped,
                }
            )
        except Exception as exc:  # noqa: BLE001 — resume-safe log
            failed.append([src_id, title, str(exc)[:400]])
            save_state(
                {
                    "copied": copied,
                    "archived": list(archived),
                    "failed": failed,
                    "skipped": skipped,
                }
            )
            log(f"  FAILED {title}: {exc}")
        time.sleep(0.2)

    log("Remapping Idea↔Idea relations…")
    remap_relations(copied)

    log("Archiving Product Vault originals that copied successfully…")
    for src_id, dest_id in copied.items():
        if src_id in archived:
            continue
        try:
            archive_page(src_id)
            archived.add(src_id)
            save_state(
                {
                    "copied": copied,
                    "archived": list(archived),
                    "failed": failed,
                    "skipped": skipped,
                }
            )
            time.sleep(0.12)
        except Exception as exc:  # noqa: BLE001
            log(f"  archive failed {src_id} (dest {dest_id}): {exc}")

    remaining = source_idea_pages()
    dest_now = query_all(dest_db())
    log("---")
    log(f"copied:   {len(copied)}")
    log(f"archived: {len(archived)}")
    log(f"failed:   {len(failed)}")
    log(f"source remaining (unarchived Ideas): {len(remaining)}")
    log(f"dest pages: {len(dest_now)}")
    if failed:
        for row in failed:
            log(f"  fail {row}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
