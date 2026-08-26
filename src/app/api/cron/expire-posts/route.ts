import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { sendNotificationEmail, type Locale } from "@/lib/email";

// Stale-board hygiene, invoked by host cron (daily), NOT by users:
//   curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
//     https://xarxa.help/api/cron/expire-posts
//
// Lifecycle of an open post with no edits:
//   day 53  → one "still active?" nudge email (stamped in expiryNudgedAt)
//   day 60  → closed automatically (silent; reopening is one click and
//             bumps updatedAt, restarting the whole clock)
// Any edit bumps updatedAt past expiryNudgedAt, re-arming the nudge.
// A volunteer board's death spiral is a wall of stale posts — this keeps
// the board honest without deleting anything.

const NUDGE_AFTER_DAYS = 53;
const CLOSE_AFTER_DAYS = 60;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const got = request.headers.get("authorization");
  if (!env.CRON_SECRET || got !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const nudgeCutoff = new Date(now - NUDGE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const closeCutoff = new Date(now - CLOSE_AFTER_DAYS * 24 * 60 * 60 * 1000);

  // 1. Close posts quiet for CLOSE_AFTER_DAYS.
  const closed = await prisma.post.updateMany({
    where: { closed: false, updatedAt: { lt: closeCutoff } },
    data: { closed: true },
  });

  // 2. Nudge posts entering the final week — unless already nudged for
  //    this quiet period (expiryNudgedAt newer than the last edit).
  const toNudge = await prisma.post.findMany({
    where: {
      closed: false,
      updatedAt: { lt: nudgeCutoff },
      OR: [{ expiryNudgedAt: null }, { expiryNudgedAt: { lt: prisma.post.fields.updatedAt } }],
    },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      author: { select: { email: true, preferredLanguage: true } },
    },
    take: 50, // bound one run's email volume; cron runs daily
  });

  let nudged = 0;
  for (const post of toNudge) {
    try {
      await sendNotificationEmail(
        "postExpiryNudge",
        post.author.email,
        (post.author.preferredLanguage as Locale) || "en",
        { title: post.title, path: `/board/${post.id}` },
      );
      // Preserve updatedAt explicitly: @updatedAt would auto-bump it,
      // which would reset the 60-day close clock AND make
      // expiryNudgedAt < updatedAt true again — re-nudging daily and
      // postponing the close forever.
      await prisma.post.update({
        where: { id: post.id },
        data: { expiryNudgedAt: new Date(), updatedAt: post.updatedAt },
      });
      nudged++;
    } catch (err) {
      // Don't stamp on failure — the next daily run retries this post.
      console.error("[expire-posts] nudge failed for", post.id, err);
    }
  }

  console.log(`[expire-posts] closed=${closed.count} nudged=${nudged}`);
  return NextResponse.json({ ok: true, closed: closed.count, nudged });
}
