import "server-only";

type CimdDocument = {
  client_id?: string;
  client_name?: string;
  redirect_uris?: string[];
  grant_types?: string[];
  response_types?: string[];
  token_endpoint_auth_method?: string;
};

const cache = new Map<string, { doc: CimdDocument; expiresAt: number }>();

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.pathname && url.pathname !== "/");
  } catch {
    return false;
  }
}

/** RFC 8252 loopback: ignore port when matching localhost / 127.0.0.1 callbacks. */
function loopbackRedirectMatches(allowed: string, requested: string): boolean {
  try {
    const a = new URL(allowed);
    const b = new URL(requested);
    const loopbackHosts = new Set(["localhost", "127.0.0.1"]);
    if (!loopbackHosts.has(a.hostname) || !loopbackHosts.has(b.hostname)) {
      return false;
    }
    if (a.protocol !== b.protocol) return false;
    return a.pathname === b.pathname;
  } catch {
    return false;
  }
}

export function redirectUriAllowed(doc: CimdDocument, redirectUri: string): boolean {
  const allowed = Array.isArray(doc.redirect_uris)
    ? doc.redirect_uris.filter((u): u is string => typeof u === "string")
    : [];
  return allowed.some(
    (uri) => uri === redirectUri || loopbackRedirectMatches(uri, redirectUri)
  );
}

export async function fetchCimd(clientId: string): Promise<CimdDocument | null> {
  if (!isHttpsUrl(clientId)) return null;

  const cached = cache.get(clientId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.doc;
  }

  const res = await fetch(clientId, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;

  const doc = (await res.json().catch(() => null)) as CimdDocument | null;
  if (!doc || doc.client_id !== clientId) return null;
  if (!Array.isArray(doc.redirect_uris) || !doc.redirect_uris.length) return null;

  const maxAgeSec = Number(res.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1] ?? 3600);
  cache.set(clientId, {
    doc,
    expiresAt: Date.now() + Math.min(maxAgeSec, 86400) * 1000,
  });
  return doc;
}

export async function validateOAuthClient(
  clientId: string,
  redirectUri: string
): Promise<{ ok: true; clientName?: string } | { ok: false; reason: string }> {
  if (!clientId || !redirectUri) {
    return { ok: false, reason: "Missing client_id or redirect_uri" };
  }

  if (!isHttpsUrl(clientId)) {
    // DCR client_id — accept any redirect URI Claude registered (ephemeral hex id).
    return { ok: true };
  }

  const doc = await fetchCimd(clientId);
  if (!doc) {
    return { ok: false, reason: "Could not fetch client metadata document" };
  }
  if (!redirectUriAllowed(doc, redirectUri)) {
    return { ok: false, reason: "redirect_uri not allowed for this client" };
  }
  return { ok: true, clientName: doc.client_name };
}
