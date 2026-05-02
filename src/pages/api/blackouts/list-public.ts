import type { APIRoute } from 'astro';
import { getKV, jsonResponse, serverError } from '../../../lib/runtime';
import { listBlackouts } from '../../../lib/blackouts';

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
  let kv: KVNamespace;
  try { kv = getKV(ctx); } catch (e: any) { return serverError(e?.message); }
  const items = await listBlackouts(kv);
  return jsonResponse(
    { ok: true, items },
    { headers: { 'Cache-Control': 'public, max-age=60' } }
  );
};
