import nodemailer from "nodemailer";

// Magic-link e-mail via SMTP (Gmail by default). Configured through env vars:
//   SMTP_USER      — the Gmail address (e.g. infojongsma@gmail.com)
//   SMTP_PASS      — a Google "app password" (16 chars, not the normal password)
//   MAIL_FROM_NAME — optional display name, defaults to "WVH Koersapp"
//   SMTP_HOST      — optional, defaults to smtp.gmail.com
//   SMTP_PORT      — optional, defaults to 465 (SSL)
export function isMailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMagicLinkEmail(to: string, url: string) {
  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? 465);
  const secure = port === 465;
  const user = process.env.SMTP_USER as string;
  const pass = process.env.SMTP_PASS as string;
  const fromName = process.env.MAIL_FROM_NAME ?? "WVH Koersapp";

  // The From address MUST match the authenticated Gmail account so that
  // Gmail's SPF + DKIM signatures line up with the visible sender — the
  // single biggest lever against landing in spam.
  const from = `"${fromName}" <${user}>`;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  // Plain, personal, transactional tone. Minimal styling — heavy marketing
  // markup and image-only bodies are what spam filters punish.
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
    sender: user, // envelope alignment with the authenticated account
    replyTo: user,
    to,
    subject: "Je inloglink voor WVH Koersapp",
    text,
    html,
    headers: {
      // Signals a legitimate, user-initiated transactional message.
      "List-Unsubscribe": `<mailto:${user}?subject=uitschrijven>`,
      "X-Auto-Response-Suppress": "All",
    },
    envelope: { from: user, to },
  });
}
