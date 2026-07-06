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

  const { saveMutation, handleDelete } = useBajaMutations();
  const form = useBajaForm(catalogs, saveMutation);

  const [detailOpen, setDetailOpen] = useState(false);
  const [viewingBaja, setViewingBaja] = useState<BajaRecord | null>(null);
  const [printActionOpen, setPrintActionOpen] = useState(false);
  const [selectedBajaForPrint, setSelectedBajaForPrint] = useState<BajaRecord | null>(null);

  return (
    <div className="space-y-6 p-6">
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
