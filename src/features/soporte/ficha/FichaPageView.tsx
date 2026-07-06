"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { FichaList } from "@/features/soporte/ficha/components/FichaList";
import { FichaFormDialog } from "@/features/soporte/ficha/components/FichaFormDialog";
import { FichaViewDialog } from "@/features/soporte/ficha/components/FichaViewDialog";
import { FichaPrintSection } from "@/features/soporte/ficha/components/FichaPrintSection";
import { useFichaCatalogs } from "@/features/soporte/ficha/hooks/useFichaCatalogs";
import { useFichaList } from "@/features/soporte/ficha/hooks/useFichaList";
import { useFichaMutations } from "@/features/soporte/ficha/hooks/useFichaMutations";
import { useFichaForm } from "@/features/soporte/ficha/hooks/useFichaForm";
import type { FichaSoporteRecord } from "@/features/soporte/ficha/types";

export function FichaPageView() {
  const catalogs = useFichaCatalogs();
  const {
    displayFichas,
    isLoading,
    error,
    buscarText,
    setBuscarText,
    filterEstadoTicket,
    setFilterEstadoTicket,
    filterPrioridad,
    setFilterPrioridad,
    filterArea,
    setFilterArea,
    activeFilterCount,
    clearFilters,
    exportToExcel,
  } = useFichaList();

  const { saveMutation, handleDelete } = useFichaMutations();
  const form = useFichaForm(catalogs, saveMutation);

  const [verOpen, setVerOpen] = useState(false);
  const [viewingFicha, setViewingFicha] = useState<FichaSoporteRecord | null>(null);
  const [printActionOpen, setPrintActionOpen] = useState(false);
  const [selectedFichaForPrint, setSelectedFichaForPrint] = useState<FichaSoporteRecord | null>(
    null
  );

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Fichas de Soporte"
        description="Gestión de incidencias y soporte técnico"
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={exportToExcel}>
              <FileSpreadsheet className="size-4" aria-hidden="true" />
              Exportar
            </Button>
            <Button size="lg" className="gap-2" onClick={form.handleNuevo}>
              <Plus className="size-4" aria-hidden="true" />
              Nueva Ficha
            </Button>
          </>
        }
      />

      <FichaList
        fichas={displayFichas}
        isLoading={isLoading}
        error={error}
        buscarText={buscarText}
        onBuscarChange={setBuscarText}
        filterEstadoTicket={filterEstadoTicket}
        onFilterEstadoTicketChange={setFilterEstadoTicket}
        filterPrioridad={filterPrioridad}
        onFilterPrioridadChange={setFilterPrioridad}
        filterArea={filterArea}
        onFilterAreaChange={setFilterArea}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        prioridades={catalogs.prioridades}
        areas={catalogs.areas}
        onView={(ficha) => {
          setViewingFicha(ficha);
          setVerOpen(true);
        }}
        onEdit={form.handleEdit}
        onDelete={handleDelete}
        onPrint={(ficha) => {
          setSelectedFichaForPrint(ficha);
          setPrintActionOpen(true);
        }}
      />

      <FichaFormDialog
        form={form}
        areas={catalogs.areas}
        prioridades={catalogs.prioridades}
        tiposBien={catalogs.tiposBien}
        bienes={catalogs.bienes}
      />

      <FichaViewDialog open={verOpen} onOpenChange={setVerOpen} ficha={viewingFicha} />

      <FichaPrintSection
        printActionOpen={printActionOpen}
        onPrintActionOpenChange={setPrintActionOpen}
        selectedFicha={selectedFichaForPrint}
      />
    </div>
  );
}
