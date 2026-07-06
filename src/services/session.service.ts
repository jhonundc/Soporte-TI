export type SessionResponse = {
  authenticated: boolean;
  user?: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
};

export const sessionService = {
  async get(): Promise<SessionResponse> {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      if (!res.ok) return { authenticated: false };
      return data as SessionResponse;
    } catch {
      return { authenticated: false };
    }
  },
};
