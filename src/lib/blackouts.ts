// 캘린더 차단 날짜 (운영자 휴무·만석)
// KV 키: blackout:<YYYY-MM-DD>  → { date, reason?, addedAt }

export type Blackout = {
  date: string; // YYYY-MM-DD
  reason?: string;
  addedAt: string;
};

export async function listBlackouts(kv: KVNamespace): Promise<Blackout[]> {
  const list = await kv.list({ prefix: 'blackout:' });
  const items: Blackout[] = [];
  for (const k of list.keys) {
    const raw = await kv.get(k.name);
    if (raw) items.push(JSON.parse(raw) as Blackout);
  }
  items.sort((a, b) => a.date.localeCompare(b.date));
  return items;
}

export async function addBlackout(
  kv: KVNamespace,
  date: string,
  reason?: string
): Promise<Blackout> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('날짜 형식 오류 (YYYY-MM-DD)');
  }
  const item: Blackout = { date, reason, addedAt: new Date().toISOString() };
  await kv.put('blackout:' + date, JSON.stringify(item));
  return item;
}

export async function removeBlackout(kv: KVNamespace, date: string): Promise<void> {
  await kv.delete('blackout:' + date);
}
