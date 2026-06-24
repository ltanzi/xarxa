import { Resend } from "resend";
import { render } from "@react-email/render";
import { env } from "@/lib/env";
import VerifyEmail from "@/emails/VerifyEmail";

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

  const verifyUrl = `${env.NEXTAUTH_URL}/api/auth/verify-email?token=${plainToken}`;
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
