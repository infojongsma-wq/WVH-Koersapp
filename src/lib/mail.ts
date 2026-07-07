import nodemailer from "nodemailer";

// Magic-link e-mail via SMTP (Gmail by default). Configured through env vars:
//   SMTP_USER   — the Gmail address (e.g. infojongsma@gmail.com)
//   SMTP_PASS   — a Google "app password" (16 chars, not the normal password)
//   MAIL_FROM   — optional display name, defaults to "WVH Koersapp <SMTP_USER>"
//   SMTP_HOST   — optional, defaults to smtp.gmail.com
//   SMTP_PORT   — optional, defaults to 465 (SSL)
export function isMailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMagicLinkEmail(to: string, url: string) {
  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? 465);
  const secure = port === 465;
  const user = process.env.SMTP_USER as string;
  const pass = process.env.SMTP_PASS as string;
  const from = process.env.MAIL_FROM ?? `WVH Koersapp <${user}>`;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#F5F1E6;border-radius:16px;color:#0A0A0A">
    <div style="font-size:28px;margin-bottom:8px">🚴 WVH Koersapp</div>
    <p style="font-size:15px;line-height:1.5">Klik op de knop hieronder om in te loggen bij de fietsritten-app van Wielerclub Holten.</p>
    <p style="margin:24px 0">
      <a href="${url}" style="background:#0A0A0A;color:#fff;text-decoration:none;padding:14px 28px;border-radius:9999px;font-weight:600;display:inline-block">Inloggen</a>
    </p>
    <p style="font-size:12px;color:#6B7280">Deze link is 30 minuten geldig en kan één keer gebruikt worden. Heb je dit niet aangevraagd? Dan kun je deze mail negeren.</p>
    <p style="font-size:12px;color:#6B7280;word-break:break-all">Werkt de knop niet? Plak deze link in je browser:<br>${url}</p>
  </div>`;

  await transporter.sendMail({
    from,
    to,
    subject: "Je inloglink voor WVH Koersapp",
    text: `Klik om in te loggen bij WVH Koersapp:\n${url}\n\nDeze link is 30 minuten geldig en kan één keer gebruikt worden.`,
    html,
  });
}
