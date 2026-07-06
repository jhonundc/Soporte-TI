"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, Power } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BienFormModal } from "@/lib/lazy/inventory-modals";
import { useState, useMemo } from "react";
import { getAreas, getCondiciones } from "@/app/actions/catalogs";
import { notify } from "@/lib/feedback/toast";
import { fetchSessionClient } from "@/lib/auth/session-client";
import { queryKeys } from "@/lib/query-keys";
import { bienesService } from "@/services/bienes.service";
import { DataTable } from "@/components/data-display/DataTable";
import { TableRowActions, TableActionButton } from "@/components/data-display/TableRowActions";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, FilterField } from "@/components/forms/FilterBar";
import { SearchableSelect } from "@/components/forms/SearchableSelect";

export default function BienesPage() {
  const queryClient = useQueryClient();
  const { data: bienes, isLoading, error } = useQuery({
    queryKey: queryKeys.bienes.all(),
    queryFn: bienesService.list,
  });
  const { data: sessionData } = useQuery({
    queryKey: queryKeys.session(),
    queryFn: fetchSessionClient,
  });
  const { data: areas } = useQuery({ queryKey: ["areas"], queryFn: () => getAreas() });
  const { data: condiciones } = useQuery({ queryKey: ["condiciones"], queryFn: () => getCondiciones() });
  const isSupport = String(sessionData?.user?.role || "").toLowerCase().includes("soporte");

  const [searchCodigoInventario, setSearchCodigoInventario] = useState("");
  const [searchCodigoPatrimonial, setSearchCodigoPatrimonial] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterCondicion, setFilterCondicion] = useState("");
  const [visibleCount, setVisibleCount] = useState(9);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBien, setEditingBien] = useState<any>(null);
  const [readOnlyMode, setReadOnlyMode] = useState(false);

  const areaOptions = useMemo(
    () =>
      (areas ?? [])
        .filter((area: { NombreArea?: string }) => area.NombreArea)
        .map((area: { NombreArea: string }) => ({
          value: area.NombreArea,
          label: area.NombreArea,
        })),
    [areas]
  );

  // Mutaciones para activar/desactivar y dar de baja
  const toggleActivoMutation = useMutation({
    mutationFn: (bien: any) =>
      bienesService.toggleActivo(bien.IdBien, !bien.Activo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bienes.all() });
    },
    onError: (error) => notify.fromError(error),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bienesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bienes.all() });
    },
    onError: (error) => notify.fromError(error),
  });

  const handleToggleActivo = (bien: any) => {
    if (confirm(`¿Está seguro de ${bien.Activo ? "desactivar" : "activar"} este bien?`)) {
      toggleActivoMutation.mutate(bien);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de dar de baja este bien? Se marcará como inactivo.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSearchCodigoInventarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchCodigoInventario(e.target.value);
    setVisibleCount(9);
  };

  const handleSearchCodigoPatrimonialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchCodigoPatrimonial(e.target.value);
    setVisibleCount(9);
  };

  // Filtrado de bienes por código de inventario y código patrimonial
  const filteredBienes = useMemo(() => {
    if (!bienes) return [];
    const codigoInventarioTerm = searchCodigoInventario.toLowerCase();
    const codigoPatrimonialTerm = searchCodigoPatrimonial.toLowerCase();
    return bienes.filter((b: any) => {
      const codigoInventario = (b.CodigoInventario?.toLowerCase() || "");
      const codigoPatrimonial = (b.CodigoPatrimonial?.toLowerCase() || "");

      const matchesInventario =
        !codigoInventarioTerm || codigoInventario.includes(codigoInventarioTerm);
      const matchesPatrimonial =
        !codigoPatrimonialTerm || codigoPatrimonial.includes(codigoPatrimonialTerm);
      const matchesArea =
        !filterArea ||
        String(b.Area?.NombreArea || "").toLowerCase() === filterArea.toLowerCase();
      const matchesCondicion =
        !filterCondicion ||
        String(b.Condicion?.Condicion || "").toLowerCase() === filterCondicion.toLowerCase();

      return matchesInventario && matchesPatrimonial && matchesArea && matchesCondicion;
    });
  }, [bienes, searchCodigoInventario, searchCodigoPatrimonial, filterArea, filterCondicion]);

  // Bienes que se muestran actualmente (scroll infinito)
  const displayedBienes = useMemo(() => {
    return filteredBienes.slice(0, visibleCount);
  }, [filteredBienes, visibleCount]);

  // Manejador de Scroll Infinito
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 30) {
      if (visibleCount < filteredBienes.length) {
        setVisibleCount((prev) => prev + 9);
      }
    }
  };

  // Definición de columnas (memorizadas)
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "CodigoInventario",
      header: "Cód. Inventario",
      cell: (info: any) => info.getValue() || "-",
    },
    {
      accessorKey: "CodigoPatrimonial",
      header: "Cód. Patrimonial",
      cell: (info: any) => info.getValue() || "-",
    },
    {
      accessorKey: "Descripcion",
      header: "Descripción",
      cell: (info: any) => (
        <span>
          {info.getValue() || "-"}
          {!info.row.original.Activo && (
            <span className="ml-2 text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              Inactivo
            </span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "Categoria.CategoriaBien",
      header: "Categoría",
      cell: (info: any) => info.row.original.Categoria?.CategoriaBien || "-",
    },
    {
      accessorKey: "Marca.Marca",
      header: "Marca",
      cell: (info: any) => info.row.original.Marca?.Marca || "-",
    },
    {
      accessorKey: "Modelo",
      header: "Modelo",
      cell: (info: any) => info.row.original.Modelo || "-",
    },
    {
      accessorKey: "Area.NombreArea",
      header: "Área",
      cell: (info: any) => info.row.original.Area?.NombreArea || "-",
    },
    {
      accessorKey: "Condicion.Condicion",
      header: "Condición",
      cell: (info: any) => info.row.original.Condicion?.Condicion || "-",
    },
    {
      accessorKey: "Estado.EstadoBien",
      header: "Estado",
      cell: (info: any) => info.row.original.Estado?.EstadoBien || "-",
    },
    {
      id: "actions",
      header: "Acciones",
      cell: (info: any) => {
        const bien = info.row.original;
        return (
          <TableRowActions>
            <TableActionButton
              actionVariant="default"
              title="Ver"
              aria-label="Ver detalle"
              onClick={() => {
                setEditingBien(bien);
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
                  aria-label="Editar bien"
                  onClick={() => {
                    setEditingBien(bien);
                    setReadOnlyMode(false);
                    setModalOpen(true);
                  }}
                >
                  <Edit className="size-4" />
                </TableActionButton>
                <TableActionButton
                  actionVariant="warning"
                  title={bien.Activo ? "Desactivar" : "Activar"}
                  aria-label={bien.Activo ? "Desactivar bien" : "Activar bien"}
                  onClick={() => handleToggleActivo(bien)}
                >
                  <Power className="size-4" />
                </TableActionButton>
                <TableActionButton
                  actionVariant="destructive"
                  title="Dar de baja (inactivar)"
                  aria-label="Dar de baja"
                  onClick={() => handleDelete(bien.IdBien)}
                >
                  <Trash2 className="size-4" />
                </TableActionButton>
              </>
            ) : null}
          </TableRowActions>
        );
      },
    },
  ], [isSupport]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario de Bienes"
        description="Gestión de equipos y bienes institucionales."
        actions={
          !isSupport ? (
            <Button
              size="lg"
              className="gap-2"
              onClick={() => {
                setEditingBien(null);
                setReadOnlyMode(false);
                setModalOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden="true" /> Nuevo Bien
            </Button>
          ) : undefined
        }
      />

      {modalOpen ? (
        <BienFormModal
          bien={editingBien}
          open={modalOpen}
          onOpenChange={setModalOpen}
          readOnly={readOnlyMode}
        />
      ) : null}

      <FilterBar
        fieldsClassName="lg:grid-cols-4"
        activeCount={
          Number(Boolean(searchCodigoInventario)) +
          Number(Boolean(searchCodigoPatrimonial)) +
          Number(Boolean(filterArea)) +
          Number(Boolean(filterCondicion))
        }
        onClear={() => {
          setSearchCodigoInventario("");
          setSearchCodigoPatrimonial("");
          setFilterArea("");
          setFilterCondicion("");
          setVisibleCount(9);
        }}
      >
        <FilterField label="ID Inventario" htmlFor="search-inventario">
          <Input
            id="search-inventario"
            placeholder="Buscar por código de inventario"
            value={searchCodigoInventario}
            onChange={handleSearchCodigoInventarioChange}
          />
        </FilterField>
        <FilterField label="ID Patrimonial" htmlFor="search-patrimonial">
          <Input
            id="search-patrimonial"
            placeholder="Buscar por código patrimonial"
            value={searchCodigoPatrimonial}
            onChange={handleSearchCodigoPatrimonialChange}
          />
        </FilterField>
        <FilterField label="Área" htmlFor="filter-area">
          <SearchableSelect
            id="filter-area"
            value={filterArea}
            onValueChange={(value) => {
              setFilterArea(value);
              setVisibleCount(9);
            }}
            options={areaOptions}
            placeholder="Seleccione o busque área"
            emptyMessage="No hay áreas que coincidan"
          />
        </FilterField>
        <FilterField label="Condición" htmlFor="filter-condicion">
          <Select
            value={filterCondicion || null}
            onValueChange={(value) => {
              setFilterCondicion(value ?? "");
              setVisibleCount(9);
            }}
          >
            <SelectTrigger id="filter-condicion" className="w-full">
              <SelectValue placeholder="Seleccione condición" />
            </SelectTrigger>
            <SelectContent>
              {condiciones?.map((condicion: { IdCondicion: number; Condicion: string }) => (
                <SelectItem key={condicion.IdCondicion} value={condicion.Condicion}>
                  {condicion.Condicion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      </FilterBar>

      <DataTable
        columns={columns}
        data={displayedBienes}
        isLoading={isLoading}
        error={error as Error | null}
        emptyMessage="No se encontraron bienes registrados."
        loadingMessage="Cargando bienes..."
        stickyHeader
        scrollContainerClassName="max-h-[600px] overflow-y-auto"
        onScroll={handleScroll}
        getRowClassName={(row) =>
          row.original.Activo ? undefined : "text-muted-foreground opacity-75"
        }
        footer={
          <div className="text-sm text-muted-foreground">
            Mostrando {displayedBienes.length} de {filteredBienes.length} registros
            {filteredBienes.length > displayedBienes.length ? (
              <span className="ml-2 animate-pulse font-medium text-primary">
                (Desplázate hacia abajo para ver más...)
              </span>
            ) : null}
          </div>
        }
      />
    </div>
  );
}