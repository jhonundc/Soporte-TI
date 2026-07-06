"use client";

import { lazyClient } from "@/lib/lazy/client";
import { Skeleton } from "@/components/ui/skeleton";

const modalFallback = (
  <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/5">
    <Skeleton className="h-96 w-full max-w-md rounded-xl" />
  </div>
);

export const BienFormModal = lazyClient(
  () => import("@/components/inventory/BienFormModal"),
  { fallback: modalFallback }
);

export const ComponenteFormModal = lazyClient(
  () => import("@/components/inventory/ComponenteFormModal"),
  { fallback: modalFallback }
);

export const SoftwareFormModal = lazyClient(
  () => import("@/components/inventory/SoftwareFormModal"),
  { fallback: modalFallback }
);
