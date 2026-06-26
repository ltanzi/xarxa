import { Body, Container, Head, Heading, Html, Link, Preview, Text } from "@react-email/components";

type Locale = "en" | "es" | "ca";

const copy = {
  en: {
    preview: "Verify your email to start using xarxa",
    heading: "Verify your email",
    body: "Click the link below to verify your email address and finish setting up your xarxa account.",
    cta: "Verify email",
    ignore: "If you didn't sign up for xarxa, you can ignore this email.",
  },
  es: {
    preview: "Verifica tu email para empezar a usar xarxa",
    heading: "Verifica tu email",
    body: "Haz clic en el enlace de abajo para verificar tu correo y completar tu cuenta en xarxa.",
    cta: "Verificar email",
    ignore: "Si no te has registrado en xarxa, puedes ignorar este correo.",
  },
  ca: {
    preview: "Verifica el teu correu per començar a usar xarxa",
    heading: "Verifica el teu correu",
    body: "Fes clic a l'enllaç de sota per verificar el teu correu i completar el teu compte a xarxa.",
    cta: "Verificar correu",
    ignore: "Si no t'has registrat a xarxa, pots ignorar aquest correu.",
  },
};

export default function VerifyEmail({ locale, verifyUrl }: { locale: Locale; verifyUrl: string }) {
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
              href={verifyUrl}
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
          <Text style={{ fontSize: "12px", color: "#aaa", marginTop: "16px", wordBreak: "break-all" }}>{verifyUrl}</Text>
        </Container>
      </Body>
    </Html>
  );
}
