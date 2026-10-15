import { checkOrigin, storeUser, errorResponse } from '@/lib/store/server';
import { saveProduct } from '@/lib/store/admin';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try { checkOrigin(request); await storeUser(true); return Response.json(await saveProduct(await request.json()), { status: 201, headers: { 'Cache-Control': 'private, no-store' } }); }
  catch (error) { return errorResponse(error); }
}
