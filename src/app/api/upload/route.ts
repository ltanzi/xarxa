import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { createId } from "@paralleldrive/cuid2";
import sharp from "sharp";
import { limit, rateLimited } from "@/lib/rate-limit";

const MAX_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 512;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const { error, session } = await requireVerifiedUser();
  if (error) return error;

  const rl = limit(`upload:${session.user.id}`, 20, 24 * 60 * 60 * 1000);
  if (!rl.ok) return rateLimited(rl.retryAfterSec);

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, or WebP" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Crop to 512x512 and convert to WebP for consistent profile photos
    let optimized: Buffer;
    try {
      optimized = await sharp(buffer)
        .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "cover" })
        .webp({ quality: 80 })
        .toBuffer();
    } catch (err) {
      console.error("[upload] Image processing failed:", err);
      return NextResponse.json({ error: "Could not process image. Please try a different file." }, { status: 400 });
    }

    const filename = `${createId()}.webp`;
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), optimized);

    const profilePhoto = `/uploads/${filename}`;
    await prisma.user.update({
      where: { id: session.user.id },
      data: { profilePhoto },
    });

    return NextResponse.json({ profilePhoto });
  } catch (e) {
    console.error("[upload error]", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
