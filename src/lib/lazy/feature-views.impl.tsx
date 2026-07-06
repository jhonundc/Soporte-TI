"use client";

import { PageContentSkeleton } from "@/components/data-display/PageContentSkeleton";
import { lazyClient } from "@/lib/lazy/client";

export const FichaPageView = lazyClient(
  () =>
    import("@/features/soporte/ficha/FichaPageView").then((module) => ({
      default: module.FichaPageView,
    })),
  { fallback: <PageContentSkeleton /> }
);

export const BajaPageView = lazyClient(
  () =>
    import("@/features/soporte/baja/BajaPageView").then((module) => ({
      default: module.BajaPageView,
    })),
  { fallback: <PageContentSkeleton /> }
);

export const DashboardCharts = lazyClient(
  () =>
    import("@/components/dashboard/DashboardCharts").then((module) => ({
      default: module.DashboardCharts,
    })),
  {
    fallback: (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-[360px] animate-pulse rounded-xl bg-muted lg:col-span-2" />
        <div className="h-[360px] animate-pulse rounded-xl bg-muted" />
        <div className="h-[360px] animate-pulse rounded-xl bg-muted lg:col-span-2" />
        <div className="h-[360px] animate-pulse rounded-xl bg-muted" />
      </div>
    ),
  }
);
