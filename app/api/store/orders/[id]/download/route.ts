import { storeUser, privateStorage, errorResponse } from '@/lib/store/server';
import { query } from '@/lib/store/db';
import { STORE_APP_KEY } from '@/lib/store/config';
import { canDownload, assertAssetPath, StoreError, type Order } from '@/lib/store/policy';
export const runtime = 'nodejs';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await storeUser();
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new StoreError('Download not found.', 404);
    const [order] = await query<Order>('SELECT * FROM store_orders WHERE app_key=$1 AND id=$2 AND user_id=$3', [STORE_APP_KEY, id, user.id]);
    if (!order || !canDownload(order, user.id, STORE_APP_KEY)) throw new StoreError('This download is not available.', 404);
    assertAssetPath(order.asset_path, STORE_APP_KEY);
    const storage = await privateStorage();
    const { data, error } = await storage.createSignedUrl(order.asset_path, 60, { download: order.file_name });
    if (error || !data) throw new StoreError('The download could not be prepared. Please try again.', 503);
    return new Response(null, { status: 303, headers: { Location: data.signedUrl, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
  } catch (error) { return errorResponse(error); }
}
