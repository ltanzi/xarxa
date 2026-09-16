import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { feedbackSchema } from "@/lib/validations";
import { sendFeedbackEmail } from "@/lib/email";
import { limit, rateLimited } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Signed in, but deliberately NOT email-verified: someone stuck on the
  // verification step is exactly the person whose feedback is worth most,
  // so this doesn't use requireVerifiedUser like posts and connections do.
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Keyed on the account rather than the IP: with sign-in required, an
  // account is the thing worth limiting, and it survives a changing IP.
  const rl = limit(`feedback:${session.user.id}`, 5, 60 * 60 * 1000);
  if (!rl.ok) return rateLimited(rl.retryAfterSec);

  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    await sendFeedbackEmail({
      message: parsed.data.message,
      from: {
        id: session.user.id,
        name: session.user.name ?? "(no name)",
        email: session.user.email ?? "(no email)",
      },
      locale: request.cookies.get("locale")?.value ?? "en",
      path: parsed.data.path ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[feedback POST error]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
