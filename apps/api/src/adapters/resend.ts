import { env } from '../env.js';

const RESEND_API_URL = 'https://api.resend.com/emails';

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

export type SendEmailResult = {
  id: string;
} | null;

export function isResendAvailable(): boolean {
  return Boolean(env.RESEND_API_KEY);
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!env.RESEND_API_KEY) {
    if (env.NODE_ENV !== 'production') {
      console.info('[resend noop]', input.subject, input.to);
    }
    return null;
  }

  const body = {
    from: input.from ?? 'UDEC Cereté <noreply@udccerete.edu.co>',
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
    html: input.html,
    text: input.text,
    reply_to: input.replyTo,
  };

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Resend API error ${response.status}: ${detail}`);
  }

  const payload = (await response.json()) as { id?: string };
  return payload.id ? { id: payload.id } : null;
}
