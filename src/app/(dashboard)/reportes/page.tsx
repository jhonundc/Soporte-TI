"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReportesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/reportes/inventario");
  }, [router]);

  return null;
}
