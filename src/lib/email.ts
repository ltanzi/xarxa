import { Resend } from "resend";
import { render } from "@react-email/render";
import { env } from "@/lib/env";
import VerifyEmail from "@/emails/VerifyEmail";
import ResetPasswordEmail from "@/emails/ResetPasswordEmail";

const client = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export type Locale = "en" | "es" | "ca";

export async function sendVerificationEmail(
  email: string,
  locale: Locale,
  plainToken: string,
): Promise<void> {
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set; skipping send", { email, locale });
    return;
  }

  // Link to the interstitial page (not /api/...); the page POSTs the
  // token so corporate link-prefetchers can't consume it.
  const verifyUrl = `${env.NEXTAUTH_URL}/auth/verify?token=${encodeURIComponent(plainToken)}`;
  const subject = {
    en: "Verify your email — xarxa",
    es: "Verifica tu email — xarxa",
    ca: "Verifica el teu correu — xarxa",
  }[locale];

  const html = await render(VerifyEmail({ locale, verifyUrl }));
  const { error } = await client.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject,
    html,
  });
  if (error) throw new Error(`Resend send failed: ${error.message}`);
}

export async function sendPasswordResetEmail(
  email: string,
  locale: Locale,
  plainToken: string,
): Promise<void> {
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set; skipping send", { email, locale });
    return;
  }

  const resetUrl = `${env.NEXTAUTH_URL}/auth/reset-password?token=${encodeURIComponent(plainToken)}`;
  const subject = {
    en: "Reset your password — xarxa",
    es: "Restablece tu contraseña — xarxa",
    ca: "Restableix la teva contrasenya — xarxa",
  }[locale];

  const html = await render(ResetPasswordEmail({ locale, resetUrl }));
  const { error } = await client.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject,
    html,
  });
  if (error) throw new Error(`Resend send failed: ${error.message}`);
}
