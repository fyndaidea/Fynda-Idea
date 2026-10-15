import { randomUUID } from 'node:crypto';
import { checkOrigin, storeUser, privateStorage, errorResponse } from '@/lib/store/server';
import { STORE_APP_KEY, STORE_PRIVATE_BUCKET } from '@/lib/store/config';
import { StoreError } from '@/lib/store/policy';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    checkOrigin(request); await storeUser(true);
    const body = await request.json();
    if (typeof body.name !== 'string' || body.name.length > 500 || typeof body.size !== 'number' || !Number.isSafeInteger(body.size) || body.size < 1 || body.size > 50 * 1024 * 1024)
      throw new StoreError('Choose a file up to 50 MB.', 413);
    const name = body.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+|\.+$/g, '').slice(0, 180) || 'download';
    const path = `${STORE_APP_KEY}/${randomUUID()}/${name}`;
    const storage = await privateStorage();
    const { data, error } = await storage.createSignedUploadUrl(path, { upsert: false });
    if (error || !data) throw new StoreError('The file upload could not be prepared.', 503);
    // Only verified admins receive a token for this one immutable private object.
    // Bytes go directly to Storage; this avoids app-host request-size limits.
    return Response.json({ asset_path: path, file_name: name, file_bytes: body.size, token: data.token, bucket: STORE_PRIVATE_BUCKET }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return errorResponse(error); }
}
