import type { APIRoute } from 'astro';
import { getKV, getEnv, badRequest, unauthorized, jsonResponse, serverError } from '../../../lib/runtime';
import { isAuthenticated } from '../../../lib/auth';
import { addBlackout, removeBlackout, listBlackouts } from '../../../lib/blackouts';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  let env: ENV;
  try { env = getEnv(ctx); } catch (e: any) { return serverError(e?.message); }
  if (!(await isAuthenticated(env.AUTH_SECRET, ctx.request, env.ADMIN_EMAIL || ''))) {
    return unauthorized();
  }

  let body: any;
  try { body = await ctx.request.json(); } catch { return badRequest('잘못된 요청'); }

  const action = body?.action; // 'add' | 'remove'
  const date = String(body?.date || '');
  const reason = body?.reason ? String(body.reason) : undefined;

  if (!date) return badRequest('date 필수');
  if (action !== 'add' && action !== 'remove') return badRequest('action 오류');

  let kv: KVNamespace;
  try { kv = getKV(ctx); } catch (e: any) { return serverError(e?.message); }

  if (action === 'add') {
    try { await addBlackout(kv, date, reason); }
    catch (e: any) { return badRequest(e?.message || '추가 실패'); }
  } else {
    await removeBlackout(kv, date);
  }

  const items = await listBlackouts(kv);
  return jsonResponse({ ok: true, items });
};
