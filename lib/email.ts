type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

export function emailDeliveryConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM);
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character] || character);
}

export async function sendEmail(message: EmailMessage) {
  if (!emailDeliveryConfigured()) return { ok: false, error: "email_not_configured" } as const;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": message.idempotencyKey,
    },
    body: JSON.stringify({
      from: process.env.AUTH_EMAIL_FROM,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });
  return response.ok ? { ok: true } as const : { ok: false, error: `provider_${response.status}` } as const;
}

export function emailFrame(title: string, body: string, buttonLabel: string, buttonUrl: string) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f5eee7;font-family:Arial,sans-serif;color:#44252b"><div style="max-width:560px;margin:32px auto;padding:32px;background:#fff;border-radius:20px"><p style="color:#a64d3b;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Movimento Volta Pra Você</p><h1 style="font-family:Georgia,serif;color:#6f1833">${title}</h1><p style="font-size:16px;line-height:1.65">${body}</p><p style="margin:28px 0"><a href="${buttonUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#7d1d3e;color:#fff;text-decoration:none;font-weight:700">${buttonLabel}</a></p><p style="font-size:13px;color:#775f63">Se você não reconhece esta mensagem, responda a este e-mail para falar com o atendimento.</p></div></body></html>`;
}
