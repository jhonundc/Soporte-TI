"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { BajaList } from "@/features/soporte/baja/components/BajaList";
import { BajaFormDialog } from "@/features/soporte/baja/components/BajaFormDialog";
import { BajaViewDialog } from "@/features/soporte/baja/components/BajaViewDialog";
import { BajaPrintSection } from "@/features/soporte/baja/components/BajaPrintSection";
import { useBajaCatalogs } from "@/features/soporte/baja/hooks/useBajaCatalogs";
import { useBajaList } from "@/features/soporte/baja/hooks/useBajaList";
import { useBajaMutations } from "@/features/soporte/baja/hooks/useBajaMutations";
import { useBajaForm } from "@/features/soporte/baja/hooks/useBajaForm";
import type { BajaRecord } from "@/features/soporte/baja/types";

export function BajaPageView() {
  const catalogs = useBajaCatalogs();
  const {
    displayBajas,
    isLoading,
    error,
    buscarText,
    setBuscarText,
    filterArea,
    setFilterArea,
    filterCondicion,
    setFilterCondicion,
    filterEstado,
    setFilterEstado,
    activeFilterCount,
    clearFilters,
  } = useBajaList();

  const { saveMutation, deleteEvidenceMutation, handleDelete } = useBajaMutations();
  const form = useBajaForm(catalogs, saveMutation, deleteEvidenceMutation);

  const [detailOpen, setDetailOpen] = useState(false);
  const [viewingBaja, setViewingBaja] = useState<BajaRecord | null>(null);
  const [printActionOpen, setPrintActionOpen] = useState(false);
  const [selectedBajaForPrint, setSelectedBajaForPrint] = useState<BajaRecord | null>(null);

  return (
    <div className="space-y-8 px-4 py-6 lg:px-8">
      <PageHeader
        title="Fichas de Baja de Bienes"
        description="Gestiona la baja de bienes y equipos."
        actions={
          <Button size="lg" variant="destructive" className="gap-2" onClick={form.handleNuevo}>
            <Plus className="size-4" aria-hidden="true" />
            Nueva Ficha de Baja
          </Button>
        }
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 border-b border-destructive/10 bg-gradient-to-r from-destructive/10 via-destructive/5 to-card px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-destructive">Gestión patrimonial</p>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Registro de fichas de baja</h2>
            <p className="mt-1 text-sm text-muted-foreground">Consulta, filtra y gestiona las solicitudes de baja registradas.</p>
          </div>
          <div className="rounded-xl border border-destructive/15 bg-card/80 px-4 py-3 text-sm shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resultados</p>
            <p className="mt-1 text-2xl font-semibold text-destructive">{displayBajas.length}</p>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <BajaList
            bajas={displayBajas}
            isLoading={isLoading}
            error={error}
            buscarText={buscarText}
            onBuscarChange={setBuscarText}
            filterArea={filterArea}
            onFilterAreaChange={setFilterArea}
            filterCondicion={filterCondicion}
            onFilterCondicionChange={setFilterCondicion}
            filterEstado={filterEstado}
            onFilterEstadoChange={setFilterEstado}
            activeFilterCount={activeFilterCount}
            onClearFilters={clearFilters}
            areas={catalogs.areas}
            condiciones={catalogs.condiciones}
            estados={catalogs.estados}
            onView={(baja) => {
              setViewingBaja(baja);
              setDetailOpen(true);
            }}
            onEdit={form.handleEdit}
            onDelete={handleDelete}
            onPrint={(baja) => {
              setSelectedBajaForPrint(baja);
              setPrintActionOpen(true);
            }}
          />
        </div>
      </section>

      <BajaFormDialog form={form} />

      <BajaViewDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        baja={viewingBaja}
        bienes={catalogs.bienes}
      />

      <BajaPrintSection
        printActionOpen={printActionOpen}
        onPrintActionOpenChange={setPrintActionOpen}
        selectedBaja={selectedBajaForPrint}
        bienes={catalogs.bienes}
      />
    </div>
  );
}
