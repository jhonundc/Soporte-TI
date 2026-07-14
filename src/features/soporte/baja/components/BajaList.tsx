"use client";

import { useMemo, useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-display/DataTable";
import { TableRowActions, TableActionButton } from "@/components/data-display/TableRowActions";
import { FilterBar, FilterField } from "@/components/forms/FilterBar";
import { IconInput } from "@/components/forms/IconInput";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { Edit, Eye, Printer, Search, Trash2 } from "lucide-react";
import {
  getCondicionBadgeClass,
  getEstadoBadgeClass,
  type BajaRecord,
} from "@/features/soporte/baja/types";
import { sessionService } from "@/services/session.service";

interface BajaListProps {
  bajas: BajaRecord[];
  isLoading: boolean;
  error?: Error | null;
  buscarText: string;
  onBuscarChange: (value: string) => void;
  filterArea: string;
  onFilterAreaChange: (value: string) => void;
  filterCondicion: string;
  onFilterCondicionChange: (value: string) => void;
  filterEstado: string;
  onFilterEstadoChange: (value: string) => void;
  activeFilterCount: number;
  onClearFilters: () => void;
  areas?: { IdArea: number; NombreArea: string }[];
  condiciones?: { IdCondicion: number; Condicion: string | null }[];
  estados?: { IdEstadoBien: number; EstadoBien: string | null }[];
  onView: (baja: BajaRecord) => void;
  onEdit: (baja: BajaRecord) => void;
  onDelete: (id: number) => void;
  onPrint: (baja: BajaRecord) => void;
}

export function BajaList({
  bajas,
  isLoading,
  error,
  buscarText,
  onBuscarChange,
  filterArea,
  onFilterAreaChange,
  filterCondicion,
  onFilterCondicionChange,
  filterEstado,
  onFilterEstadoChange,
  activeFilterCount,
  onClearFilters,
  areas,
  condiciones,
  estados,
  onView,
  onEdit,
  onDelete,
  onPrint,
}: BajaListProps) {
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
  const areaOptions = useMemo(() => {
    const fromCatalog = (areas ?? [])
      .filter((area) => area.NombreArea)
      .map((area) => ({ value: area.NombreArea, label: area.NombreArea }));

    const fromRecords = bajas
      .map((baja) => baja.UnidadOrganica)
      .filter((name): name is string => Boolean(name))
      .filter((name) => !fromCatalog.some((option) => option.value === name))
      .map((name) => ({ value: name, label: name }));

    return [...fromCatalog, ...fromRecords].sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [areas, bajas]);

  const columns = useMemo<ColumnDef<BajaRecord>[]>(
    () => [
      {
        accessorKey: "NumeroFichaBaja",
        header: "Nº Ficha",
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-semibold text-destructive">
            {row.original.NumeroFichaBaja || "-"}
          </span>
        ),
      },
      {
        id: "bien",
        header: "Bien / Equipo",
        cell: ({ row }) => (
          <div className="max-w-[220px] truncate" title={row.original.Bien?.Descripcion || "-"}>
            {row.original.Bien?.Descripcion || "-"}
          </div>
        ),
      },
      {
        id: "patrimonial",
        header: "Cód. Patrimonial",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.original.Bien?.CodigoPatrimonial || "-"}</span>
        ),
      },
      {
        accessorKey: "UnidadOrganica",
        header: "Área Usuaria",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.original.UnidadOrganica || "-"}</span>
        ),
      },
      {
        id: "condicion",
        header: "Condición",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getCondicionBadgeClass(row.original.Condicion?.Condicion)}`}
          >
            {row.original.Condicion?.Condicion || "Sin condición"}
          </span>
        ),
      },
      {
        id: "estado",
        header: "Estado",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getEstadoBadgeClass(row.original.Estado?.EstadoBien)}`}
          >
            {row.original.Estado?.EstadoBien || "Sin estado"}
          </span>
        ),
      },
      {
        accessorKey: "CausalBaja",
        header: "Causal",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.original.CausalBaja || "-"}</span>
        ),
      },
      {
        id: "estadoAprobacion",
        header: "Aprobación",
        cell: ({ row }) => {
          const status = String(row.original.EstadoAprobacion || "PENDIENTE").toUpperCase();
          const className =
            status === "APROBADA"
              ? "bg-success/10 text-success ring-success/20"
              : status === "RECHAZADA"
                ? "bg-destructive/10 text-destructive ring-destructive/20"
                : "bg-warning/10 text-warning ring-warning/20";
          return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}>
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "Responsable",
        header: "Responsable",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.original.Responsable || "-"}</span>
        ),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: ({ row }) => {
          const baja = row.original;
          const role = (currentUser?.role || "").toLowerCase();
          const isSoporte = role.includes("soporte");
          const canModify = !isSoporte || (baja.IdUsuarioRegistro && baja.IdUsuarioRegistro === currentUser?.id);
          return (
            <TableRowActions>
              <TableActionButton title="Ver" aria-label="Ver ficha de baja" onClick={() => onView(baja)}>
                <Eye className="size-4" />
              </TableActionButton>
              {canModify && (
                <TableActionButton
                  actionVariant="primary"
                  title="Editar"
                  aria-label="Editar ficha de baja"
                  onClick={() => onEdit(baja)}
                >
                  <Edit className="size-4" />
                </TableActionButton>
              )}
              {canModify && (
                <TableActionButton
                  actionVariant="destructive"
                  title="Eliminar"
                  aria-label="Eliminar ficha de baja"
                  onClick={() => onDelete(baja.IdBaja)}
                >
                  <Trash2 className="size-4" />
                </TableActionButton>
              )}
              <TableActionButton title="Imprimir" aria-label="Imprimir" onClick={() => onPrint(baja)}>
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
        <FilterField label="Buscar ficha" htmlFor="search-baja">
          <IconInput
            id="search-baja"
            icon={Search}
            placeholder="Buscar por N° de ficha..."
            value={buscarText}
            onChange={(event) => onBuscarChange(event.target.value)}
          />
        </FilterField>
        <FilterField label="Área usuaria" htmlFor="filter-area-baja">
          <SearchableSelect
            id="filter-area-baja"
            value={filterArea}
            onValueChange={onFilterAreaChange}
            options={areaOptions}
            placeholder="Seleccione o busque área"
            searchPlaceholder="Escriba iniciales o nombre..."
            emptyMessage="No hay áreas que coincidan"
          />
        </FilterField>
        <FilterField label="Condición" htmlFor="filter-condicion-baja">
          <SearchableSelect
            id="filter-condicion-baja"
            value={filterCondicion}
            onValueChange={onFilterCondicionChange}
            options={(condiciones ?? [])
              .filter((condicion) => Boolean(condicion.Condicion))
              .map((condicion) => {
                const nombre = String(condicion.Condicion ?? "");
                return { value: nombre, label: nombre };
              })}
            placeholder="Seleccione o busque condición"
            emptyMessage="No hay condiciones que coincidan"
          />
        </FilterField>
        <FilterField label="Estado del bien" htmlFor="filter-estado-baja">
          <SearchableSelect
            id="filter-estado-baja"
            value={filterEstado}
            onValueChange={onFilterEstadoChange}
            options={(estados ?? [])
              .filter((estado) => Boolean(estado.EstadoBien))
              .map((estado) => {
                const nombre = String(estado.EstadoBien ?? "");
                return { value: nombre, label: nombre };
              })}
            placeholder="Seleccione o busque estado"
            emptyMessage="No hay estados que coincidan"
          />
        </FilterField>
      </FilterBar>

      <DataTable
        columns={columns}
        data={bajas}
        isLoading={isLoading}
        error={error}
        emptyMessage="No hay fichas de baja registradas."
        tableClassName="text-sm"
      />
    </div>
  );
}
