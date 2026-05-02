import type { APIRoute } from 'astro';
import { getEnv, badRequest, jsonResponse, serverError } from '../../../lib/runtime';
import { createMagicToken } from '../../../lib/auth';
import { sendEmail } from '../../../lib/email';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  let body: any;
  try { body = await ctx.request.json(); } catch { return badRequest('잘못된 요청'); }
  const email = body?.email;
  if (!email || typeof email !== 'string') return badRequest('이메일 누락');

  let env: ENV;
  try { env = getEnv(ctx); } catch (e: any) { return serverError(e?.message); }
  if (!env.AUTH_SECRET) return serverError('AUTH_SECRET 미설정');

  const inputEmail = email.toLowerCase().trim();
  const adminEmail = (env.ADMIN_EMAIL || '').toLowerCase().trim();

  // 보안: 이메일이 admin과 일치하지 않아도 200 OK 반환 (정보 노출 방지)
  if (inputEmail !== adminEmail) {
    return jsonResponse({ ok: true });
  }

  const token = await createMagicToken(env.AUTH_SECRET, env.ADMIN_EMAIL, 30);
  const link = env.SITE_URL.replace(/\/$/, '') + '/api/auth/verify?t=' + encodeURIComponent(token);

  try {
    await sendEmail(env, {
      to: env.ADMIN_EMAIL,
      subject: "[Trait d'Union Séoul] 어드민 로그인 링크",
      html:
        '<div style="font-family:Arial,sans-serif;line-height:1.7;color:#1a2238;max-width:520px;margin:0 auto;padding:24px;background:#faf7f0;">' +
        '<h2 style="font-weight:400;font-size:1.4rem;margin:0 0 16px;">어드민 로그인 링크</h2>' +
        '<p style="margin:0 0 16px;">아래 버튼을 30분 안에 클릭하시면 로그인됩니다.</p>' +
        '<p style="margin:0 0 24px;"><a href="' + link + '" style="display:inline-block;background:#1a2238;color:#faf7f0;padding:12px 24px;text-decoration:none;letter-spacing:0.18em;font-size:0.85rem;text-transform:uppercase;">로그인 →</a></p>' +
        '<p style="margin:0;font-size:0.8rem;color:#4a5a4d;">본인이 요청하신 게 아니라면 무시해주세요. 30분 후 자동 만료됩니다.</p>' +
        '</div>',
      text:
        "Trait d'Union Séoul 어드민 로그인 링크 (30분 유효):\n\n" +
        link +
        '\n\n본인이 요청하신 게 아니라면 무시해주세요.',
    });
  } catch (e: any) {
    return serverError('이메일 발송 실패: ' + (e?.message || e));
  }

  return jsonResponse({ ok: true });
};
