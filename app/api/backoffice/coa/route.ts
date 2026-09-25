import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Select a COA file to upload." },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error:
          "COA must be a PDF, JPG, PNG, or WebP file.",
      },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "COA file must be 10 MB or smaller." },
      { status: 400 }
    );
  }

  const extension = EXTENSIONS[file.type];

  const filename =
    `coas/${crypto.randomUUID()}.${extension}`;

  const oidcToken =
    process.env.VERCEL_OIDC_TOKEN;

  const storeId =
    process.env.BLOB_STORE_ID;

  if (!oidcToken || !storeId) {
    return NextResponse.json(
      {
        error:
          "Blob storage credentials are not configured.",
      },
      { status: 500 }
    );
  }

  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
    oidcToken,
    storeId,
  });

  return NextResponse.json({
    url: blob.url,
  });
}