import type { APIRoute } from 'astro';
import { getKV, badRequest, unauthorized, jsonResponse, serverError } from '../../../lib/runtime';
import { getTour, putTour, putReview, sanitizeText, type Review } from '../../../lib/reviews';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  let body: any;
  try {
    body = await ctx.request.json();
  } catch {
    return badRequest('잘못된 요청 형식');
  }

  const { token, name, rating, text } = body || {};
  if (!token || !name || !rating || !text) {
    return badRequest('필수 항목 누락 (token, name, rating, text)');
  }

  let kv: KVNamespace;
  try {
    kv = getKV(ctx);
  } catch (e: any) {
    return serverError(e?.message || 'KV 미설정');
  }

  const tour = await getTour(kv, String(token));
  if (!tour) return unauthorized('유효하지 않은 후기 작성 링크입니다.');
  if (tour.used) return unauthorized('이미 후기가 제출된 링크입니다. 수정이 필요하면 contact@traitdunionseoul.com 으로 알려주세요.');

  const ratingNum = Number.parseInt(String(rating), 10);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return badRequest('별점은 1~5 범위여야 합니다.');
  }

  const cleanName = sanitizeText(name, 60);
  const cleanText = sanitizeText(text, 2000);
  if (cleanName.length < 1) return badRequest('성함이 비어 있습니다.');
  if (cleanText.length < 10) return badRequest('후기 내용이 너무 짧습니다 (최소 10자).');

  const id = crypto.randomUUID();
  const review: Review = {
    id,
    name: cleanName,
    service: tour.service,
    serviceLabel: tour.serviceLabel,
    tourDate: tour.tourDate,
    rating: ratingNum as 1 | 2 | 3 | 4 | 5,
    text: cleanText,
    submittedAt: new Date().toISOString(),
    tokenUsed: tour.token,
  };

  await putReview(kv, 'pending', review);
  await putTour(kv, { ...tour, used: true, usedAt: new Date().toISOString() });

  return jsonResponse({ ok: true, id });
};
