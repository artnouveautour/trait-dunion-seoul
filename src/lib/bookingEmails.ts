// 예약 워크플로우 이메일 템플릿 (HTML + 텍스트)
import type { Booking } from './bookings';

const BASE_STYLE = "font-family:Arial,'Noto Sans KR',sans-serif;line-height:1.7;color:#1a2238;max-width:560px;margin:0 auto;padding:24px;background:#faf7f0;";
const HEADING = "font-family:Georgia,serif;font-weight:400;font-size:1.4rem;margin:0 0 16px;color:#1a2238;";
const SUB = "font-style:italic;color:#4a5a4d;margin:0 0 16px;";
const TABLE = "width:100%;border-collapse:collapse;margin:1rem 0;font-size:0.9rem;";
const TD_LABEL = "padding:6px 10px;border-bottom:1px solid rgba(26,34,56,0.12);color:#4a5a4d;font-style:italic;width:140px;vertical-align:top;";
const TD_VALUE = "padding:6px 10px;border-bottom:1px solid rgba(26,34,56,0.12);color:#1a2238;";
const FOOT = "margin-top:24px;padding-top:16px;border-top:1px solid rgba(26,34,56,0.12);font-size:0.78rem;color:#4a5a4d;font-style:italic;";

export function quoteEmail(booking: Booking): { subject: string; html: string; text: string } {
  const q = booking.quote!;
  const subject = `[Trait d'Union Séoul] 견적 안내 — ${booking.serviceLabel}`;
  const html =
    `<div style="${BASE_STYLE}">` +
    `<h2 style="${HEADING}">견적 안내</h2>` +
    `<p style="${SUB}">${booking.name} 님, 견적을 보내드립니다.</p>` +
    `<table style="${TABLE}">` +
    `<tr><td style="${TD_LABEL}">서비스</td><td style="${TD_VALUE}">${esc(booking.serviceLabel)}</td></tr>` +
    (booking.date ? `<tr><td style="${TD_LABEL}">일자</td><td style="${TD_VALUE}">${esc(booking.date)}</td></tr>` : '') +
    (booking.duration ? `<tr><td style="${TD_LABEL}">소요 시간</td><td style="${TD_VALUE}">${esc(booking.duration)}</td></tr>` : '') +
    (booking.people ? `<tr><td style="${TD_LABEL}">인원</td><td style="${TD_VALUE}">${esc(booking.people)}</td></tr>` : '') +
    `<tr><td style="${TD_LABEL}">금액</td><td style="${TD_VALUE}"><strong>${esc(q.amount)}</strong></td></tr>` +
    (q.breakdown ? `<tr><td style="${TD_LABEL}">내역</td><td style="${TD_VALUE}; white-space:pre-wrap;">${esc(q.breakdown)}</td></tr>` : '') +
    `</table>` +
    (q.bankInfo ? `<div style="background:#ebe4d6;padding:14px 16px;border-left:2px solid #b08d57;margin:1rem 0;font-size:0.92rem;white-space:pre-wrap;">${esc(q.bankInfo)}</div>` : '') +
    `<p style="margin:1rem 0;">위 견적에 동의하시면 안내드린 계좌로 입금을 진행해주세요. 입금 확인 후 예약확인증을 보내드립니다.</p>` +
    `<p style="${FOOT}">문의 — contact@traitdunionseoul.com<br/>Trait d'Union Séoul</p>` +
    `</div>`;
  const text = [
    `견적 안내`,
    ``,
    `${booking.name} 님, 견적을 보내드립니다.`,
    ``,
    `서비스: ${booking.serviceLabel}`,
    booking.date ? `일자: ${booking.date}` : '',
    booking.duration ? `소요 시간: ${booking.duration}` : '',
    booking.people ? `인원: ${booking.people}` : '',
    `금액: ${q.amount}`,
    q.breakdown ? `내역:\n${q.breakdown}` : '',
    '',
    q.bankInfo ? `입금 안내:\n${q.bankInfo}` : '',
    '',
    `위 견적에 동의하시면 안내드린 계좌로 입금을 진행해주세요. 입금 확인 후 예약확인증을 보내드립니다.`,
    '',
    `문의 — contact@traitdunionseoul.com`,
    `Trait d'Union Séoul`,
  ].filter(Boolean).join('\n');
  return { subject, html, text };
}

export function confirmationEmail(booking: Booking): { subject: string; html: string; text: string } {
  const c = booking.confirmation!;
  const subject = `[Trait d'Union Séoul] 예약확인증 — ${booking.serviceLabel}`;
  const html =
    `<div style="${BASE_STYLE}">` +
    `<h2 style="${HEADING}">예약확인증</h2>` +
    `<p style="${SUB}">${booking.name} 님, 예약이 확정되었습니다.</p>` +
    `<table style="${TABLE}">` +
    `<tr><td style="${TD_LABEL}">예약 번호</td><td style="${TD_VALUE}">${esc(booking.id.slice(0, 8).toUpperCase())}</td></tr>` +
    `<tr><td style="${TD_LABEL}">서비스</td><td style="${TD_VALUE}">${esc(booking.serviceLabel)}</td></tr>` +
    (booking.date ? `<tr><td style="${TD_LABEL}">일자</td><td style="${TD_VALUE}">${esc(booking.date)}</td></tr>` : '') +
    (booking.duration ? `<tr><td style="${TD_LABEL}">소요 시간</td><td style="${TD_VALUE}">${esc(booking.duration)}</td></tr>` : '') +
    (booking.people ? `<tr><td style="${TD_LABEL}">인원</td><td style="${TD_VALUE}">${esc(booking.people)}</td></tr>` : '') +
    `<tr><td style="${TD_LABEL}">손님 성함</td><td style="${TD_VALUE}">${esc(booking.name)}</td></tr>` +
    `<tr><td style="${TD_LABEL}">미팅 장소</td><td style="${TD_VALUE}; white-space:pre-wrap;">${esc(c.meetingPlace)}</td></tr>` +
    `<tr><td style="${TD_LABEL}">미팅 시간</td><td style="${TD_VALUE}">${esc(c.meetingTime)}</td></tr>` +
    `</table>` +
    (c.notes ? `<div style="background:#ebe4d6;padding:14px 16px;border-left:2px solid #b08d57;margin:1rem 0;font-size:0.92rem;white-space:pre-wrap;">${esc(c.notes)}</div>` : '') +
    `<p style="margin:1rem 0;">변경·문의 사항이 있으시면 24시간 안에 contact@traitdunionseoul.com 으로 알려주세요.</p>` +
    `<p style="${FOOT}">Trait d'Union Séoul · contact@traitdunionseoul.com</p>` +
    `</div>`;
  const text = [
    `예약확인증`,
    ``,
    `${booking.name} 님, 예약이 확정되었습니다.`,
    ``,
    `예약 번호: ${booking.id.slice(0, 8).toUpperCase()}`,
    `서비스: ${booking.serviceLabel}`,
    booking.date ? `일자: ${booking.date}` : '',
    booking.duration ? `소요 시간: ${booking.duration}` : '',
    booking.people ? `인원: ${booking.people}` : '',
    `손님 성함: ${booking.name}`,
    `미팅 장소: ${c.meetingPlace}`,
    `미팅 시간: ${c.meetingTime}`,
    '',
    c.notes ? `안내:\n${c.notes}` : '',
    '',
    `변경·문의 사항이 있으시면 24시간 안에 contact@traitdunionseoul.com 으로 알려주세요.`,
    '',
    `Trait d'Union Séoul`,
  ].filter(Boolean).join('\n');
  return { subject, html, text };
}

export function customerAutoReplyEmail(
  booking: Booking,
  bookingUrl: string
): { subject: string; html: string; text: string } {
  const subject = `[Trait d'Union Séoul] 예약 문의가 접수되었습니다 — ${booking.serviceLabel}`;
  const html =
    `<div style="${BASE_STYLE}">` +
    `<h2 style="${HEADING}">예약 문의 접수</h2>` +
    `<p style="${SUB}">${esc(booking.name)} 님, 보내주신 문의가 접수되었습니다. 24시간 내에 시간 확정과 입금 안내를 회신드리겠습니다.</p>` +
    `<table style="${TABLE}">` +
    `<tr><td style="${TD_LABEL}">서비스</td><td style="${TD_VALUE}">${esc(booking.serviceLabel)}</td></tr>` +
    (booking.date ? `<tr><td style="${TD_LABEL}">희망 일자</td><td style="${TD_VALUE}">${esc(booking.date)}</td></tr>` : '') +
    (booking.people ? `<tr><td style="${TD_LABEL}">인원</td><td style="${TD_VALUE}">${esc(booking.people)} 명</td></tr>` : '') +
    `</table>` +
    `<p style="margin:1.4rem 0;"><a href="${bookingUrl}" style="display:inline-block;background:#1a2238;color:#faf7f0;padding:12px 24px;text-decoration:none;letter-spacing:0.18em;font-size:0.85rem;text-transform:uppercase;">예약 페이지 열기 →</a></p>` +
    `<p style="font-size:0.85rem;color:#4a5a4d;">위 링크에서 추가 문의·시간 협의 메시지를 운영자와 주고받을 수 있습니다.</p>` +
    `<p style="${FOOT}">Trait d'Union Séoul · contact@traitdunionseoul.com</p>` +
    `</div>`;
  const text = [
    `예약 문의 접수`,
    ``,
    `${booking.name} 님, 보내주신 문의가 접수되었습니다.`,
    `24시간 내에 시간 확정과 입금 안내를 회신드리겠습니다.`,
    ``,
    `서비스: ${booking.serviceLabel}`,
    booking.date ? `희망 일자: ${booking.date}` : '',
    booking.people ? `인원: ${booking.people} 명` : '',
    '',
    `예약 페이지: ${bookingUrl}`,
    `(추가 문의·시간 협의 메시지를 위 링크에서 보낼 수 있습니다)`,
    '',
    `Trait d'Union Séoul`,
  ].filter(Boolean).join('\n');
  return { subject, html, text };
}

export function customerMessageNotifyEmail(
  booking: Booking,
  text: string,
  bookingUrl: string
): { subject: string; html: string; text: string } {
  const subject = `[Trait d'Union Séoul] ${booking.name} 님의 새 메시지`;
  const html =
    `<div style="${BASE_STYLE}">` +
    `<h2 style="${HEADING}">손님 메시지 도착</h2>` +
    `<p style="${SUB}">${esc(booking.name)} 님 (${esc(booking.serviceLabel)}) 이 새 메시지를 보냈습니다.</p>` +
    `<div style="background:#ebe4d6;padding:14px 16px;border-left:2px solid #b08d57;margin:1rem 0;font-size:0.95rem;line-height:1.7;white-space:pre-wrap;">${esc(text)}</div>` +
    `<p style="margin:1.4rem 0;"><a href="${bookingUrl}" style="display:inline-block;background:#1a2238;color:#faf7f0;padding:12px 24px;text-decoration:none;letter-spacing:0.18em;font-size:0.85rem;text-transform:uppercase;">어드민에서 답변 →</a></p>` +
    `</div>`;
  const txt = [
    `${booking.name} 님 (${booking.serviceLabel}) 이 새 메시지를 보냈습니다.`,
    ``,
    `--- 메시지 ---`,
    text,
    `------------`,
    ``,
    `어드민: ${bookingUrl}`,
  ].join('\n');
  return { subject, html, text: txt };
}

export function adminMessageNotifyEmail(
  booking: Booking,
  text: string,
  bookingUrl: string
): { subject: string; html: string; text: string } {
  const subject = `[Trait d'Union Séoul] 운영자 답변 — ${booking.serviceLabel}`;
  const html =
    `<div style="${BASE_STYLE}">` +
    `<h2 style="${HEADING}">운영자 답변 도착</h2>` +
    `<p style="${SUB}">${esc(booking.name)} 님, 운영자가 새 메시지를 보냈습니다.</p>` +
    `<div style="background:#ebe4d6;padding:14px 16px;border-left:2px solid #b08d57;margin:1rem 0;font-size:0.95rem;line-height:1.7;white-space:pre-wrap;">${esc(text)}</div>` +
    `<p style="margin:1.4rem 0;"><a href="${bookingUrl}" style="display:inline-block;background:#1a2238;color:#faf7f0;padding:12px 24px;text-decoration:none;letter-spacing:0.18em;font-size:0.85rem;text-transform:uppercase;">예약 페이지에서 답장 →</a></p>` +
    `<p style="${FOOT}">Trait d'Union Séoul</p>` +
    `</div>`;
  const txt = [
    `${booking.name} 님, 운영자가 새 메시지를 보냈습니다.`,
    ``,
    `--- 메시지 ---`,
    text,
    `------------`,
    ``,
    `예약 페이지에서 답장: ${bookingUrl}`,
    ``,
    `Trait d'Union Séoul`,
  ].join('\n');
  return { subject, html, text: txt };
}

export function adminNotifyNewBooking(booking: Booking, adminUrl: string): { subject: string; html: string; text: string } {
  const subject = `[Trait d'Union Séoul] 새 견적 요청 — ${booking.name} (${booking.serviceLabel})`;
  const html =
    `<div style="${BASE_STYLE}">` +
    `<h2 style="${HEADING}">새 견적 요청이 들어왔습니다</h2>` +
    `<table style="${TABLE}">` +
    `<tr><td style="${TD_LABEL}">손님</td><td style="${TD_VALUE}">${esc(booking.name)}</td></tr>` +
    `<tr><td style="${TD_LABEL}">이메일</td><td style="${TD_VALUE}">${esc(booking.email)}</td></tr>` +
    (booking.kakao ? `<tr><td style="${TD_LABEL}">카카오톡</td><td style="${TD_VALUE}">${esc(booking.kakao)}</td></tr>` : '') +
    `<tr><td style="${TD_LABEL}">서비스</td><td style="${TD_VALUE}">${esc(booking.serviceLabel)}</td></tr>` +
    (booking.date ? `<tr><td style="${TD_LABEL}">희망 일자</td><td style="${TD_VALUE}">${esc(booking.date)}</td></tr>` : '') +
    (booking.duration ? `<tr><td style="${TD_LABEL}">소요 시간</td><td style="${TD_VALUE}">${esc(booking.duration)}</td></tr>` : '') +
    (booking.people ? `<tr><td style="${TD_LABEL}">인원</td><td style="${TD_VALUE}">${esc(booking.people)}</td></tr>` : '') +
    (booking.message ? `<tr><td style="${TD_LABEL}">요청 사항</td><td style="${TD_VALUE}; white-space:pre-wrap;">${esc(booking.message)}</td></tr>` : '') +
    `</table>` +
    `<p style="margin:1.4rem 0;"><a href="${adminUrl}" style="display:inline-block;background:#1a2238;color:#faf7f0;padding:12px 24px;text-decoration:none;letter-spacing:0.18em;font-size:0.85rem;text-transform:uppercase;">어드민에서 보기 →</a></p>` +
    `</div>`;
  const text = [
    `새 견적 요청이 들어왔습니다`,
    ``,
    `손님: ${booking.name}`,
    `이메일: ${booking.email}`,
    booking.kakao ? `카카오톡: ${booking.kakao}` : '',
    `서비스: ${booking.serviceLabel}`,
    booking.date ? `희망 일자: ${booking.date}` : '',
    booking.duration ? `소요 시간: ${booking.duration}` : '',
    booking.people ? `인원: ${booking.people}` : '',
    booking.message ? `요청 사항:\n${booking.message}` : '',
    '',
    `어드민: ${adminUrl}`,
  ].filter(Boolean).join('\n');
  return { subject, html, text };
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
