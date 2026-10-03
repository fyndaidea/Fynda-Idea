"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  MCP_PERMISSIONS,
  mcpPermissionLabel,
  type McpPermission,
} from "@/lib/mcp/permissions";
import {
  btnPrimaryClass,
  btnSecondaryClass,
  inputClass,
  panelClass,
} from "@/lib/ui-classes";
import {
  DialogOverlay,
  DialogPanel,
  DialogFooterActions,
} from "@/components/ui/DialogShell";
import { ShimmerBlock } from "@/components/ui/Shimmer";
import { Check, Copy, KeyRound } from "lucide-react";

type ApiKeyRow = {
  id: string;
  name: string;
  keyPreview: string;
  created: string;
  lastUsed?: string;
  usage: number;
  status: "Active" | "Inactive";
  mcpPermissions: string[];
  mcpFullAccess: boolean;
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function McpPermissionsEditor({
  fullAccess,
  selected,
  onFullAccessChange,
  onSelectedChange,
}: {
  fullAccess: boolean;
  selected: McpPermission[];
  onFullAccessChange: (value: boolean) => void;
  onSelectedChange: (value: McpPermission[]) => void;
}) {
  const togglePermission = (permission: McpPermission) => {
    if (selected.includes(permission)) {
      onSelectedChange(selected.filter((p) => p !== permission));
    } else {
      onSelectedChange([...selected, permission]);
    }
  };

  const applyReadOnly = () => {
    onFullAccessChange(false);
    onSelectedChange(
      MCP_PERMISSIONS.filter((p) => p.endsWith(":read")) as McpPermission[]
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-[color:var(--foreground)]">MCP permissions</p>
        <p className="mt-1 text-xs text-[color:var(--muted)]">
          Control which MCP tools this key can use. Full access allows all Idea catalog tools.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm text-[color:var(--foreground)]">
        <input
          type="checkbox"
          checked={fullAccess}
          onChange={(e) => onFullAccessChange(e.target.checked)}
          className="rounded border-[color:var(--card-border)]"
        />
        Full MCP access (all tools)
      </label>
      {!fullAccess ? (
        <>
          <button
            type="button"
            onClick={applyReadOnly}
            className="text-xs font-semibold text-[color:var(--accent)] hover:underline"
          >
            Apply read-only preset
          </button>
          <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-[color:var(--card-border)] p-3">
            {MCP_PERMISSIONS.map((permission) => (
              <label
                key={permission}
                className="flex items-start gap-2 text-sm text-[color:var(--foreground)]"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(permission)}
                  onChange={() => togglePermission(permission)}
                  className="mt-0.5 rounded border-[color:var(--card-border)]"
                />
                <span>
                  <span className="font-medium">{mcpPermissionLabel(permission)}</span>
                  <span className="block font-mono text-xs text-[color:var(--muted)]">
                    {permission}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function ApiKeysContent() {
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealedPlain, setRevealedPlain] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [mcpFullAccess, setMcpFullAccess] = useState(true);
  const [mcpPermissions, setMcpPermissions] = useState<McpPermission[]>([]);
  const [editKeyId, setEditKeyId] = useState<string | null>(null);
  const [editMcpFullAccess, setEditMcpFullAccess] = useState(true);
  const [editMcpPermissions, setEditMcpPermissions] = useState<McpPermission[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [creating, setCreating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const mcpUrl = useMemo(() => {
    if (!mounted || typeof window === "undefined") return "";
    return `${window.location.origin}/api/mcp/mcp`;
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/api-keys", { credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j?.error === "string" ? j.error : "Failed to load API keys");
      }
      const data = (await res.json()) as { keys: ApiKeyRow[] };
      setApiKeys(data.keys);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopyNotice("Copied to clipboard");
    window.setTimeout(() => setCopyNotice(null), 2500);
  };

  const handleRevokeKey = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/api-keys/${encodeURIComponent(id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j?.error === "string" ? j.error : "Failed to revoke key");
      }
      setCopyNotice("API key revoked");
      window.setTimeout(() => setCopyNotice(null), 2500);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke key");
    }
  };

  const handleCreateKey = async () => {
    const name = newKeyName.trim();
    if (!name) return;
    if (!mcpFullAccess && mcpPermissions.length === 0) {
      setError("Select at least one MCP permission or enable full access");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mcpFullAccess, mcpPermissions }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof j?.error === "string" ? j.error : "Failed to create key");
      }
      const plain = typeof j.plainKey === "string" ? j.plainKey : "";
      setNewKeyName("");
      setMcpFullAccess(true);
      setMcpPermissions([]);
      setShowCreateModal(false);
      setRevealedPlain(plain);
      setShowRevealModal(true);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!editKeyId) return;
    if (!editMcpFullAccess && editMcpPermissions.length === 0) {
      setError("Select at least one MCP permission or enable full access");
      return;
    }
    setSavingPermissions(true);
    setError(null);
    try {
      const res = await fetch(`/api/settings/api-keys/${encodeURIComponent(editKeyId)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mcpFullAccess: editMcpFullAccess,
          mcpPermissions: editMcpPermissions,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j?.error === "string" ? j.error : "Failed to update permissions");
      }
      setEditKeyId(null);
      setCopyNotice("MCP permissions updated");
      window.setTimeout(() => setCopyNotice(null), 2500);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  const openEditPermissions = (apiKey: ApiKeyRow) => {
    setEditKeyId(apiKey.id);
    setEditMcpFullAccess(apiKey.mcpFullAccess);
    setEditMcpPermissions(
      apiKey.mcpPermissions.filter((p): p is McpPermission =>
        (MCP_PERMISSIONS as readonly string[]).includes(p)
      )
    );
  };

  const formatMcpAccess = (apiKey: ApiKeyRow) => {
    if (apiKey.mcpFullAccess || !apiKey.mcpPermissions.length) {
      return "Full MCP access (all tools)";
    }
    return apiKey.mcpPermissions
      .map((p) => mcpPermissionLabel(p as McpPermission))
      .join(", ");
  };

  const handleDeleteKey = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/api-keys/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j?.error === "string" ? j.error : "Failed to delete key");
      }
      setConfirmDeleteId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete key");
    }
  };

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {copyNotice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {copyNotice}
        </div>
      ) : null}

      <section className={`${panelClass} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="dash-kicker">Connector</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-[color:var(--foreground)]">
              MCP URL
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-[color:var(--muted)]">
              Paste into Claude or any MCP client. Auth with OAuth or a Bearer{" "}
              <code className="text-xs">sk_live_…</code> key.
            </p>
          </div>
          {mcpUrl ? (
            <button
              type="button"
              onClick={() => void copyToClipboard(mcpUrl)}
              className={`${btnSecondaryClass} gap-2`}
            >
              {copyNotice === "Copied to clipboard" ? (
                <>
                  <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  Copy URL
                </>
              )}
            </button>
          ) : null}
        </div>
        {mcpUrl ? (
          <code className="mt-4 block break-all rounded-xl bg-[color:var(--background-warm)] px-3 py-2.5 font-mono text-[11px] leading-relaxed text-[color:var(--foreground)] sm:text-[13px]">
            {mcpUrl}
          </code>
        ) : (
          <ShimmerBlock className="mt-4 h-12 w-full" rounded="rounded-xl" />
        )}
      </section>

      <section className={`${panelClass} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="dash-kicker">Keys</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-[color:var(--foreground)]">
              Your API keys
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-[color:var(--muted)]">
              Secrets are hashed after creation — copy the full key when it’s shown.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            disabled={loading}
            className={btnPrimaryClass}
          >
            Create key
          </button>
        </div>

        <div className="mt-5">
          {loading ? (
            <div className="space-y-4" aria-busy="true" aria-label="Loading API keys">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <ShimmerBlock className="h-10 w-10 shrink-0" rounded="rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2 py-1">
                    <ShimmerBlock className="h-3.5 w-[55%]" />
                    <ShimmerBlock className="h-3 w-[40%]" />
                  </div>
                </div>
              ))}
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[color:var(--card-border)] bg-[color:var(--background-warm)]/60 px-4 py-10 text-center">
              <KeyRound
                className="mx-auto h-5 w-5 text-[color:var(--muted-2)]"
                strokeWidth={1.75}
                aria-hidden
              />
              <p className="mt-3 text-sm text-[color:var(--muted)]">No API keys yet.</p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-3 inline-flex text-sm font-semibold text-[color:var(--accent)] hover:underline"
              >
                Create your first key →
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[color:var(--card-border)]">
              {apiKeys.map((apiKey) => (
                <li key={apiKey.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--card-border)] bg-[color:var(--background-warm)] text-[color:var(--muted)]">
                        <KeyRound className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[color:var(--foreground)]">
                            {apiKey.name}
                          </span>
                          <span
                            className={[
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              apiKey.status === "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-[color:var(--background-warm)] text-[color:var(--muted)]",
                            ].join(" ")}
                          >
                            {apiKey.status}
                          </span>
                        </div>
                        <code className="mt-1 block truncate font-mono text-xs text-[color:var(--muted)]">
                          {apiKey.keyPreview}
                        </code>
                        <p className="mt-2 text-xs text-[color:var(--muted)]">
                          Created {formatDate(apiKey.created)}
                          {" · "}
                          Last used {apiKey.lastUsed ? formatDate(apiKey.lastUsed) : "never"}
                          {" · "}
                          {apiKey.usage} requests
                        </p>
                        <p className="mt-0.5 text-xs text-[color:var(--muted)]">
                          MCP · {formatMcpAccess(apiKey)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => openEditPermissions(apiKey)}
                        className={btnSecondaryClass}
                      >
                        Permissions
                      </button>
                      {apiKey.status === "Active" ? (
                        <button
                          type="button"
                          onClick={() => void handleRevokeKey(apiKey.id)}
                          className={btnSecondaryClass}
                        >
                          Revoke
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(apiKey.id)}
                        className="inline-flex h-10 items-center justify-center rounded-full border border-red-200 bg-[color:var(--card)] px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {mounted && showCreateModal
        ? createPortal(
            <DialogOverlay
              onClose={() => {
                if (!creating) {
                  setShowCreateModal(false);
                  setNewKeyName("");
                  setMcpFullAccess(true);
                  setMcpPermissions([]);
                }
              }}
              closeOnBackdrop={!creating}
            >
              <div ref={modalRef} className="w-full max-w-md">
                <DialogPanel
                  title="Create API key"
                  onClose={() => {
                    if (!creating) {
                      setShowCreateModal(false);
                      setNewKeyName("");
                      setMcpFullAccess(true);
                      setMcpPermissions([]);
                    }
                  }}
                  maxWidth="md"
                  closeDisabled={creating}
                  footer={
                    <DialogFooterActions
                      onCancel={() => {
                        setShowCreateModal(false);
                        setNewKeyName("");
                        setMcpFullAccess(true);
                        setMcpPermissions([]);
                      }}
                      onPrimary={() => void handleCreateKey()}
                      primaryLabel={creating ? "Creating…" : "Create key"}
                      primaryDisabled={
                        !newKeyName.trim() ||
                        creating ||
                        (!mcpFullAccess && mcpPermissions.length === 0)
                      }
                      cancelDisabled={creating}
                    />
                  }
                >
                  <p className="mb-4 text-sm text-[color:var(--muted)]">
                    Give your API key a descriptive name.
                  </p>
                  <label className="block text-sm font-semibold text-[color:var(--foreground)]">
                    Key name
                    <input
                      className={`${inputClass} mt-2`}
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g. Claude MCP"
                    />
                  </label>
                  <div className="mt-5">
                    <McpPermissionsEditor
                      fullAccess={mcpFullAccess}
                      selected={mcpPermissions}
                      onFullAccessChange={setMcpFullAccess}
                      onSelectedChange={setMcpPermissions}
                    />
                  </div>
                </DialogPanel>
              </div>
            </DialogOverlay>,
            document.body
          )
        : null}

      {mounted && showRevealModal
        ? createPortal(
            <DialogOverlay onClose={() => setShowRevealModal(false)}>
              <div className="w-full max-w-md">
                <DialogPanel
                  title="Your new API key"
                  onClose={() => setShowRevealModal(false)}
                  maxWidth="md"
                  footer={
                    <DialogFooterActions
                      onCancel={() => setShowRevealModal(false)}
                      onPrimary={() => void copyToClipboard(revealedPlain)}
                      cancelLabel="Close"
                      primaryLabel="Copy key"
                    />
                  }
                >
                  <p className="mb-3 text-sm text-[color:var(--muted)]">
                    Copy this key now. You will not be able to see it again.
                  </p>
                  <code className="block break-all rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card-muted)]/40 px-3 py-2 font-mono text-sm">
                    {revealedPlain}
                  </code>
                </DialogPanel>
              </div>
            </DialogOverlay>,
            document.body
          )
        : null}

      {mounted && editKeyId
        ? createPortal(
            <DialogOverlay onClose={() => !savingPermissions && setEditKeyId(null)}>
              <div className="w-full max-w-md">
                <DialogPanel
                  title="Edit MCP permissions"
                  onClose={() => !savingPermissions && setEditKeyId(null)}
                  maxWidth="md"
                  closeDisabled={savingPermissions}
                  footer={
                    <DialogFooterActions
                      onCancel={() => setEditKeyId(null)}
                      onPrimary={() => void handleSavePermissions()}
                      primaryLabel={savingPermissions ? "Saving…" : "Save permissions"}
                      primaryDisabled={
                        savingPermissions ||
                        (!editMcpFullAccess && editMcpPermissions.length === 0)
                      }
                      cancelDisabled={savingPermissions}
                    />
                  }
                >
                  <McpPermissionsEditor
                    fullAccess={editMcpFullAccess}
                    selected={editMcpPermissions}
                    onFullAccessChange={setEditMcpFullAccess}
                    onSelectedChange={setEditMcpPermissions}
                  />
                </DialogPanel>
              </div>
            </DialogOverlay>,
            document.body
          )
        : null}

      {mounted && confirmDeleteId
        ? createPortal(
            <DialogOverlay onClose={() => setConfirmDeleteId(null)}>
              <div className="w-full max-w-md">
                <DialogPanel
                  title="Delete API key"
                  onClose={() => setConfirmDeleteId(null)}
                  maxWidth="md"
                  footer={
                    <DialogFooterActions
                      onCancel={() => setConfirmDeleteId(null)}
                      onPrimary={() => void handleDeleteKey(confirmDeleteId)}
                      cancelLabel="Cancel"
                      primaryLabel="Delete"
                      primaryClassName="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
                    />
                  }
                >
                  <p className="text-sm text-[color:var(--muted)]">
                    Apps using this key will stop working. This action cannot be undone.
                  </p>
                </DialogPanel>
              </div>
            </DialogOverlay>,
            document.body
          )
        : null}
    </div>
  );
}
