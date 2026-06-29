import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join } from "path";

// Next.js standalone output snapshots public/ at build time, so files
// written to public/uploads at runtime (via volume mount) are NOT served
// by Next's static handler. We stream them ourselves. The /uploads/* URL
// is rewritten to this route in next.config.mjs so existing DB rows keep
// working without migration.

const TYPE_BY_EXT: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

const SAFE_NAME = /^[A-Za-z0-9_-]+\.(webp|jpg|jpeg|png)$/;

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { filename: string } },
) {
  if (!SAFE_NAME.test(params.filename)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = join(process.cwd(), "public", "uploads", params.filename);

  let size: number;
  try {
    const s = await stat(filePath);
    size = s.size;
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = await readFile(filePath);
  const ext = params.filename.split(".").pop()!.toLowerCase();
  const contentType = TYPE_BY_EXT[ext] || "application/octet-stream";

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": size.toString(),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
