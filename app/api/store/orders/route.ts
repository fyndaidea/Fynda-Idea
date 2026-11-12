import { myOrders } from '@/lib/store/db';
import { errorResponse, storeUser } from '@/lib/store/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await storeUser();
    const orders = await myOrders(user.id);
    return Response.json({ orders }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
