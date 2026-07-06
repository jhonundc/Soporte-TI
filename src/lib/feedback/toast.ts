import { toast } from "sonner";

function show(
  type: "success" | "error" | "warning" | "info",
  message: string,
  description?: string
) {
  const opts = description ? { description } : undefined;
  toast[type](message, opts);
}

export const notify = {
  success: (message: string, description?: string) => show("success", message, description),
  error: (message: string, description?: string) => show("error", message, description),
  warning: (message: string, description?: string) => show("warning", message, description),
  info: (message: string, description?: string) => show("info", message, description),

  fromError(error: unknown, fallback = "Ocurrió un error inesperado") {
    const message =
      error instanceof Error && error.message
        ? error.message
        : typeof error === "string" && error
          ? error
          : fallback;
    notify.error(message);
  },
};
