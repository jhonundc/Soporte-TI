"use client";

import { useState } from "react";import { Button } from "@/components/ui/button";
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
  const [formOpen, setFormOpen] = useState(false);
  const catalogs = useFichaCatalogs({ loadFormCatalogs: formOpen });
  const {
    displayFichas,
    filteredCount,
    visibleCount,
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
    handleTableScroll,
    exportToExcel,
  } = useFichaList();

  const { saveMutation, deleteEvidenceMutation, handleDelete } = useFichaMutations();
  const form = useFichaForm(catalogs, saveMutation, deleteEvidenceMutation, setFormOpen);
  const [verOpen, setVerOpen] = useState(false);
  const [viewingFicha, setViewingFicha] = useState<FichaSoporteRecord | null>(null);
  const [printActionOpen, setPrintActionOpen] = useState(false);
  const [selectedFichaForPrint, setSelectedFichaForPrint] = useState<FichaSoporteRecord | null>(
    null
  );

  return (
    <div className="space-y-8 px-4 py-6 lg:px-8">
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

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-card px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">Gestión operativa</p>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Registro de fichas de soporte</h2>
            <p className="mt-1 text-sm text-muted-foreground">Consulta, filtra y gestiona las incidencias registradas.</p>
          </div>
          <div className="rounded-xl border border-primary/15 bg-card/80 px-4 py-3 text-sm shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resultados</p>
            <p className="mt-1 text-2xl font-semibold text-primary">{filteredCount}</p>
          </div>
        </div>
        <div className="p-4 sm:p-6">
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
            onTableScroll={handleTableScroll}
            tableFooter={
              !isLoading && filteredCount > 0
                ? `Mostrando ${Math.min(visibleCount, filteredCount)} de ${filteredCount} fichas`
                : undefined
            }
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
        </div>
      </section>

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
