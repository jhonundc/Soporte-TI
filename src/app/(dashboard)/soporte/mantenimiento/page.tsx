"use client";

import Link from "next/link";
import { Wrench } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/data-display/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

export default function MantenimientoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mantenimiento programado"
        description="Este módulo aún no está disponible en el sistema."
      />
      <EmptyState
        icon={Wrench}
        title="En desarrollo"
        description="El historial de mantenimiento programado no tiene backend activo. Registre intervenciones mediante fichas de soporte técnico."
        action={
          <Link href="/soporte/ficha" className={cn(buttonVariants())}>
            Ir a fichas de soporte
          </Link>
        }
      />
    </div>
  );
}
