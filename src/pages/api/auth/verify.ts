import type { APIRoute } from 'astro';
import { getEnv } from '../../../lib/runtime';
import { verifyMagicToken, createSessionToken, makeSessionCookie } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
  const url = new URL(ctx.request.url);
  const token = url.searchParams.get('t');
  if (!token) return new Response('Missing token', { status: 400 });

  let env: ENV;
  try {
    env = getEnv(ctx);
  } catch (e: any) {
    return new Response('Env error: ' + e?.message, { status: 500 });
  }

  const payload = await verifyMagicToken(env.AUTH_SECRET, token);
  if (!payload || payload.e !== env.ADMIN_EMAIL) {
    return new Response(
      '<html><body style="font-family:sans-serif;padding:3rem;max-width:520px;margin:0 auto;"><h1>로그인 링크가 만료되었거나 유효하지 않습니다</h1><p>다시 시도해주세요. <a href="/admin/login">로그인 페이지로 돌아가기 →</a></p></body></html>',
      { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const session = await createSessionToken(env.AUTH_SECRET, env.ADMIN_EMAIL, 7);
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/admin',
      'Set-Cookie': makeSessionCookie(session),
    },
  });
};
