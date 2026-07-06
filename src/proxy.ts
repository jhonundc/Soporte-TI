import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

const PUBLIC_API_ROUTES = ["/api/auth/login", "/api/auth/logout"];

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname.startsWith("/login");
  const isApiRoute = pathname.startsWith("/api");

  if (isApiRoute) {
    if (isPublicApiRoute(pathname)) {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión nuevamente." },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      const response = NextResponse.json(
        { error: "Sesión inválida o expirada." },
        { status: 401 }
      );
      response.cookies.delete("auth_token");
      return response;
    }

    return NextResponse.next();
  }

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token) {
    const payload = await verifyToken(token);

    if (!payload && !isAuthPage) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }

    if (payload && isAuthPage) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
