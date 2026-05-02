import type { APIRoute } from 'astro';
import { getKV, jsonResponse, serverError } from '../../../lib/runtime';
import { listReviews } from '../../../lib/reviews';

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
  let kv: KVNamespace;
  try { kv = getKV(ctx); } catch (e: any) { return serverError(e?.message); }

  const items = await listReviews(kv, 'approved');
  const publicItems = items.map((r) => ({
    id: r.id,
    name: r.name,
    service: r.service,
    serviceLabel: r.serviceLabel,
    tourDate: r.tourDate,
    rating: r.rating,
    text: r.text,
    approvedAt: r.approvedAt,
  }));
  return jsonResponse(
    { ok: true, items: publicItems },
    { headers: { 'Cache-Control': 'public, max-age=60' } }
  );
};
