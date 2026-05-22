import "server-only";
import nodemailer from "nodemailer";

/**
 * Простий email-сендер.
 *  - У dev або без SMTP_HOST: пише у консоль.
 *  - З SMTP_HOST: відправляє через nodemailer.
 *
 * Для локальної розробки зручно підняти Mailpit/MailHog:
 * SMTP_HOST=127.0.0.1 SMTP_PORT=1025 SMTP_FROM=no-reply@localhost
 */
export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!process.env.SMTP_HOST) {
    // Dev / no-SMTP mode: log so developer бачить URL та може клікнути.
    console.log("\n📧 [EMAIL — mock] To:", input.to);
    console.log("   Subject:", input.subject);
    console.log("   ----- HTML preview -----");
    console.log("  ", stripHtml(input.html));
    console.log("   ------------------------\n");
    return;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "Research Navigator <no-reply@localhost>";

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Templates ────────────────────────────────────────────────────────────

export function buildVerificationEmail(opts: {
  url: string;
  userFirstName?: string;
  locale: "uk" | "en";
}): { subject: string; html: string; text: string } {
  const isUk = opts.locale === "uk";
  const greeting = opts.userFirstName ? `${isUk ? "Привіт" : "Hello"}, ${opts.userFirstName}!` : (isUk ? "Привіт!" : "Hello!");
  const subject = isUk ? "Підтвердіть email — Research Navigator" : "Verify email — Research Navigator";
  const ctaText = isUk ? "Підтвердити пошту" : "Verify email";
  const intro = isUk
    ? "Щоб завершити налаштування акаунта в Research Navigator, підтвердіть свою електронну адресу."
    : "To finish setting up your Research Navigator account, please confirm your email address.";
  const note = isUk
    ? "Якщо ви не реєструвалися — просто проігноруйте цей лист. Посилання діє 24 години."
    : "If you didn't sign up, just ignore this email. The link expires in 24 hours.";

  const html = `
    <div style="font-family: -apple-system,BlinkMacSystemFont,sans-serif;color:#0f172a">
      <h2 style="margin:0 0 16px;color:#0a2640">${greeting}</h2>
      <p style="line-height:1.6;color:#475569">${intro}</p>
      <p style="margin:24px 0">
        <a href="${opts.url}" style="display:inline-block;background:#0f766e;color:#fff;padding:12px 24px;border-radius:12px;font-weight:600;text-decoration:none">${ctaText}</a>
      </p>
      <p style="color:#94a3b8;font-size:12px;line-height:1.6">${note}</p>
      <p style="color:#cbd5e1;font-size:11px;margin-top:32px">— Research Navigator</p>
    </div>
  `;
  const text = `${greeting}\n\n${intro}\n\n${opts.url}\n\n${note}\n\n— Research Navigator`;
  return { subject, html, text };
}

export function buildInviteEmail(opts: {
  url: string;
  inviteeName?: string;
  institutionName: string;
  role: string;
  locale: "uk" | "en";
}): { subject: string; html: string; text: string } {
  const isUk = opts.locale === "uk";
  const greeting = opts.inviteeName
    ? `${isUk ? "Привіт" : "Hello"}, ${opts.inviteeName}!`
    : (isUk ? "Привіт!" : "Hello!");
  const subject = isUk
    ? `Запрошення від «${opts.institutionName}» — Research Navigator`
    : `Invitation from "${opts.institutionName}" — Research Navigator`;
  const intro = isUk
    ? `Адміністратор закладу «${opts.institutionName}» запрошує вас долучитися до Research Navigator як ${opts.role}.`
    : `The admin of "${opts.institutionName}" has invited you to join Research Navigator as ${opts.role}.`;
  const ctaText = isUk ? "Прийняти запрошення" : "Accept invitation";
  const note = isUk
    ? "Якщо ви не очікували цього запрошення — просто проігноруйте лист. Посилання діє 7 днів."
    : "If you weren't expecting this invitation, just ignore it. The link expires in 7 days.";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#0f172a">
      <h2 style="margin:0 0 16px;color:#0a2640">${greeting}</h2>
      <p style="line-height:1.6;color:#475569">${intro}</p>
      <p style="margin:24px 0">
        <a href="${opts.url}" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:12px;font-weight:600;text-decoration:none">${ctaText}</a>
      </p>
      <p style="color:#94a3b8;font-size:12px;line-height:1.6">${note}</p>
      <p style="color:#cbd5e1;font-size:11px;margin-top:32px">— Research Navigator</p>
    </div>
  `;
  const text = `${greeting}\n\n${intro}\n\n${opts.url}\n\n${note}\n\n— Research Navigator`;
  return { subject, html, text };
}

export function buildVerifiedEmail(opts: {
  institutionName: string;
  locale: "uk" | "en";
}): { subject: string; html: string; text: string } {
  const isUk = opts.locale === "uk";
  const subject = isUk
    ? `«${opts.institutionName}» верифіковано — Research Navigator`
    : `"${opts.institutionName}" verified — Research Navigator`;
  const msg = isUk
    ? `Вітаємо! Ваш заклад «${opts.institutionName}» пройшов верифікацію в Research Navigator. Тепер ваш публічний профіль відображає значок «Верифіковано».`
    : `Congratulations! Your institution "${opts.institutionName}" has been verified on Research Navigator. Your public profile now shows a "Verified" badge.`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#0f172a">
      <h2 style="margin:0 0 16px;color:#0a2640">✅ ${isUk ? "Верифікацію підтверджено" : "Verification confirmed"}</h2>
      <p style="line-height:1.6;color:#475569">${msg}</p>
      <p style="color:#cbd5e1;font-size:11px;margin-top:32px">— Research Navigator</p>
    </div>
  `;
  return { subject, html, text: msg };
}

export function buildPasswordResetEmail(opts: {
  url: string;
  userFirstName?: string;
  locale: "uk" | "en";
}): { subject: string; html: string; text: string } {
  const isUk = opts.locale === "uk";
  const greeting = opts.userFirstName ? `${isUk ? "Привіт" : "Hello"}, ${opts.userFirstName}!` : (isUk ? "Привіт!" : "Hello!");
  const subject = isUk ? "Скидання пароля — Research Navigator" : "Password reset — Research Navigator";
  const ctaText = isUk ? "Встановити новий пароль" : "Set new password";
  const intro = isUk
    ? "Ви запитали скидання пароля. Натисніть на кнопку нижче, щоб встановити новий."
    : "You requested a password reset. Click the button below to set a new one.";
  const note = isUk
    ? "Якщо це не ви — просто проігноруйте лист. Посилання діє 1 годину."
    : "If this wasn't you, just ignore this email. The link expires in 1 hour.";

  const html = `
    <div style="font-family: -apple-system,BlinkMacSystemFont,sans-serif;color:#0f172a">
      <h2 style="margin:0 0 16px;color:#0a2640">${greeting}</h2>
      <p style="line-height:1.6;color:#475569">${intro}</p>
      <p style="margin:24px 0">
        <a href="${opts.url}" style="display:inline-block;background:#be123c;color:#fff;padding:12px 24px;border-radius:12px;font-weight:600;text-decoration:none">${ctaText}</a>
      </p>
      <p style="color:#94a3b8;font-size:12px;line-height:1.6">${note}</p>
      <p style="color:#cbd5e1;font-size:11px;margin-top:32px">— Research Navigator</p>
    </div>
  `;
  const text = `${greeting}\n\n${intro}\n\n${opts.url}\n\n${note}\n\n— Research Navigator`;
  return { subject, html, text };
}
