import { sessionService } from "@/services/session.service";

export async function fetchSessionClient() {
  const data = await sessionService.get();
  if (!data.authenticated || !data.user) {
    return { user: { role: "", id: null, name: "", username: "" } };
  }
  return data;
}
