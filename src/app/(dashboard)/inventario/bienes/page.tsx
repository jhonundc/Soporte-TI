"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, Power, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import BienFormModal from "@/components/inventory/BienFormModal";
import BienImportModal from "@/components/inventory/BienImportModal";
import { useState, useMemo } from "react";

// Función para obtener los bienes
const fetchBienes = async () => {
  const res = await fetch("/api/bienes");
  if (!res.ok) throw new Error("Error al cargar los bienes");
  return res.json();
};

const fetchSession = async () => {
  const res = await fetch("/api/auth/session");
  if (!res.ok) return { user: { role: "" } };
  return res.json();
};

export default function BienesPage() {
  const queryClient = useQueryClient();
  const { data: bienes, isLoading, error } = useQuery({
    queryKey: ["bienes"],
    queryFn: fetchBienes,
  });
  const { data: sessionData } = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
  });
  const isSupport = String(sessionData?.user?.role || "").toLowerCase().includes("soporte");

  const [searchCodigoInventario, setSearchCodigoInventario] = useState("");
  const [searchCodigoPatrimonial, setSearchCodigoPatrimonial] = useState("");
  const [visibleCount, setVisibleCount] = useState(9);

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingBien, setEditingBien] = useState<any>(null);
  const [readOnlyMode, setReadOnlyMode] = useState(false);

  // Mutaciones para activar/desactivar y dar de baja
  const toggleActivoMutation = useMutation({
    mutationFn: async (bien: any) => {
      const res = await fetch("/api/bienes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          IdBien: bien.IdBien,
          Activo: !bien.Activo,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al cambiar estado del bien");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bienes"] });
    },
    onError: (error: any) => {
      alert(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/bienes?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al dar de baja el bien");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bienes"] });
    },
    onError: (error: any) => {
      alert(error.message);
    }
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

      return matchesInventario && matchesPatrimonial;
    });
  }, [bienes, searchCodigoInventario, searchCodigoPatrimonial]);

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
  const columns = useMemo(() => [
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
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50" 
              title="Ver"
              onClick={() => {
                setEditingBien(bien);
                setReadOnlyMode(true);
                setModalOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {!isSupport && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                  title="Editar"
                  onClick={() => {
                    setEditingBien(bien);
                    setReadOnlyMode(false);
                    setModalOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 ${bien.Activo ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-slate-400 hover:text-slate-500 hover:bg-slate-100'}`} 
                  title={bien.Activo ? "Desactivar" : "Activar"}
                  onClick={() => handleToggleActivo(bien)}
                >
                  <Power className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" 
                  title="Dar de baja (inactivar)"
                  onClick={() => handleDelete(bien.IdBien)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ], [isSupport]);

  const table = useReactTable({
    data: displayedBienes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventario de Bienes</h1>
          <p className="text-slate-500 text-sm">Gestión de equipos y bienes institucionales.</p>
        </div>
        {!isSupport && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
              onClick={() => setImportModalOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" /> Importar Excel
            </Button>
            <Button
              onClick={() => {
                setEditingBien(null);
                setReadOnlyMode(false);
                setModalOpen(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-900/20 inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 px-4 py-2 transition-all"
            >
              <Plus className="mr-2 h-4 w-4" /> Nuevo Bien
            </Button>
          </div>
        )}
      </div>

      <BienFormModal 
        bien={editingBien} 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        readOnly={readOnlyMode}
      />

      <BienImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImported={() => {
          queryClient.invalidateQueries({ queryKey: ["bienes"] });
        }}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">ID Inventario</label>
          <Input
            placeholder="Buscar por código de inventario"
            value={searchCodigoInventario}
            onChange={handleSearchCodigoInventarioChange}
            className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">ID Patrimonial</label>
          <Input
            placeholder="Buscar por código patrimonial"
            value={searchCodigoPatrimonial}
            onChange={handleSearchCodigoPatrimonialChange}
            className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Cargando bienes...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">Error al cargar los bienes. Verifica la conexión.</div>
        ) : (
          <div
            onScroll={handleScroll}
            className="overflow-x-auto max-h-[600px] overflow-y-auto relative"
          >
            <table className="w-full text-sm text-left text-slate-600 border-collapse">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-4 font-semibold whitespace-nowrap sticky top-0 bg-slate-50 z-10"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <tr 
                      key={row.id} 
                      className={`border-b border-slate-100 transition-colors hover:bg-slate-50/50 ${
                        row.original.Activo ? "bg-white" : "bg-slate-50/40 text-slate-400 opacity-75"
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-4 text-center text-slate-500">
                      No se encontraron bienes registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info de Scroll Infinito */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          Mostrando {displayedBienes.length} de {filteredBienes.length} registros
          {filteredBienes.length > displayedBienes.length && (
            <span className="text-blue-600 font-medium ml-2 animate-pulse">
              (Desplázate hacia abajo para ver más...)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
