"use client";

import { useMemo, useEffect, useState, type UIEvent } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-display/DataTable";
import { TableRowActions, TableActionButton } from "@/components/data-display/TableRowActions";
import { FilterBar, FilterField } from "@/components/forms/FilterBar";
import { IconInput } from "@/components/forms/IconInput";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { Edit, Eye, Printer, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ESTADOS_TICKET } from "@/features/soporte/ficha/hooks/useFichaList";
import { sessionService } from "@/services/session.service";
import type { AreaRef, FichaSoporteRecord, PrioridadRef } from "@/features/soporte/ficha/types";

interface FichaListProps {
  fichas: FichaSoporteRecord[];
  isLoading: boolean;
  error?: Error | null;
  buscarText: string;
  onBuscarChange: (value: string) => void;
  filterEstadoTicket: string;
  onFilterEstadoTicketChange: (value: string) => void;
  filterPrioridad: string;
  onFilterPrioridadChange: (value: string) => void;
  filterArea: string;
  onFilterAreaChange: (value: string) => void;
  activeFilterCount: number;
  onClearFilters: () => void;
  prioridades?: PrioridadRef[];
  areas?: AreaRef[];
  onView: (ficha: FichaSoporteRecord) => void;
  onEdit: (ficha: FichaSoporteRecord) => void;
  onDelete: (id: number) => void;
  onPrint: (ficha: FichaSoporteRecord) => void;
  onTableScroll?: (event: UIEvent<HTMLDivElement>) => void;
  tableFooter?: string;
}

function TicketStatusBadge({ status }: { status?: string | null }) {
  const normalizedStatus = String(status || "").toLowerCase();
  const cerrado = normalizedStatus === "cerrado";
  const aprobado = normalizedStatus === "aprobada";
  const rechazado = normalizedStatus === "rechazada";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        cerrado
          ? "bg-muted text-muted-foreground ring-border"
          : aprobado
            ? "bg-success/10 text-success ring-success/20"
            : rechazado
              ? "bg-destructive/10 text-destructive ring-destructive/20"
              : "bg-warning/10 text-warning ring-warning/20"
      )}
    >
      {status || "-"}
    </span>
  );
}

export function FichaList({
  fichas,
  isLoading,
  error,
  buscarText,
  onBuscarChange,
  filterEstadoTicket,
  onFilterEstadoTicketChange,
  filterPrioridad,
  onFilterPrioridadChange,
  filterArea,
  onFilterAreaChange,
  activeFilterCount,
  onClearFilters,
  prioridades,
  areas,
  onView,
  onEdit,
  onDelete,
  onPrint,
  onTableScroll,
  tableFooter,
}: FichaListProps) {
  const [currentUser, setCurrentUser] = useState<{ id?: number; role?: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await sessionService.get();
        if (!mounted) return;
        if (s.authenticated && s.user) setCurrentUser({ id: s.user.id, role: s.user.role });
        else setCurrentUser(null);
      } catch {
        if (mounted) setCurrentUser(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  const areaOptions = useMemo(
    () =>
      (areas ?? [])
        .filter((area) => area.NombreArea)
        .map((area) => ({
          value: area.NombreArea,
          label: area.NombreArea,
        })),
    [areas]
  );

  const columns = useMemo<ColumnDef<FichaSoporteRecord>[]>(
    () => [
      {
        accessorKey: "NumeroFicha",
        header: "Código",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.NumeroFicha || "-"}</span>
        ),
      },
      {
        id: "bien",
        header: "Bien",
        cell: ({ row }) => row.original.Bien?.Descripcion || "-",
      },
      {
        id: "patrimonial",
        header: "Cód. Patrimonial",
        cell: ({ row }) => row.original.Bien?.CodigoPatrimonial || "-",
      },
      {
        accessorKey: "Responsable",
        header: "Responsable",
        cell: ({ row }) => row.original.Responsable || "-",
      },
      {
        accessorKey: "Dependencia",
        header: "Área",
        cell: ({ row }) => row.original.Dependencia || "-",
      },
      {
        id: "estadoBien",
        header: "Estado",
        cell: ({ row }) => row.original.Estado?.EstadoBien || "-",
      },
      {
        id: "prioridad",
        header: "Prioridad",
        cell: ({ row }) => row.original.Prioridad?.NombrePrioridad || "-",
      },
      {
        id: "estadoTicket",
        header: "Estado Ticket",
        cell: ({ row }) => {
          const estadoAprobacion = String(row.original.EstadoAprobacion || "").trim();
          const estado =
            estadoAprobacion && estadoAprobacion.toUpperCase() !== "PENDIENTE"
              ? estadoAprobacion
              : row.original.EstadoTicket;
          return <TicketStatusBadge status={estado} />;
        },
      },
      {
        id: "usuario",
        header: "Usuario Reg.",
        cell: ({ row }) =>
          row.original.Usuario_Nombres ||
          row.original.UsuarioSoporte?.Nombres ||
          row.original.UsuarioSoporte?.Usuario ||
          "-",
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const ficha = row.original;
          const role = (currentUser?.role || "").toLowerCase();
          const isSoporte = role.includes("soporte");
          const userId = currentUser?.id;
          const canModify = !isSoporte || (ficha.IdUsuarioSoporte && ficha.IdUsuarioSoporte === userId);
          return (
            <TableRowActions>
              <TableActionButton title="Ver ficha" aria-label="Ver ficha" onClick={() => onView(ficha)}>
                <Eye className="size-4" />
              </TableActionButton>
              {canModify && (
                <TableActionButton
                  actionVariant="primary"
                  title="Editar"
                  aria-label="Editar ficha"
                  onClick={() => onEdit(ficha)}
                >
                  <Edit className="size-4" />
                </TableActionButton>
              )}
              {canModify && (
                <TableActionButton
                  actionVariant="destructive"
                  title="Cerrar ticket"
                  aria-label="Cerrar ticket"
                  onClick={() => onDelete(ficha.IdSoporte)}
                >
                  <Trash2 className="size-4" />
                </TableActionButton>
              )}
              <TableActionButton title="Imprimir" aria-label="Imprimir" onClick={() => onPrint(ficha)}>
                <Printer className="size-4" />
              </TableActionButton>
            </TableRowActions>
          );
        },
      },
    ],
    [onDelete, onEdit, onPrint, onView]
  );

  return (
    <div className="space-y-4">
      <FilterBar
        fieldsClassName="lg:grid-cols-4"
        activeCount={activeFilterCount}
        onClear={onClearFilters}
      >
        <FilterField label="Buscar ficha" htmlFor="search-ficha">
          <IconInput
            id="search-ficha"
            icon={Search}
            placeholder="Buscar por N° de ficha..."
            value={buscarText}
            onChange={(event) => onBuscarChange(event.target.value)}
          />
        </FilterField>
        <FilterField label="Estado ticket" htmlFor="filter-estado-ticket">
          <SearchableSelect
            id="filter-estado-ticket"
            value={filterEstadoTicket}
            onValueChange={onFilterEstadoTicketChange}
            options={ESTADOS_TICKET.map((estado) => ({ value: estado, label: estado }))}
            placeholder="Seleccione o busque estado"
            emptyMessage="No hay estados que coincidan"
          />
        </FilterField>
        <FilterField label="Prioridad" htmlFor="filter-prioridad">
          <SearchableSelect
            id="filter-prioridad"
            value={filterPrioridad}
            onValueChange={onFilterPrioridadChange}
            options={(prioridades ?? [])
              .filter((prioridad) => Boolean(prioridad.NombrePrioridad))
              .map((prioridad) => {
                const nombre = String(prioridad.NombrePrioridad ?? "");
                return { value: nombre, label: nombre };
              })}
            placeholder="Seleccione o busque prioridad"
            emptyMessage="No hay prioridades que coincidan"
          />
        </FilterField>
        <FilterField label="Área" htmlFor="filter-area-ficha">
          <SearchableSelect
            id="filter-area-ficha"
            value={filterArea}
            onValueChange={onFilterAreaChange}
            options={areaOptions}
            placeholder="Seleccione o busque área"
            searchPlaceholder="Escriba iniciales o nombre..."
            emptyMessage="No hay áreas que coincidan"
          />
        </FilterField>
      </FilterBar>

      <DataTable
        columns={columns}
        data={fichas}
        isLoading={isLoading}
        error={error}
        emptyMessage="No hay registros"
        tableClassName="text-xs"
        scrollContainerClassName="max-h-[calc(100vh-22rem)] overflow-y-auto"
        onScroll={onTableScroll}
        footer={tableFooter}
      />
    </div>
  );
}
