export type { JWTPayload } from "@/lib/auth/jwt";

export interface SessionResponse {
  authenticated: boolean;
  user?: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
  error?: string;
}

export interface ApiErrorResponse {
  error: string;
}

export type UserRole = "Administrador" | "Soporte" | string;
