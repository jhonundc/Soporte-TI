"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, Power } from "lucide-react";
import { Input } from "@/components/ui/input";
<<<<<<< HEAD
import ComponenteFormModal from "@/components/inventory/ComponenteFormModal";
import ComponenteImportModal from "@/components/inventory/ComponenteImportModal";
=======
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComponenteFormModal } from "@/lib/lazy/inventory-modals";
import { DataTable } from "@/components/data-display/DataTable";
import { TableRowActions, TableActionButton } from "@/components/data-display/TableRowActions";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, FilterField } from "@/components/forms/FilterBar";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
>>>>>>> f94a8a056b7c87972de21b6fa024d9bb7624f8d5
import { useState, useMemo } from "react";
import { notify } from "@/lib/feedback/toast";
import { fetchSessionClient } from "@/lib/auth/session-client";
import { getEstados } from "@/app/actions/catalogs";

const fetchComponentes = async () => {
  const res = await fetch("/api/componentes");
  if (!res.ok) throw new Error("Error al cargar los componentes de bienes");
  return res.json();
};

const fetchComponenteCatalog = async () => {
  const res = await fetch("/api/componentes?catalog=true");
  if (!res.ok) throw new Error("Error al cargar tipos de componente");
  return res.json();
};

export default function ComponentesPage() {
  const queryClient = useQueryClient();
  const [codigoSearch, setCodigoSearch] = useState("");
  const [serieSearch, setSerieSearch] = useState("");
  const [filterTipoComponente, setFilterTipoComponente] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  const { data: componentes, isLoading, error } = useQuery({
    queryKey: ["componentes"],
    queryFn: fetchComponentes,
  });
  const { data: componenteCatalog } = useQuery({
    queryKey: ["componentes", "catalog"],
    queryFn: fetchComponenteCatalog,
  });
  const { data: estados } = useQuery({
    queryKey: ["estados"],
    queryFn: getEstados,
  });
  const { data: sessionData } = useQuery({
    queryKey: ["session"],
    queryFn: fetchSessionClient,
  });
  const isSupport = String(sessionData?.user?.role || "").toLowerCase().includes("soporte");

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingComponente, setEditingComponente] = useState<any>(null);
  const [readOnlyMode, setReadOnlyMode] = useState(false);

  const tipoComponenteOptions = useMemo(
    () =>
      (componenteCatalog ?? [])
        .filter((item: { NombreComponente?: string }) => item.NombreComponente)
        .map((item: { NombreComponente: string }) => ({
          value: item.NombreComponente,
          label: item.NombreComponente,
        })),
    [componenteCatalog]
  );

  const toggleActivoMutation = useMutation({
    mutationFn: async (comp: any) => {
      const payload = { IdBienComponente: comp.IdBienComponente, Activo: !comp.Activo };

      const res = await fetch("/api/componentes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al cambiar el estado del componente del bien");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["componentes"] });
    },
    onError: (error) => notify.fromError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (comp: any) => {
      const res = await fetch(`/api/componentes?idBienComponente=${comp.IdBienComponente}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al eliminar el componente del bien");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["componentes"] });
    },
    onError: (error) => notify.fromError(error),
  });

  const handleToggleActivo = (comp: any) => {
    if (confirm(`¿Está seguro de ${comp.Activo ? "desactivar" : "activar"} este registro?`)) {
      toggleActivoMutation.mutate(comp);
    }
  };

  const handleDelete = (comp: any) => {
    if (confirm("¿Está seguro de dar de baja este componente del bien?")) {
      deleteMutation.mutate(comp);
    }
  };

  const filteredComponentes = useMemo(() => {
    if (!componentes) return [];
    const codigoTerm = codigoSearch.toLowerCase();
    const serieTerm = serieSearch.toLowerCase();

    return componentes.filter((c: any) => {
      const codigo = (c.CodigoPatrimonial?.toLowerCase() || "");
      const serie = (c.Serie?.toLowerCase() || "");
      const estadoEquipo = String(c.EstadoEquipo || "").toLowerCase();

      const matchesCodigo = !codigoTerm || codigo.includes(codigoTerm);
      const matchesSerie = !serieTerm || serie.includes(serieTerm);
      const matchesTipo =
        !filterTipoComponente ||
        String(c.NombreComponente || "").toLowerCase() === filterTipoComponente.toLowerCase();
      const matchesEstado =
        !filterEstado || estadoEquipo === filterEstado.toLowerCase();

      return matchesCodigo && matchesSerie && matchesTipo && matchesEstado;
    });
  }, [componentes, codigoSearch, serieSearch, filterTipoComponente, filterEstado]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "BienDescripcion",
        header: "Bien",
        cell: (info: any) => (
          <div className="space-y-1">
            <div>{info.getValue() || "-"}</div>
            <div className="text-xs text-muted-foreground">{info.row.original.CodigoInventario || ""}</div>
          </div>
        ),
      },
      {
        accessorKey: "NombreComponente",
        header: "Componente",
        cell: (info: any) => (
          <div className="space-y-1">
            <div>{info.getValue() || `Componente ${info.row.original.IdComponente}`}</div>
            {!info.row.original.Activo && (
              <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive ring-1 ring-inset ring-destructive/20">
                Inactivo
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "TipoEquipo",
        header: "Tipo Equipo",
        cell: (info: any) => info.getValue() || "-",
      },
      {
        accessorKey: "Marca",
        header: "Marca",
        cell: (info: any) => {
          const value = info.getValue();
          if (value === null || value === undefined || value === "") return "-";
          if (typeof value === "object") return value.Marca ?? value.toString?.() ?? "-";
          return String(value);
        },
      },
      {
        accessorKey: "DescripcionModelo",
        header: "Modelo",
        cell: (info: any) => info.getValue() || "-",
      },
      {
        accessorKey: "Serie",
        header: "Serie",
        cell: (info: any) => info.getValue() || "-",
      },
      {
        accessorKey: "CodigoPatrimonial",
        header: "Código Patrimonial",
        cell: (info: any) => info.getValue() || "-",
      },
      {
        accessorKey: "EstadoEquipo",
        header: "Estado",
        cell: (info: any) => info.getValue() || "-",
      },
      {
        accessorKey: "Cantidad",
        header: "Cantidad",
        cell: (info: any) => info.getValue() ?? 0,
      },
      {
        id: "actions",
        header: "Acciones",
        cell: (info: any) => {
          const comp = info.row.original;
          return (
            <TableRowActions>
              <TableActionButton
                title="Ver"
                aria-label="Ver componente"
                onClick={() => {
                  setEditingComponente(comp);
                  setReadOnlyMode(true);
                  setModalOpen(true);
                }}
              >
                <Eye className="size-4" />
              </TableActionButton>
              {!isSupport ? (
                <>
                  <TableActionButton
                    actionVariant="primary"
                    title="Editar"
                    aria-label="Editar componente"
                    onClick={() => {
                      setEditingComponente(comp);
                      setReadOnlyMode(false);
                      setModalOpen(true);
                    }}
                  >
                    <Edit className="size-4" />
                  </TableActionButton>
                  <TableActionButton
                    actionVariant="warning"
                    title={comp.Activo ? "Desactivar" : "Activar"}
                    aria-label={comp.Activo ? "Desactivar componente" : "Activar componente"}
                    onClick={() => handleToggleActivo(comp)}
                  >
                    <Power className="size-4" />
                  </TableActionButton>
                  <TableActionButton
                    actionVariant="destructive"
                    title="Dar de baja"
                    aria-label="Dar de baja componente"
                    onClick={() => handleDelete(comp)}
                  >
                    <Trash2 className="size-4" />
                  </TableActionButton>
                </>
              ) : null}
            </TableRowActions>
          );
        },
      },
    ],
    [isSupport]
  );

  return (
    <div className="space-y-6">
<<<<<<< HEAD
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Componentes de Bienes</h1>
          <p className="text-slate-500 text-sm">Gestión de componentes asignados a bienes.</p>
        </div>
        {!isSupport && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportModalOpen(true)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Importar Excel
            </Button>
            <Button
=======
      <PageHeader
        title="Componentes de Bienes"
        description="Gestión de componentes asignados a bienes."
        actions={
          !isSupport ? (
            <Button
              size="lg"
              className="gap-2"
>>>>>>> f94a8a056b7c87972de21b6fa024d9bb7624f8d5
              onClick={() => {
                setEditingComponente(null);
                setReadOnlyMode(false);
                setModalOpen(true);
              }}
<<<<<<< HEAD
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-900/20 inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 px-4 py-2 transition-all"
            >
              <Plus className="mr-2 h-4 w-4" /> Nuevo Registro
            </Button>
          </div>
        )}
      </div>

      <ComponenteImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImported={() => queryClient.invalidateQueries({ queryKey: ["componentes"] })}
      />

      <ComponenteFormModal
        componente={editingComponente}
        open={modalOpen}
        onOpenChange={setModalOpen}
        readOnly={readOnlyMode}
=======
            >
              <Plus className="size-4" aria-hidden="true" /> Nuevo Registro
            </Button>
          ) : undefined
        }
>>>>>>> f94a8a056b7c87972de21b6fa024d9bb7624f8d5
      />

      {modalOpen ? (
        <ComponenteFormModal
          componente={editingComponente}
          open={modalOpen}
          onOpenChange={setModalOpen}
          readOnly={readOnlyMode}
        />
      ) : null}

      <FilterBar
        fieldsClassName="lg:grid-cols-4"
        activeCount={
          Number(Boolean(codigoSearch)) +
          Number(Boolean(serieSearch)) +
          Number(Boolean(filterTipoComponente)) +
          Number(Boolean(filterEstado))
        }
        onClear={() => {
          setCodigoSearch("");
          setSerieSearch("");
          setFilterTipoComponente("");
          setFilterEstado("");
        }}
      >
        <FilterField label="Código Patrimonial" htmlFor="search-codigo">
          <Input
            id="search-codigo"
            placeholder="Buscar por código patrimonial"
            value={codigoSearch}
            onChange={(e) => setCodigoSearch(e.target.value)}
          />
        </FilterField>
        <FilterField label="Serie" htmlFor="search-serie">
          <Input
            id="search-serie"
            placeholder="Buscar por serie"
            value={serieSearch}
            onChange={(e) => setSerieSearch(e.target.value)}
          />
        </FilterField>
        <FilterField label="Tipo componente" htmlFor="filter-tipo-componente">
          <SearchableSelect
            id="filter-tipo-componente"
            value={filterTipoComponente}
            onValueChange={setFilterTipoComponente}
            options={tipoComponenteOptions}
            placeholder="Seleccione o busque tipo"
            emptyMessage="No hay tipos que coincidan"
          />
        </FilterField>
        <FilterField label="Estado" htmlFor="filter-estado">
          <Select
            value={filterEstado || null}
            onValueChange={(value) => {
              setFilterEstado(value ?? "");
            }}
          >
            <SelectTrigger id="filter-estado" className="w-full">
              <SelectValue placeholder="Seleccione estado" />
            </SelectTrigger>
            <SelectContent>
              {estados?.map((estado: { IdEstado: number; EstadoBien: string }) => (
                <SelectItem key={estado.IdEstado} value={estado.EstadoBien}>
                  {estado.EstadoBien}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      </FilterBar>
      <DataTable
        columns={columns}
        data={filteredComponentes}
        isLoading={isLoading}
        error={error as Error | null}
        emptyMessage="No se encontraron componentes registrados."
        stickyHeader
        scrollContainerClassName="max-h-[500px] overflow-y-auto"
        getRowClassName={(row) =>
          row.original.Activo ? undefined : "text-muted-foreground opacity-75"
        }
        footer={
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredComponentes.length} registros
          </div>
        }
      />
    </div>
  );
}
