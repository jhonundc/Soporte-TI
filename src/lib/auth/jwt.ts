import { SignJWT, jwtVerify } from "jose";

const JWT_EXPIRES_IN = "8h";

export interface JWTPayload {
  id: number;
  username: string;
  role: string;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET es obligatorio en producción. Configure la variable de entorno."
      );
    }
    return new TextEncoder().encode("dev-only-jwt-secret-do-not-use-in-production");
  }

  return new TextEncoder().encode(secret);
}

const secret = getSecretKey();

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
