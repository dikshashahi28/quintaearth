// Outgoing mail (sign-in links, later enquiry alerts). Server-only.
// Without EMAIL_API_KEY the link is printed to the dev server log instead, so login works locally.
import { env } from 'cloudflare:workers';

interface Mail { to: string; subject: string; text: string; html: string }

/** dev only: mail that would have been sent, read by /api/dev/outbox for local testing */
export const devOutbox: Mail[] = [];

export async function sendMail(mail: Mail): Promise<void> {
  if (!env.EMAIL_API_KEY) {
    if (import.meta.env.DEV) {
      console.log(`\n[mail] to ${mail.to}: ${mail.subject}\n${mail.text}\n`);
      devOutbox.push(mail);
      return;
    }
    throw new Error('EMAIL_API_KEY is not set');
  }
  // EMAIL_API_URL is only set for end-to-end tests, to catch mail locally; production posts to the provider
  const res = await fetch(env.EMAIL_API_URL || 'https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.EMAIL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html }),
  });
  if (!res.ok) throw new Error(`Mail not sent: ${res.status} ${await res.text()}`);
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function signInLinkMail(to: string, url: string): Mail {
  return {
    to,
    subject: 'Your QuintaEarth sign-in link',
    text: `Sign in to QuintaEarth:\n${url}\n\nThe link works once and expires in 10 minutes. If you did not ask for it, ignore this email.`,
    html: `<p>Sign in to QuintaEarth:</p><p><a href="${escape(url)}">Sign in</a></p><p>The link works once and expires in 10 minutes. If you did not ask for it, ignore this email.</p>`,
  };
}

/** a plain notice with one link: enquiry alerts, replies, invitations, identity-check decisions */
export function noticeMail(to: string, subject: string, lines: string[], link?: { label: string; url: string }): Mail {
  return {
    to,
    subject,
    text: [...lines, ...(link ? ['', `${link.label}: ${link.url}`] : [])].join('\n'),
    html: [...lines.map((l) => `<p>${escape(l)}</p>`), ...(link ? [`<p><a href="${escape(link.url)}">${escape(link.label)}</a></p>`] : [])].join(''),
  };
}
