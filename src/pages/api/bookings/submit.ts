import type { APIRoute } from 'astro';
import { getKV, getEnv, badRequest, jsonResponse, serverError } from '../../../lib/runtime';
import { putBooking, newId, type Booking } from '../../../lib/bookings';
import { SERVICE_LABELS, sanitizeText } from '../../../lib/reviews';
import { sendEmail } from '../../../lib/email';
import { adminNotifyNewBooking } from '../../../lib/bookingEmails';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  let body: any;
  try { body = await ctx.request.json(); } catch { return badRequest('잘못된 요청'); }

  const name = sanitizeText(body?.name, 60);
  const email = sanitizeText(body?.email, 120);
  const service = String(body?.service || '');
  const kakao = sanitizeText(body?.kakao, 60);
  const people = sanitizeText(body?.people, 10);
  const date = sanitizeText(body?.date, 12);
  const duration = sanitizeText(body?.duration, 30);
  const message = sanitizeText(body?.message, 4000);

  if (!name || !email) return badRequest('이름·이메일은 필수입니다.');
  if (!/^.+@.+\..+$/.test(email)) return badRequest('이메일 형식 오류');
  if (!service) return badRequest('서비스 종류를 선택해주세요.');

  // service 매핑 — contact form에서 'interpretation' / 'vip' / 'versailles' / 'combo' / 'other' 들어옴
  let mapped: keyof typeof SERVICE_LABELS = 'other';
  if (service === 'interpretation') mapped = 'interpretation';
  else if (service === 'vip') mapped = 'vip-guiding';
  else if (service === 'versailles') mapped = 'versailles';
  else if (service === 'combo' || service === 'other') mapped = 'other';
  else mapped = 'other';

  let env: ENV;
  try { env = getEnv(ctx); } catch (e: any) { return serverError(e?.message); }

  let kv: KVNamespace;
  try { kv = getKV(ctx); } catch (e: any) { return serverError(e?.message); }

  const id = newId();
  const now = new Date().toISOString();
  const booking: Booking = {
    id,
    status: 'new',
    name,
    email,
    kakao,
    people,
    service: mapped,
    serviceLabel: SERVICE_LABELS[mapped] + (service === 'combo' ? ' (통역+가이딩 결합)' : ''),
    date,
    duration,
    message,
    createdAt: now,
    updatedAt: now,
  };

  await putBooking(kv, 'new', booking);

  // 운영자 알림 (실패해도 손님 응답에는 영향 없음)
  if (env.RESEND_API_KEY && env.ADMIN_EMAIL) {
    try {
      const adminUrl = (env.SITE_URL || '').replace(/\/$/, '') + '/admin/bookings/' + id;
      const tpl = adminNotifyNewBooking(booking, adminUrl);
      await sendEmail(env, { to: env.ADMIN_EMAIL, subject: tpl.subject, html: tpl.html, text: tpl.text });
    } catch { /* swallow — 손님에게는 OK 응답 */ }
  }

  return jsonResponse({ ok: true, id });
};
