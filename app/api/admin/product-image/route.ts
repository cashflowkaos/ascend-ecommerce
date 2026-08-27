import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Select an image to upload." },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Use a JPG, PNG or WebP image." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Image must be 5 MB or smaller." },
      { status: 400 }
    );
  }

  const extension =
    file.name.split(".").pop()?.toLowerCase() || "jpg";

  const filename =
    `products/${crypto.randomUUID()}.${extension}`;

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not configured."
    );
  }

  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
    token,
  });

  return NextResponse.json({
    url: blob.url,
  });
}