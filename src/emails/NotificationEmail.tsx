import { Body, Container, Head, Heading, Html, Link, Preview, Text } from "@react-email/components";

// One layout for every notification email (interest received, interest
// accepted, unread messages, post-expiry nudge). The per-type, per-locale
// copy lives in src/lib/email.ts — this component only renders it, so the
// visual shell stays identical to VerifyEmail/ResetPasswordEmail.
export interface NotificationEmailProps {
  preview: string;
  heading: string;
  body: string;
  cta: string;
  url: string;
  footer: string;
}

export default function NotificationEmail({ preview, heading, body, cta, url, footer }: NotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#EDE8E0", padding: "32px" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", backgroundColor: "#fff", padding: "32px" }}>
          <Heading as="h1" style={{ fontSize: "24px", marginBottom: "16px" }}>
            {heading}
          </Heading>
          <Text style={{ fontSize: "16px", lineHeight: "24px" }}>{body}</Text>
          <Text style={{ marginTop: "24px" }}>
            <Link
              href={url}
              style={{
                display: "inline-block",
                padding: "12px 24px",
                backgroundColor: "#000",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              {cta}
            </Link>
          </Text>
          <Text style={{ fontSize: "14px", color: "#888", marginTop: "32px" }}>{footer}</Text>
          <Text style={{ fontSize: "12px", color: "#aaa", marginTop: "16px", wordBreak: "break-all" }}>{url}</Text>
        </Container>
      </Body>
    </Html>
  );
}
