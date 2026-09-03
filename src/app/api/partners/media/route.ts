import { NextResponse } from "next/server";
import { MediaUploadError, saveUploadedImage } from "@/lib/media";
import { requirePartnerSession } from "@/lib/partner-auth";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const partner = await requirePartnerSession();
    if (!partner) {
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

    const origin = new URL(request.url).origin;
    const saved = await saveUploadedImage(file, "shop-");
    return NextResponse.json({ url: `${origin}${saved.url}` });
  } catch (err) {
    if (err instanceof MediaUploadError) {
      return jsonError(err.message, err.status);
    }
    console.error("Partner media upload failed:", err);
    return jsonError("Upload failed. Try a JPEG or PNG under 3 MB.", 500);
  }
}
