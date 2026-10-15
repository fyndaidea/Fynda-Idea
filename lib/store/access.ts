/** Store handlers enforce their own user/payment checks; admin routes are never exempt. */
export function isStorePublicPath(path: string, method = 'GET') {
  if (method !== 'GET' && method !== 'HEAD') return false;
  return path === '/store' || /^\/store\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path) || /^\/api\/store\/orders\/[0-9a-f-]{36}\/download$/i.test(path);
}
