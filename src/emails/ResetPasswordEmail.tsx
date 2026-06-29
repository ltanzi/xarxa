import { Body, Container, Head, Heading, Html, Link, Preview, Text } from "@react-email/components";

type Locale = "en" | "es" | "ca";

const copy = {
  en: {
    preview: "Reset your xarxa password",
    heading: "Reset your password",
    body: "Click the link below to choose a new password for your xarxa account. This link expires in 1 hour.",
    cta: "Reset password",
    ignore: "If you didn't request a password reset, you can ignore this email — your current password stays unchanged.",
  },
  es: {
    preview: "Restablece tu contraseña de xarxa",
    heading: "Restablece tu contraseña",
    body: "Haz clic en el enlace de abajo para elegir una nueva contraseña para tu cuenta de xarxa. Este enlace caduca en 1 hora.",
    cta: "Restablecer contraseña",
    ignore: "Si no has solicitado restablecer la contraseña, puedes ignorar este correo — tu contraseña actual no cambiará.",
  },
  ca: {
    preview: "Restableix la teva contrasenya de xarxa",
    heading: "Restableix la teva contrasenya",
    body: "Fes clic a l'enllaç de sota per triar una nova contrasenya per al teu compte de xarxa. Aquest enllaç caduca en 1 hora.",
    cta: "Restablir contrasenya",
    ignore: "Si no has demanat restablir la contrasenya, pots ignorar aquest correu — la teva contrasenya actual no canviarà.",
  },
};

export default function ResetPasswordEmail({ locale, resetUrl }: { locale: Locale; resetUrl: string }) {
  const t = copy[locale];
  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#EDE8E0", padding: "32px" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", backgroundColor: "#fff", padding: "32px" }}>
          <Heading as="h1" style={{ fontSize: "24px", marginBottom: "16px" }}>
            {t.heading}
          </Heading>
          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>{t.body}</Text>
          <Text style={{ marginTop: "24px" }}>
            <Link
              href={resetUrl}
              style={{
                display: "inline-block",
                padding: "12px 24px",
                backgroundColor: "#000",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              {t.cta}
            </Link>
          </Text>
          <Text style={{ fontSize: "14px", color: "#888", marginTop: "32px" }}>{t.ignore}</Text>
          <Text style={{ fontSize: "12px", color: "#aaa", marginTop: "16px", wordBreak: "break-all" }}>{resetUrl}</Text>
        </Container>
      </Body>
    </Html>
  );
}
