import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { createId } from "@paralleldrive/cuid2";
import sharp from "sharp";

const MAX_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 512;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    // Resize to max 512x512 and convert to WebP for smaller file size
    const optimized = await sharp(buffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();

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
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
