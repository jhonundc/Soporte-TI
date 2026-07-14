"use client";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ReportesTabs } from "@/components/reportes/ReportesTabs";
import { buildBreadcrumbs } from "@/lib/navigation/breadcrumbs";
import { usePathname } from "next/navigation";

export default function ReportesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const breadcrumbs = buildBreadcrumbs(pathname);

  return (
    <div className="space-y-8 px-4 py-6 lg:px-8">
      <Breadcrumbs items={breadcrumbs} />
      <ReportesTabs />
      {children}
    </div>
  );
}
