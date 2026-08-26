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

// Operator-facing alert when a post gets reported — plain text, no
// template. Without this, reports landed in the DB and nowhere else,
// while the UI promised "we will review it".
export async function sendReportAlertEmail(params: {
  postId: string;
  postTitle: string;
  reason: string;
  details: string | null;
  reportCount: number;
  autoClosed: boolean;
}): Promise<void> {
  if (!client || !env.OPERATOR_EMAIL) {
    console.warn("[email] report alert skipped (no RESEND_API_KEY or OPERATOR_EMAIL)");
    return;
  }
  const { postId, postTitle, reason, details, reportCount, autoClosed } = params;
  const { error } = await client.emails.send({
    from: env.EMAIL_FROM,
    to: env.OPERATOR_EMAIL,
    subject: `xarxa: post reported (${reason}) — "${postTitle}"`,
    text: [
      `Post: ${postTitle}`,
      `${env.NEXTAUTH_URL}/board/${postId}`,
      ``,
      `Reason: ${reason}`,
      details ? `Details: ${details}` : `Details: (none)`,
      `Distinct reports so far: ${reportCount}`,
      autoClosed ? `>> Post auto-closed (threshold reached). Reopen from the post page after review.` : ``,
    ].join("\n"),
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
