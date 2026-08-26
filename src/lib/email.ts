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

// ---------------------------------------------------------------------------
// User-facing notification emails. These close the platform's biggest
// retention gap: interest, acceptance, and chat messages only produced
// in-app socket badges, so every interaction stalled the moment the other
// party closed the tab. Copy is per-type, per-locale; the visual shell is
// src/emails/NotificationEmail.tsx.

type NotificationType = "interestReceived" | "interestAccepted" | "newMessages" | "postExpiryNudge";

// {title} is replaced with the post title / sender name per type.
const NOTIFICATION_COPY: Record<NotificationType, Record<Locale, {
  subject: string; preview: string; heading: string; body: string; cta: string; footer: string;
}>> = {
  interestReceived: {
    en: { subject: "Someone is interested in your post — xarxa", preview: "New interest on your post", heading: "Someone is interested", body: "Your post “{title}” got a new interest request. Accept it to open a chat.", cta: "Review in Activity", footer: "You get this email when someone responds to one of your posts on xarxa." },
    es: { subject: "Alguien se interesa por tu publicación — xarxa", preview: "Nuevo interés en tu publicación", heading: "Alguien se interesa", body: "Tu publicación “{title}” ha recibido una nueva solicitud de interés. Acéptala para abrir un chat.", cta: "Revisar en Actividad", footer: "Recibes este correo cuando alguien responde a una de tus publicaciones en xarxa." },
    ca: { subject: "Algú s'interessa per la teva publicació — xarxa", preview: "Nou interès en la teva publicació", heading: "Algú s'interessa", body: "La teva publicació “{title}” ha rebut una nova sol·licitud d'interès. Accepta-la per obrir un xat.", cta: "Revisar a Activitat", footer: "Reps aquest correu quan algú respon a una de les teves publicacions a xarxa." },
  },
  interestAccepted: {
    en: { subject: "Your interest was accepted — xarxa", preview: "Chat is now open", heading: "You're connected", body: "The author of “{title}” accepted your interest. You can now arrange the details in chat.", cta: "Open the chat", footer: "You get this email when a post author accepts your interest on xarxa." },
    es: { subject: "Tu interés fue aceptado — xarxa", preview: "El chat ya está abierto", heading: "Estáis conectados", body: "La persona autora de “{title}” ha aceptado tu interés. Ya podéis organizar los detalles por chat.", cta: "Abrir el chat", footer: "Recibes este correo cuando aceptan tu interés en xarxa." },
    ca: { subject: "El teu interès ha estat acceptat — xarxa", preview: "El xat ja és obert", heading: "Esteu connectats", body: "L'autor/a de “{title}” ha acceptat el teu interès. Ja podeu organitzar els detalls pel xat.", cta: "Obrir el xat", footer: "Reps aquest correu quan accepten el teu interès a xarxa." },
  },
  newMessages: {
    en: { subject: "New message from {title} — xarxa", preview: "You have unread messages", heading: "New message", body: "{title} sent you a message on xarxa.", cta: "Read and reply", footer: "You get this email when you receive a chat message while away. At most one email until you next open the conversation." },
    es: { subject: "Nuevo mensaje de {title} — xarxa", preview: "Tienes mensajes sin leer", heading: "Nuevo mensaje", body: "{title} te ha enviado un mensaje en xarxa.", cta: "Leer y responder", footer: "Recibes este correo cuando llega un mensaje mientras no estás. Como máximo uno hasta que vuelvas a abrir la conversación." },
    ca: { subject: "Missatge nou de {title} — xarxa", preview: "Tens missatges per llegir", heading: "Missatge nou", body: "{title} t'ha enviat un missatge a xarxa.", cta: "Llegir i respondre", footer: "Reps aquest correu quan arriba un missatge mentre no hi ets. Com a màxim un fins que tornis a obrir la conversa." },
  },
  postExpiryNudge: {
    en: { subject: "Is your post still active? — xarxa", preview: "Your post will close soon", heading: "Still active?", body: "Your post “{title}” has been quiet for a while and will close automatically in about a week. Edit it (or reopen it later) to keep it on the board.", cta: "View your post", footer: "Stale posts close automatically so the board stays useful. Reopening takes one click." },
    es: { subject: "¿Tu publicación sigue activa? — xarxa", preview: "Tu publicación se cerrará pronto", heading: "¿Sigue activa?", body: "Tu publicación “{title}” lleva tiempo sin actividad y se cerrará automáticamente en una semana. Edítala (o reábrela más tarde) para mantenerla en el tablón.", cta: "Ver tu publicación", footer: "Las publicaciones inactivas se cierran automáticamente para que el tablón siga siendo útil. Reabrirla es un clic." },
    ca: { subject: "La teva publicació segueix activa? — xarxa", preview: "La teva publicació es tancarà aviat", heading: "Segueix activa?", body: "La teva publicació “{title}” fa temps que no té activitat i es tancarà automàticament d'aquí a una setmana. Edita-la (o reobre-la més tard) per mantenir-la al tauler.", cta: "Veure la publicació", footer: "Les publicacions inactives es tanquen automàticament perquè el tauler segueixi sent útil. Reobrir-la és un clic." },
  },
};

export async function sendNotificationEmail(
  type: NotificationType,
  email: string,
  locale: Locale,
  params: { title: string; path: string },
): Promise<void> {
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set; skipping send", { type, email });
    return;
  }
  const copy = NOTIFICATION_COPY[type][locale] ?? NOTIFICATION_COPY[type].en;
  const fill = (s: string) => s.replace("{title}", params.title);
  const url = `${env.NEXTAUTH_URL}${params.path}`;

  const { default: NotificationEmail } = await import("@/emails/NotificationEmail");
  const html = await render(NotificationEmail({
    preview: fill(copy.preview),
    heading: fill(copy.heading),
    body: fill(copy.body),
    cta: copy.cta,
    url,
    footer: copy.footer,
  }));
  const { error } = await client.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: fill(copy.subject),
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
