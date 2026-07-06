import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken, type JWTPayload } from "@/lib/auth/jwt";

export type SessionUser = JWTPayload;

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(): Promise<
  { session: SessionUser } | { error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      error: NextResponse.json(
        { error: "No autorizado. Inicie sesión nuevamente." },
        { status: 401 }
      ),
    };
  }
  return { session };
}

export function requireRole(
  session: SessionUser,
  allowedRoles: string[]
): NextResponse | null {
  const role = session.role?.toLowerCase() ?? "";
  const allowed = allowedRoles.map((r) => r.toLowerCase());
  const isAllowed = allowed.some(
    (r) => role === r || role.includes(r) || r.includes(role)
  );

  if (!isAllowed) {
    return NextResponse.json(
      { error: "No tiene permisos para realizar esta acción." },
      { status: 403 }
    );
  }

  return null;
}

export function isAdminRole(role: string): boolean {
  const normalized = role.toLowerCase();
  return !normalized.includes("soporte");
}

export async function requireAdmin(): Promise<
  { session: SessionUser } | { error: NextResponse }
> {
  const auth = await requireAuth();
  if ("error" in auth) return auth;

  if (!isAdminRole(auth.session.role)) {
    return {
      error: NextResponse.json(
        { error: "Se requieren permisos de administrador." },
        { status: 403 }
      ),
    };
  }

  return auth;
}

/** Atajo para route handlers: retorna sesión o respuesta HTTP de error */
export async function authSession(): Promise<SessionUser | NextResponse> {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;
  return auth.session;
}

export async function adminSession(): Promise<SessionUser | NextResponse> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  return auth.session;
}

export function guardFailed(value: SessionUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
