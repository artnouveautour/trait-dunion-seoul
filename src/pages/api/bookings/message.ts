import type { APIRoute } from 'astro';
import { getKV, getEnv, badRequest, unauthorized, jsonResponse, serverError } from '../../../lib/runtime';
import { isAuthenticated } from '../../../lib/auth';
import { findBooking, putBooking, type Booking, type BookingMessage } from '../../../lib/bookings';
import { sanitizeText } from '../../../lib/reviews';
import { sendEmail } from '../../../lib/email';
import { customerMessageNotifyEmail, adminMessageNotifyEmail } from '../../../lib/bookingEmails';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  let env: ENV;
  try { env = getEnv(ctx); } catch (e: any) { return serverError(e?.message); }

  let body: any;
  try { body = await ctx.request.json(); } catch { return badRequest('잘못된 요청'); }

  const id = String(body?.id || '');
  const text = sanitizeText(body?.text, 4000);
  const customerToken = body?.customerToken ? String(body.customerToken) : null;

  if (!id || !text || text.length < 1) return badRequest('id, text 필수');

  let kv: KVNamespace;
  try { kv = getKV(ctx); } catch (e: any) { return serverError(e?.message); }

  const booking = await findBooking(kv, id);
  if (!booking) return badRequest('예약을 찾을 수 없습니다.');

  let from: 'customer' | 'admin';
  if (await isAuthenticated(env.AUTH_SECRET, ctx.request, env.ADMIN_EMAIL || '')) {
    from = 'admin';
  } else if (customerToken && booking.customerToken && customerToken === booking.customerToken) {
    from = 'customer';
  } else {
    return unauthorized('인증 실패 — 운영자 로그인 또는 손님 토큰 필요');
  }

  const msg: BookingMessage = {
    id: crypto.randomUUID(),
    from,
    text,
    sentAt: new Date().toISOString(),
  };
  const updated: Booking = {
    ...booking,
    messages: [...(booking.messages || []), msg],
    updatedAt: new Date().toISOString(),
  };
  await putBooking(kv, booking.status, updated);

  // 상대방에게 메일 알림 (실패해도 응답엔 영향 없음)
  const baseUrl = (env.SITE_URL || '').replace(/\/$/, '');
  if (env.RESEND_API_KEY) {
    try {
      if (from === 'customer') {
        const tpl = customerMessageNotifyEmail(updated, text, baseUrl + '/admin/bookings/' + id);
        await sendEmail(env, { to: env.ADMIN_EMAIL, subject: tpl.subject, html: tpl.html, text: tpl.text });
      } else {
        const customerUrl = baseUrl + '/booking/' + id + '?t=' + encodeURIComponent(updated.customerToken || '');
        const tpl = adminMessageNotifyEmail(updated, text, customerUrl);
        await sendEmail(env, { to: updated.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
      }
    } catch { /* swallow */ }
  }

  return jsonResponse({ ok: true, message: msg });
};
