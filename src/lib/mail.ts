import nodemailer from "nodemailer";

// Magic-link e-mail via SMTP. Provider-agnostic — works with Gmail or a
// transactional provider like Brevo. Configured through env vars:
//   SMTP_USER          — SMTP login (Gmail address, or Brevo login)
//   SMTP_PASS          — SMTP password / app password / API key
//   MAIL_FROM_ADDRESS  — visible sender address (defaults to SMTP_USER).
//                        With Brevo this is your verified sender (your Gmail),
//                        while SMTP_USER is the Brevo login.
//   MAIL_FROM_NAME     — display name, defaults to "WVH Koersapp"
//   SMTP_HOST          — defaults to smtp.gmail.com
//   SMTP_PORT          — defaults to 465 (SSL); use 587 for Brevo (STARTTLS)
export function isMailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMagicLinkEmail(to: string, url: string) {
  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? 465);
  const secure = port === 465; // 465 = implicit TLS; 587 = STARTTLS
  const user = process.env.SMTP_USER as string;
  const pass = process.env.SMTP_PASS as string;
  const fromAddress = process.env.MAIL_FROM_ADDRESS ?? user;
  const fromName = process.env.MAIL_FROM_NAME ?? "WVH Koersapp";
  const from = `"${fromName}" <${fromAddress}>`;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  // Plain, personal, transactional tone. Heavy marketing markup and
  // image-only bodies are what spam filters punish.
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:440px;margin:0 auto;color:#111;font-size:15px;line-height:1.6">
    <p>Hoi,</p>
    <p>Je vroeg een inloglink aan voor de <strong>WVH Koersapp</strong>, de fietsritten-app van Wielerclub Holten. Klik op de knop om in te loggen:</p>
    <p style="margin:24px 0">
      <a href="${url}" style="background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block">Inloggen bij WVH Koersapp</a>
    </p>
    <p style="color:#555;font-size:13px">De link is 30 minuten geldig en werkt één keer. Heb je dit niet aangevraagd, negeer deze mail dan gewoon.</p>
    <p style="color:#555;font-size:13px;word-break:break-all">Werkt de knop niet? Kopieer deze link naar je browser:<br><a href="${url}" style="color:#1E3A8A">${url}</a></p>
    <p style="color:#999;font-size:12px;margin-top:24px">Met vriendelijke groet,<br>Wielerclub Holten</p>
  </div>`;

  const text = [
    "Hoi,",
    "",
    "Je vroeg een inloglink aan voor de WVH Koersapp (fietsritten-app van Wielerclub Holten).",
    "Klik op onderstaande link om in te loggen:",
    url,
    "",
    "De link is 30 minuten geldig en werkt één keer.",
    "Heb je dit niet aangevraagd, negeer deze mail dan gewoon.",
    "",
    "Met vriendelijke groet,",
    "Wielerclub Holten",
  ].join("\n");

  await transporter.sendMail({
    from,
    replyTo: fromAddress,
    to,
    subject: "Je inloglink voor WVH Koersapp",
    text,
    html,
    headers: {
      "List-Unsubscribe": `<mailto:${fromAddress}?subject=uitschrijven>`,
      "X-Auto-Response-Suppress": "All",
    },
  });
}
