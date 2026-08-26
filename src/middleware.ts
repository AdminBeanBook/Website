import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/auth-session";
import {
  PARTNER_SESSION_COOKIE,
  verifyPartnerSessionToken,
} from "@/lib/partner-session";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/api/admin/login"];
const PUBLIC_PARTNER_PATHS = ["/partners/login", "/api/partners/login"];

function unauthorized(
  request: NextRequest,
  isApi: boolean,
  loginPath: string,
) {
  if (isApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL(loginPath, request.url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPartnerPage =
    pathname === "/partners" || pathname.startsWith("/partners/");
  const isPartnerApi = pathname.startsWith("/api/partners/");
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/");
  const isPreview = pathname === "/preview" || pathname.startsWith("/preview/");

  if (isPartnerPage || isPartnerApi) {
    if (PUBLIC_PARTNER_PATHS.includes(pathname)) {
      return NextResponse.next();
    }
    const token = request.cookies.get(PARTNER_SESSION_COOKIE)?.value;
    if (!token) {
      return unauthorized(request, isPartnerApi, "/partners/login");
    }
    const session = await verifyPartnerSessionToken(token);
    if (!session) {
      const response = unauthorized(request, isPartnerApi, "/partners/login");
      response.cookies.delete(PARTNER_SESSION_COOKIE);
      return response;
    }
    return NextResponse.next();
  }

  if (!isAdminPage && !isAdminApi && !isPreview) {
    return NextResponse.next();
  }

  if (PUBLIC_ADMIN_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return unauthorized(request, isAdminApi, "/admin/login");
  }

  const session = await verifySessionToken(token);
  if (!session) {
    const response = unauthorized(request, isAdminApi, "/admin/login");
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
    "/preview",
    "/preview/:path*",
    "/partners",
    "/partners/:path*",
    "/api/partners/:path*",
  ],
};
