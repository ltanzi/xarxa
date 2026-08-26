import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reportSchema } from "@/lib/validations";
import { sendReportAlertEmail } from "@/lib/email";

// Distinct reporters needed before a post is pulled off the board
// pending review. Reports are unique per (post, reporter), so this
// can't be reached by one account spamming.
const AUTO_CLOSE_THRESHOLD = 3;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;
  const reporterId = session.user.id;

  try {
    const body = await request.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, title: true, closed: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.authorId === reporterId) {
      return NextResponse.json({ error: "Cannot report your own post" }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        postId,
        reporterId,
        reason: parsed.data.reason,
        details: parsed.data.details || null,
      },
    });

    // Make the "we will review it" promise true: count distinct reports,
    // auto-close at the threshold, and email the operator either way.
    // Neither step may fail the request — the report row is already saved.
    let reportCount = 1;
    let autoClosed = false;
    try {
      reportCount = await prisma.report.count({ where: { postId } });
      if (reportCount >= AUTO_CLOSE_THRESHOLD && !post.closed) {
        await prisma.post.update({ where: { id: postId }, data: { closed: true } });
        autoClosed = true;
      }
    } catch (err) {
      console.error("[report] auto-close check failed:", err);
    }
    try {
      await sendReportAlertEmail({
        postId,
        postTitle: post.title,
        reason: parsed.data.reason,
        details: parsed.data.details || null,
        reportCount,
        autoClosed,
      });
    } catch (err) {
      console.error("[report] operator alert email failed:", err);
    }

    return NextResponse.json({ id: report.id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Already reported" }, { status: 409 });
    }
    console.error("[report POST error]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
