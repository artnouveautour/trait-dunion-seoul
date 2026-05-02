// KV 키 규칙
//   tour:<tokenId>          → 후기 작성 토큰 (issue 시 생성, submit 시 used:true)
//   review:pending:<id>     → 제출됐으나 미승인
//   review:approved:<id>    → 승인 완료, 사이트에 노출
//   review:rejected:<id>    → 거부 (보관용)

export type Tour = {
  token: string;
  service: 'interpretation' | 'vip-guiding' | 'versailles' | 'other';
  serviceLabel: string;
  customerName: string;
  tourDate: string;
  issuedAt: string;
  used: boolean;
  usedAt?: string;
};

export type Review = {
  id: string;
  name: string;
  service: Tour['service'];
  serviceLabel: string;
  tourDate: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  tokenUsed: string;
};

export const SERVICE_LABELS: Record<Tour['service'], string> = {
  interpretation: '비즈니스 통역',
  'vip-guiding': 'VIP 맞춤 가이딩',
  versailles: '베르사유 궁전 VIP 투어',
  other: '기타',
};

export async function getTour(kv: KVNamespace, token: string): Promise<Tour | null> {
  const raw = await kv.get('tour:' + token);
  return raw ? (JSON.parse(raw) as Tour) : null;
}

export async function putTour(kv: KVNamespace, tour: Tour): Promise<void> {
  await kv.put('tour:' + tour.token, JSON.stringify(tour));
}

export async function getReview(
  kv: KVNamespace,
  status: 'pending' | 'approved' | 'rejected',
  id: string
): Promise<Review | null> {
  const raw = await kv.get(`review:${status}:${id}`);
  return raw ? (JSON.parse(raw) as Review) : null;
}

export async function putReview(
  kv: KVNamespace,
  status: 'pending' | 'approved' | 'rejected',
  review: Review
): Promise<void> {
  await kv.put(`review:${status}:${review.id}`, JSON.stringify(review));
}

export async function deleteReview(
  kv: KVNamespace,
  status: 'pending' | 'approved' | 'rejected',
  id: string
): Promise<void> {
  await kv.delete(`review:${status}:${id}`);
}

export async function listReviews(
  kv: KVNamespace,
  status: 'pending' | 'approved' | 'rejected'
): Promise<Review[]> {
  const list = await kv.list({ prefix: `review:${status}:` });
  const items: Review[] = [];
  for (const k of list.keys) {
    const raw = await kv.get(k.name);
    if (raw) items.push(JSON.parse(raw) as Review);
  }
  items.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
  return items;
}

export function sanitizeText(s: unknown, max = 2000): string {
  const str = String(s ?? '');
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)) {
      out += str[i];
    }
  }
  return out.trim().slice(0, max);
}
