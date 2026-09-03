import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { MediaUploadError, saveUploadedImage } from "@/lib/media";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return jsonError("Unauthorized", 401);
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return jsonError(
        "Could not read the uploaded file. Try a JPEG or PNG under 3 MB.",
        400,
      );
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return jsonError("No file provided", 400);
    }

    const saved = await saveUploadedImage(file);
    return NextResponse.json({ url: saved.url });
  } catch (err) {
    if (err instanceof MediaUploadError) {
      return jsonError(err.message, err.status);
    }
    console.error("Media upload failed:", err);
    return jsonError("Upload failed. Try a JPEG or PNG under 3 MB.", 500);
  }
}
