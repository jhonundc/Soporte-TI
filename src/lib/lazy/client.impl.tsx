"use client";

import dynamic from "next/dynamic";
import type { ComponentType, ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type Loader = () => Promise<{ default: ComponentType<any> }>;

export function lazyClient<P extends object = object>(
  loader: Loader,
  options?: {
    fallback?: ReactNode;
    ssr?: boolean;
  }
) {
  return dynamic(loader, {
    ssr: options?.ssr ?? false,
    loading: () =>
      options?.fallback ?? (
        <Skeleton className="h-64 w-full rounded-xl" aria-label="Cargando módulo" />
      ),
  });
}
