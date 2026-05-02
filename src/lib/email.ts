type EmailEnv = {
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
};

export async function sendEmail(
  env: EmailEnv,
  opts: { to: string | string[]; subject: string; html: string; text?: string }
): Promise<{ id?: string }> {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY 환경변수 없음');
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend 발송 실패: ${res.status} ${text}`);
  }
  return res.json();
}
