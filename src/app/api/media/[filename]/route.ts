import { NextResponse } from "next/server";
import { getUploadedImage } from "@/lib/media";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ filename: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { filename } = await context.params;
  const file = await getUploadedImage(filename);
  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new Response(Buffer.from(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
