"use client";

import { useState, useMemo, type UIEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Eye, Power } from "lucide-react";
import { SoftwareFormModal } from "@/lib/lazy/inventory-modals";
import { DataTable } from "@/components/data-display/DataTable";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { TableRowActions, TableActionButton } from "@/components/data-display/TableRowActions";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, FilterField } from "@/components/forms/FilterBar";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { IconInput } from "@/components/forms/IconInput";
import { notify } from "@/lib/feedback/toast";
import { fetchSessionClient } from "@/lib/auth/session-client";

const ESTADOS_LICENCIA = ["Vigente", "Vencida", "Suspendida"] as const;

function normalizeEstadoLicencia(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (raw === "1") return "Vigente";
  if (raw === "0") return "Vencida";
  return raw;
}

const fetchSoftware = async () => {
  const res = await fetch("/api/software");
  if (!res.ok) throw new Error("Error al cargar el inventario de software");
  return res.json();
};

const fetchTiposSoftware = async () => {
  const res = await fetch("/api/tipos-software");
  if (!res.ok) throw new Error("Error al cargar tipos de software");
  return res.json();
};

const fetchTiposLicencia = async () => {
  const res = await fetch("/api/tipos-licencia");
  if (!res.ok) throw new Error("Error al cargar tipos de licencia");
  return res.json();
};

export default function SoftwarePage() {
  const queryClient = useQueryClient();
  const [softwareSearchTerm, setSoftwareSearchTerm] = useState("");
  const [filterTipoSoftware, setFilterTipoSoftware] = useState("");
  const [filterEstadoLicencia, setFilterEstadoLicencia] = useState("");
  const [filterTipoLicencia, setFilterTipoLicencia] = useState("");

  const { data: software, isLoading, error } = useQuery({
    queryKey: ["software"],
    queryFn: fetchSoftware,
  });
  const { data: tiposSoftware } = useQuery({
    queryKey: ["tipos-software"],
    queryFn: fetchTiposSoftware,
  });
  const { data: tiposLicencia } = useQuery({
    queryKey: ["tipos-licencia"],
    queryFn: fetchTiposLicencia,
  });
  const { data: sessionData } = useQuery({
    queryKey: ["session"],
    queryFn: fetchSessionClient,
  });
  const isSupport = String(sessionData?.user?.role || "").toLowerCase().includes("soporte");

  const [visibleCount, setVisibleCount] = useState(12);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState<any>(null);
  const [readOnlyMode, setReadOnlyMode] = useState(false);

  const tipoSoftwareOptions = useMemo(
    () =>
      (tiposSoftware ?? [])
        .filter((tipo: { TipoSoftware?: string }) => tipo.TipoSoftware)
        .map((tipo: { TipoSoftware: string }) => ({
          value: tipo.TipoSoftware,
          label: tipo.TipoSoftware,
        })),
    [tiposSoftware]
  );

  const toggleActivoMutation = useMutation({
    mutationFn: async (item: any) => {
      const res = await fetch("/api/software", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ IdSoftware: item.IdSoftware, Activo: !item.Activo }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al cambiar el estado del software");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["software"] }),
    onError: (error) => notify.fromError(error),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = data.IdSoftware ? "PATCH" : "POST";
      const url = "/api/software";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar el software");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["software"] });
      setModalOpen(false);
    },
    onError: (error) => notify.fromError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/software?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al desactivar el software");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["software"] }),
    onError: (error) => notify.fromError(error),
  });

  const handleToggleActivo = (item: any) => {
    const action = item.Activo ? "desactivar" : "activar";
    if (confirm(`¿Está seguro de ${action} este software?`)) {
      toggleActivoMutation.mutate(item);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de desactivar este software?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredSoftware = useMemo(() => {
    if (!software) return [];
    const term = softwareSearchTerm.toLowerCase().trim();

    return software.filter((item: any) => {
      const matchesSearch =
        !term ||
        String(item.NombreSoftware || "").toLowerCase().includes(term) ||
        String(item.ProveedorEntidad || "").toLowerCase().includes(term) ||
        String(item.TipoLicencia || "").toLowerCase().includes(term) ||
        String(item.TipoSoftware || "").toLowerCase().includes(term) ||
        String(item.VersionSoftware || "").toLowerCase().includes(term);

      const matchesTipo =
        !filterTipoSoftware ||
        String(item.TipoSoftware || "").toLowerCase() === filterTipoSoftware.toLowerCase();
      const estadoNormalizado = normalizeEstadoLicencia(item.EstadoLicencia);
      const matchesEstado =
        !filterEstadoLicencia ||
        estadoNormalizado.toLowerCase() === filterEstadoLicencia.toLowerCase();
      const matchesLicencia =
        !filterTipoLicencia ||
        String(item.TipoLicencia || "").toLowerCase() === filterTipoLicencia.toLowerCase();

      return matchesSearch && matchesTipo && matchesEstado && matchesLicencia;
    });
  }, [
    software,
    softwareSearchTerm,
    filterTipoSoftware,
    filterEstadoLicencia,
    filterTipoLicencia,
  ]);

  const displayedSoftware = useMemo(
    () => filteredSoftware.slice(0, visibleCount),
    [filteredSoftware, visibleCount]
  );

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 40) {
      if (visibleCount < filteredSoftware.length) {
        setVisibleCount((prev) => prev + 12);
      }
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "NombreSoftware",
        header: "Software",
        cell: (info: any) => info.getValue() || "-",
      },
      {
        accessorKey: "TipoSoftware",
        header: "Tipo",
        cell: (info: any) => info.getValue() || "-",
      },
      {
        accessorKey: "VersionSoftware",
        header: "Versión",
        cell: (info: any) => info.getValue() || "-",
      },
      {
        accessorKey: "ProveedorEntidad",
        header: "Proveedor",
        cell: (info: any) => info.getValue() || "-",
      },
      {
        accessorKey: "TipoLicencia",
        header: "Licencia",
        cell: (info: any) => info.getValue() || "-",
      },
      {
        accessorKey: "CantidadLicencias",
        header: "Cantidad",
        cell: (info: any) => info.getValue() ?? "-",
      },
      {
        accessorKey: "EstadoLicencia",
        header: "Estado",
        cell: (info: any) => normalizeEstadoLicencia(info.getValue()) || "-",
      },
      {
        accessorKey: "FechaCaducidad",
        header: "Caducidad",
        cell: (info: any) => {
          const value = info.getValue();
          return value ? new Date(value).toLocaleDateString() : "-";
        },
      },
      {
        accessorKey: "Activo",
        header: "Activo",
        cell: (info: any) => (
          <StatusBadge
            active={info.getValue()}
            activeLabel="Sí"
            inactiveLabel="No"
          />
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        cell: (info: any) => {
          const item = info.row.original;
          return (
            <TableRowActions>
              <TableActionButton
                title="Ver"
                aria-label="Ver software"
                onClick={() => {
                  setEditingSoftware(item);
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
                    aria-label="Editar software"
                    onClick={() => {
                      setEditingSoftware(item);
                      setReadOnlyMode(false);
                      setModalOpen(true);
                    }}
                  >
                    <Edit className="size-4" />
                  </TableActionButton>
                  <TableActionButton
                    actionVariant="warning"
                    title={item.Activo ? "Desactivar" : "Activar"}
                    aria-label={item.Activo ? "Desactivar software" : "Activar software"}
                    onClick={() => handleToggleActivo(item)}
                  >
                    <Power className="size-4" />
                  </TableActionButton>
                  <TableActionButton
                    actionVariant="destructive"
                    title="Desactivar"
                    aria-label="Desactivar software"
                    onClick={() => handleDelete(item.IdSoftware)}
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
      <PageHeader
        title="Inventario de Software"
        description="Registro, edición y seguimiento de licencias de software."
        actions={
          !isSupport ? (
            <Button
              size="lg"
              className="gap-2"
              onClick={() => {
                setEditingSoftware(null);
                setReadOnlyMode(false);
                setModalOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden="true" /> Nuevo Software
            </Button>
          ) : undefined
        }
      />

      {modalOpen ? (
        <SoftwareFormModal
          software={editingSoftware}
          open={modalOpen}
          onOpenChange={setModalOpen}
          readOnly={readOnlyMode}
        />
      ) : null}

      <FilterBar
        fieldsClassName="lg:grid-cols-4"
        activeCount={
          Number(Boolean(softwareSearchTerm)) +
          Number(Boolean(filterTipoSoftware)) +
          Number(Boolean(filterEstadoLicencia)) +
          Number(Boolean(filterTipoLicencia))
        }
        onClear={() => {
          setSoftwareSearchTerm("");
          setFilterTipoSoftware("");
          setFilterEstadoLicencia("");
          setFilterTipoLicencia("");
          setVisibleCount(12);
        }}
      >
        <FilterField label="Buscar software" htmlFor="search-software">
          <IconInput
            id="search-software"
            icon={Search}
            value={softwareSearchTerm}
            onChange={(e) => {
              setSoftwareSearchTerm(e.target.value);
              setVisibleCount(12);
            }}
            placeholder="Nombre, proveedor, tipo..."
          />
        </FilterField>
        <FilterField label="Tipo" htmlFor="filter-tipo-software">
          <SearchableSelect
            id="filter-tipo-software"
            value={filterTipoSoftware}
            onValueChange={(value) => {
              setFilterTipoSoftware(value);
              setVisibleCount(12);
            }}
            options={tipoSoftwareOptions}
            placeholder="Seleccione o busque tipo"
            emptyMessage="No hay tipos que coincidan"
          />
        </FilterField>
        <FilterField label="Estado licencia" htmlFor="filter-estado-licencia">
          <Select
            value={filterEstadoLicencia || null}
            onValueChange={(value) => {
              setFilterEstadoLicencia(value ?? "");
              setVisibleCount(12);
            }}
          >
            <SelectTrigger id="filter-estado-licencia" className="w-full">
              <SelectValue placeholder="Seleccione estado" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_LICENCIA.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {estado}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Tipo licencia" htmlFor="filter-tipo-licencia">
          <Select
            value={filterTipoLicencia || null}
            onValueChange={(value) => {
              setFilterTipoLicencia(value ?? "");
              setVisibleCount(12);
            }}
          >
            <SelectTrigger id="filter-tipo-licencia" className="w-full">
              <SelectValue placeholder="Seleccione licencia" />
            </SelectTrigger>
            <SelectContent>
              {tiposLicencia?.map((tipo: { IdTipoLicencia: number; TipoLicencia: string }) => (
                <SelectItem key={tipo.IdTipoLicencia} value={tipo.TipoLicencia}>
                  {tipo.TipoLicencia}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      </FilterBar>

      <DataTable
        columns={columns}
        data={displayedSoftware}
        isLoading={isLoading}
        error={error as Error | null}
        emptyMessage="No se encontraron registros de software."
        stickyHeader
        scrollContainerClassName="max-h-[620px] overflow-y-auto"
        onScroll={handleScroll}
        getRowClassName={(row) =>
          row.original.Activo ? undefined : "text-muted-foreground opacity-75"
        }
        footer={
          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Mostrando {displayedSoftware.length} de {filteredSoftware.length} registros
            </span>
            {filteredSoftware.length > displayedSoftware.length && (
              <span className="animate-pulse font-medium text-primary">
                Desplázate hacia abajo para ver más...
              </span>
            )}
          </div>
        }
      />
    </div>
  );
}
