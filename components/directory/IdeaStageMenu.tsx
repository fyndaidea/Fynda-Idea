"use client";

import { Check, ChevronDown, LoaderCircle } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { IDEA_PROGRESS_GROUPS, IDEA_PROGRESS_STATUSES, type IdeaProgressStatus } from "@/lib/ideas/progress";

function stageColor(status: IdeaProgressStatus | null) {
  if (!status || ["Raw", "Paused", "Killed", "Archived"].includes(status)) return "var(--muted-2)";
  if (["🔥Ready for build", "Live / Launched", "Reviewed", "Analyzed"].includes(status)) return "#29936b";
  if (["To Review", "Potential"].includes(status)) return "#bc8521";
  return "#6676ce";
}


/** A top-layer menu stays above both cards and the native idea-preview dialog. */
export function IdeaStageMenu({ status, ready, busy, onChange, allowClear = true }: {
  allowClear?: boolean;
  status: IdeaProgressStatus | null;
  ready: boolean;
  busy: boolean;
  onChange: (status: IdeaProgressStatus | null) => void;
}) {
  const options: (IdeaProgressStatus | null)[] = allowClear ? [...IDEA_PROGRESS_STATUSES, null] : [...IDEA_PROGRESS_STATUSES];
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const search = useRef({ value: "", at: 0 });
  const [open, setOpen] = useState(false);

  function close(restoreFocus = false) {
    menu.current?.hidePopover();
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }
  function focusItem(index: number) {
    const item = items.current[(index + options.length) % options.length];
    item?.focus({ preventScroll: true });
    item?.scrollIntoView({ block: "nearest" });
  }
  function show(fromEnd = false) {
    const button = trigger.current;
    const panel = menu.current;
    if (!button || !panel) return;
    const rect = button.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const upwards = below < 360 && above > below;
    const width = Math.min(252, window.innerWidth - 24);
    Object.assign(panel.style, {
      width: `${width}px`,
      left: `${Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12))}px`,
      top: `${upwards ? rect.top - 7 : rect.bottom + 7}px`,
      transform: upwards ? "translateY(-100%)" : "none",
      maxHeight: `${Math.max(96, Math.min(430, (upwards ? above : below) - 7))}px`,
    });
    search.current = { value: "", at: 0 };
    panel.showPopover();
    const index = status ? options.indexOf(status) : fromEnd ? options.length - 1 : 0;
    focusItem(index);
  }

  useEffect(() => {
    if (!open) return;
    const panel = menu.current;
    const dismiss = () => panel?.hidePopover();
    const scroll = (event: Event) => {
      if (event.target instanceof Node && panel?.contains(event.target)) return;
      dismiss();
    };
    window.addEventListener("resize", dismiss);
    document.addEventListener("scroll", scroll, true);
    return () => {
      window.removeEventListener("resize", dismiss);
      document.removeEventListener("scroll", scroll, true);
    };
  }, [open]);

  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    const index = items.current.indexOf(document.activeElement as HTMLButtonElement);
    if (["ArrowDown", "ArrowUp", "Home", "End", "Escape"].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Escape") close(true);
      else focusItem(event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : index + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Tab") close();
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key !== " ") {
      event.preventDefault();
      const now = event.timeStamp;
      search.current = { value: (now - search.current.at < 600 ? search.current.value : "") + event.key.toLowerCase(), at: now };
      const next = options.findIndex((value) => (value ?? "Clear status").replace(/^🔥/, "").toLowerCase().startsWith(search.current.value));
      if (next >= 0) focusItem(next);
    }
  }

  function select(event: MouseEvent<HTMLButtonElement>) {
    const value = (event.currentTarget.dataset.stage || null) as IdeaProgressStatus | null;
    close(true);
    if (value !== status) onChange(value);
  }

  function option(value: IdeaProgressStatus | null, index: number) {
    return <button key={value ?? "clear"} ref={(node) => { items.current[index] = node; }} type="button"
      role="menuitemradio" aria-checked={status === value} tabIndex={-1} className={`idea-stage-option${value === null ? " idea-stage-option--clear" : ""}`}
      data-stage={value ?? ""} onClick={select}>
      {value ? <span className="idea-stage-dot" style={{ background: stageColor(value) }} aria-hidden /> : null}
      <span>{value ?? "Clear status"}{value === null ? <small>Remove from your dashboard</small> : null}</span>
      {status === value ? <Check size={14} aria-hidden /> : null}
    </button>;
  }

  return <>
    <button ref={trigger} type="button" className="idea-stage-trigger" disabled={!ready} aria-disabled={busy || !ready} aria-busy={busy}
      aria-haspopup="menu" aria-expanded={open} aria-controls={id} aria-label={`Idea status: ${ready ? status ?? "not set" : "loading"}`}
      onClick={() => { if (busy) return; if (menu.current?.matches(":popover-open")) close(); else show(); }}
      onKeyDown={(event) => { if (busy) return; if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); show(event.key === "ArrowUp"); } }}>
      <span className="idea-stage-dot" style={{ background: stageColor(status) }} aria-hidden />
      <span>{busy ? "Saving…" : ready ? status ?? "Set status" : "Loading…"}</span>
      {busy ? <LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <ChevronDown size={14} aria-hidden />}
    </button>
    <div ref={menu} id={id} popover="auto" role="menu" aria-label="Choose idea status" className="idea-stage-menu"
      onToggle={(event) => setOpen(event.newState === "open")} onKeyDown={keyboard}>
      <div className="idea-stage-menu-heading">Choose a stage</div>
      {IDEA_PROGRESS_GROUPS.map((group) => <div role="group" aria-label={group.name} key={group.name}>
        <div className="idea-stage-group-heading" aria-hidden>{group.name}</div>
        {group.options.map((value) => option(value, options.indexOf(value)))}
      </div>)}
      {allowClear ? option(null, options.length - 1) : null}
    </div>
  </>;
}
