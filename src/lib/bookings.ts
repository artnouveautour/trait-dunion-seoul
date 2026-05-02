// 예약 워크플로우 — 손님 견적 요청 → 견적 발송 → 입금 확인 → 예약확인증 발송
//
// KV 키 규칙 (REVIEWS_KV namespace 공유)
//   booking:<status>:<id>
//
// 상태 흐름
//   new       → 손님이 contact 폼으로 막 제출 (운영자가 봐야 할 것)
//   quoted    → 운영자가 견적을 손님에게 발송 완료 (입금 대기)
//   paid      → 운영자가 입금 확인
//   confirmed → 예약확인증을 손님에게 발송 완료
//   cancelled → 취소 (운영자 또는 손님 요청)

import type { Tour } from './reviews';

export type BookingStatus = 'new' | 'quoted' | 'paid' | 'confirmed' | 'cancelled';

export const BOOKING_STATUS_ORDER: BookingStatus[] = ['new', 'quoted', 'paid', 'confirmed', 'cancelled'];

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  new: '신규',
  quoted: '견적 발송',
  paid: '입금 확인',
  confirmed: '확정',
  cancelled: '취소',
};

export type BookingMessage = {
  id: string;
  from: 'customer' | 'admin';
  text: string;
  sentAt: string;
};

export type Booking = {
  id: string;
  status: BookingStatus;

  // 손님이 폼에서 입력한 것
  name: string;
  email: string;
  kakao?: string;
  people?: string;
  service: Tour['service'];
  serviceLabel: string;
  date?: string; // YYYY-MM-DD
  duration?: string;
  message?: string;

  // 손님이 자기 예약 페이지에 접근할 때 쓰는 토큰
  customerToken?: string;

  // 손님-운영자 메시지 thread
  messages?: BookingMessage[];

  // 운영자가 채우는 것
  quote?: {
    amount: string; // 사람이 자유롭게 입력 (€350, ₩540,000 등)
    breakdown?: string;
    bankInfo?: string;
    sentAt: string;
  };
  paid?: {
    amount?: string;
    method?: string; // 한국 계좌 / 프랑스 계좌
    confirmedAt: string;
    note?: string;
  };
  confirmation?: {
    meetingPlace: string;
    meetingTime: string;
    notes?: string;
    sentAt: string;
  };
  cancelled?: {
    reason?: string;
    cancelledAt: string;
    by: 'admin' | 'customer';
  };

  // 운영자 자유 메모 (내부)
  adminNotes?: string;

  // 메타
  createdAt: string;
  updatedAt: string;
};

export async function getBooking(
  kv: KVNamespace,
  status: BookingStatus,
  id: string
): Promise<Booking | null> {
  const raw = await kv.get(`booking:${status}:${id}`);
  return raw ? (JSON.parse(raw) as Booking) : null;
}

export async function findBooking(kv: KVNamespace, id: string): Promise<Booking | null> {
  for (const s of BOOKING_STATUS_ORDER) {
    const b = await getBooking(kv, s, id);
    if (b) return b;
  }
  return null;
}

export async function putBooking(
  kv: KVNamespace,
  status: BookingStatus,
  booking: Booking
): Promise<void> {
  await kv.put(`booking:${status}:${booking.id}`, JSON.stringify(booking));
}

export async function deleteBooking(
  kv: KVNamespace,
  status: BookingStatus,
  id: string
): Promise<void> {
  await kv.delete(`booking:${status}:${id}`);
}

export async function moveBooking(
  kv: KVNamespace,
  fromStatus: BookingStatus,
  toStatus: BookingStatus,
  booking: Booking
): Promise<void> {
  const updated: Booking = { ...booking, status: toStatus, updatedAt: new Date().toISOString() };
  await putBooking(kv, toStatus, updated);
  if (fromStatus !== toStatus) {
    await deleteBooking(kv, fromStatus, booking.id);
  }
}

export async function listBookings(
  kv: KVNamespace,
  status: BookingStatus
): Promise<Booking[]> {
  const list = await kv.list({ prefix: `booking:${status}:` });
  const items: Booking[] = [];
  for (const k of list.keys) {
    const raw = await kv.get(k.name);
    if (raw) items.push(JSON.parse(raw) as Booking);
  }
  items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return items;
}

export async function listAllBookings(
  kv: KVNamespace
): Promise<Record<BookingStatus, Booking[]>> {
  const out = {} as Record<BookingStatus, Booking[]>;
  for (const s of BOOKING_STATUS_ORDER) {
    out[s] = await listBookings(kv, s);
  }
  return out;
}

export function newId(): string {
  return crypto.randomUUID();
}
