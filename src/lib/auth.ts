// HMAC-SHA256 기반 매직 링크 + 세션 토큰.
// Cloudflare Workers Web Crypto API 호환.

function base64urlEncode(buf: Uint8Array): string {
  let s = '';
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(s: string): Uint8Array {
  let p = s.replace(/-/g, '+').replace(/_/g, '/');
  while (p.length % 4) p += '=';
  const bin = atob(p);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacSign(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return base64urlEncode(new Uint8Array(sig));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export type MagicTokenPayload = { e: string; exp: number; n: string; kind: 'magic' };
export type SessionPayload = { e: string; exp: number; sid: string; kind: 'session' };

async function makeToken(secret: string, payload: object): Promise<string> {
  const json = JSON.stringify(payload);
  const b64 = base64urlEncode(new TextEncoder().encode(json));
  const sig = await hmacSign(secret, b64);
  return b64 + '.' + sig;
}

async function readToken<T extends { exp: number }>(
  secret: string,
  token: string
): Promise<T | null> {
  if (!token) return null;
  const idx = token.lastIndexOf('.');
  if (idx <= 0) return null;
  const b64 = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = await hmacSign(secret, b64);
  if (!constantTimeEqual(expected, sig)) return null;
  let payload: T;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64urlDecode(b64))) as T;
  } catch {
    return null;
  }
  if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
  return payload;
}

export async function createMagicToken(
  secret: string,
  email: string,
  ttlMinutes = 30
): Promise<string> {
  const payload: MagicTokenPayload = {
    e: email,
    exp: Date.now() + ttlMinutes * 60 * 1000,
    n: crypto.randomUUID(),
    kind: 'magic',
  };
  return makeToken(secret, payload);
}

export async function verifyMagicToken(
  secret: string,
  token: string
): Promise<MagicTokenPayload | null> {
  const p = await readToken<MagicTokenPayload>(secret, token);
  return p && p.kind === 'magic' ? p : null;
}

export async function createSessionToken(
  secret: string,
  email: string,
  ttlDays = 7
): Promise<string> {
  const payload: SessionPayload = {
    e: email,
    exp: Date.now() + ttlDays * 24 * 60 * 60 * 1000,
    sid: crypto.randomUUID(),
    kind: 'session',
  };
  return makeToken(secret, payload);
}

export async function verifySessionToken(
  secret: string,
  token: string
): Promise<SessionPayload | null> {
  const p = await readToken<SessionPayload>(secret, token);
  return p && p.kind === 'session' ? p : null;
}

export const SESSION_COOKIE = 'tdu_admin_session';

export function makeSessionCookie(value: string, maxAgeSec = 7 * 24 * 60 * 60): string {
  return (
    SESSION_COOKIE +
    '=' +
    value +
    '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' +
    maxAgeSec
  );
}

export function clearSessionCookie(): string {
  return SESSION_COOKIE + '=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

export function readSessionCookie(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie') || '';
  const parts = cookieHeader.split(/;\s*/);
  for (const part of parts) {
    if (part.startsWith(SESSION_COOKIE + '=')) {
      return decodeURIComponent(part.slice(SESSION_COOKIE.length + 1));
    }
  }
  return null;
}

export async function isAuthenticated(
  secret: string,
  req: Request,
  adminEmail: string
): Promise<boolean> {
  const cookie = readSessionCookie(req);
  if (!cookie) return false;
  const payload = await verifySessionToken(secret, cookie);
  return !!payload && payload.e === adminEmail;
}
