import type { APIRoute } from 'astro';
import { getKV, getEnv, badRequest, unauthorized, jsonResponse, serverError } from '../../../lib/runtime';
import { isAuthenticated } from '../../../lib/auth';
import { getReview, putReview, deleteReview } from '../../../lib/reviews';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  let env: ENV;
  try { env = getEnv(ctx); } catch (e: any) { return serverError(e?.message); }
  if (!(await isAuthenticated(env.AUTH_SECRET, ctx.request, env.ADMIN_EMAIL || ''))) {
    return unauthorized();
  }

  let body: any;
  try { body = await ctx.request.json(); } catch { return badRequest('잘못된 요청'); }

  const id = body?.id;
  const action = body?.action;
  if (!id || !action) return badRequest('id, action 필수');
  if (action !== 'approve' && action !== 'reject') return badRequest('action 오류');

  let kv: KVNamespace;
  try { kv = getKV(ctx); } catch (e: any) { return serverError(e?.message); }

  const review = await getReview(kv, 'pending', id);
  if (!review) return badRequest('후기를 찾을 수 없습니다.');

  if (action === 'approve') {
    await putReview(kv, 'approved', { ...review, approvedAt: new Date().toISOString() });
  } else {
    await putReview(kv, 'rejected', { ...review, rejectedAt: new Date().toISOString() });
  }
  await deleteReview(kv, 'pending', id);

  return jsonResponse({ ok: true });
};
