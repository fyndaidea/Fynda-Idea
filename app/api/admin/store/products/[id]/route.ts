import { checkOrigin, storeUser, errorResponse } from '@/lib/store/server';
import { saveProduct } from '@/lib/store/admin';
export const runtime = 'nodejs';
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { checkOrigin(request); await storeUser(true); return Response.json(await saveProduct(await request.json(), (await context.params).id), { headers: { 'Cache-Control': 'private, no-store' } }); }
  catch (error) { return errorResponse(error); }
}
