import type { APIRoute } from 'astro';
import { getKV, getEnv, badRequest, unauthorized, jsonResponse, serverError } from '../../../lib/runtime';
import { isAuthenticated } from '../../../lib/auth';
import { putTour, SERVICE_LABELS, type Tour } from '../../../lib/reviews';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  let env: ENV;
  try { env = getEnv(ctx); } catch (e: any) { return serverError(e?.message); }

  if (!(await isAuthenticated(env.AUTH_SECRET, ctx.request, env.ADMIN_EMAIL || ''))) {
    return unauthorized();
  }

  let body: any;
  try { body = await ctx.request.json(); } catch { return badRequest('잘못된 요청'); }

  const service = body?.service as keyof typeof SERVICE_LABELS;
  const customerName = body?.customerName;
  const tourDate = body?.tourDate;

  if (!service || !customerName || !tourDate) return badRequest('필수 필드 누락');
  if (!(service in SERVICE_LABELS)) return badRequest('서비스 종류 오류');

  const token = crypto.randomUUID();
  const tour: Tour = {
    token,
    service,
    serviceLabel: SERVICE_LABELS[service],
    customerName: String(customerName).slice(0, 60),
    tourDate: String(tourDate).slice(0, 10),
    issuedAt: new Date().toISOString(),
    used: false,
  };

  let kv: KVNamespace;
  try { kv = getKV(ctx); } catch (e: any) { return serverError(e?.message); }
  await putTour(kv, tour);

  const link = (env.SITE_URL || '').replace(/\/$/, '') + '/review?token=' + encodeURIComponent(token);
  return jsonResponse({ ok: true, token, link, tour });
};
