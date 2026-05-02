import type { APIContext } from 'astro';

export function getEnv(ctx: APIContext): ENV {
  const env = (ctx.locals as any).runtime?.env as ENV | undefined;
  if (!env) {
    throw new Error('Cloudflare runtime env not available — 로컬 개발에서는 wrangler pages dev 사용 권장');
  }
  return env;
}

export function getKV(ctx: APIContext): KVNamespace {
  const env = getEnv(ctx);
  if (!env.REVIEWS_KV) {
    throw new Error('REVIEWS_KV binding 없음 — wrangler.toml 또는 Pages 콘솔에서 KV 바인딩 추가');
  }
  return env.REVIEWS_KV;
}

export function jsonResponse(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...(init.headers || {}) },
  });
}

export function badRequest(message: string) {
  return jsonResponse({ ok: false, error: message }, { status: 400 });
}

export function unauthorized(message = '인증 필요') {
  return jsonResponse({ ok: false, error: message }, { status: 401 });
}

export function serverError(message: string) {
  return jsonResponse({ ok: false, error: message }, { status: 500 });
}
