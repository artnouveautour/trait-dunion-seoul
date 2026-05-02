import type { APIRoute } from 'astro';
import { getKV, getEnv, badRequest, unauthorized, jsonResponse, serverError } from '../../../lib/runtime';
import { isAuthenticated } from '../../../lib/auth';
import { findBooking, moveBooking, type Booking } from '../../../lib/bookings';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  let env: ENV;
  try { env = getEnv(ctx); } catch (e: any) { return serverError(e?.message); }
  if (!(await isAuthenticated(env.AUTH_SECRET, ctx.request, env.ADMIN_EMAIL || ''))) return unauthorized();

  let body: any;
  try { body = await ctx.request.json(); } catch { return badRequest('잘못된 요청'); }
  const { id, amount, method, note } = body || {};
  if (!id) return badRequest('id 필수');

  let kv: KVNamespace;
  try { kv = getKV(ctx); } catch (e: any) { return serverError(e?.message); }

  const booking = await findBooking(kv, id);
  if (!booking) return badRequest('예약 정보를 찾을 수 없습니다.');

  const updated: Booking = {
    ...booking,
    paid: {
      amount: amount ? String(amount) : undefined,
      method: method ? String(method) : undefined,
      note: note ? String(note) : undefined,
      confirmedAt: new Date().toISOString(),
    },
  };

  await moveBooking(kv, booking.status, 'paid', updated);
  return jsonResponse({ ok: true });
};
