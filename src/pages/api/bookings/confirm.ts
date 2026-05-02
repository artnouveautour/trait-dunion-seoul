import type { APIRoute } from 'astro';
import { getKV, getEnv, badRequest, unauthorized, jsonResponse, serverError } from '../../../lib/runtime';
import { isAuthenticated } from '../../../lib/auth';
import { findBooking, moveBooking, type Booking } from '../../../lib/bookings';
import { sendEmail } from '../../../lib/email';
import { confirmationEmail } from '../../../lib/bookingEmails';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  let env: ENV;
  try { env = getEnv(ctx); } catch (e: any) { return serverError(e?.message); }
  if (!(await isAuthenticated(env.AUTH_SECRET, ctx.request, env.ADMIN_EMAIL || ''))) return unauthorized();

  let body: any;
  try { body = await ctx.request.json(); } catch { return badRequest('잘못된 요청'); }
  const { id, meetingPlace, meetingTime, notes } = body || {};
  if (!id || !meetingPlace || !meetingTime) return badRequest('id, meetingPlace, meetingTime 필수');

  let kv: KVNamespace;
  try { kv = getKV(ctx); } catch (e: any) { return serverError(e?.message); }

  const booking = await findBooking(kv, id);
  if (!booking) return badRequest('예약 정보를 찾을 수 없습니다.');

  const updated: Booking = {
    ...booking,
    confirmation: {
      meetingPlace: String(meetingPlace),
      meetingTime: String(meetingTime),
      notes: notes ? String(notes) : undefined,
      sentAt: new Date().toISOString(),
    },
  };

  try {
    const tpl = confirmationEmail(updated);
    await sendEmail(env, { to: updated.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
  } catch (e: any) {
    return serverError('예약확인증 발송 실패: ' + (e?.message || e));
  }

  await moveBooking(kv, booking.status, 'confirmed', updated);
  return jsonResponse({ ok: true });
};
