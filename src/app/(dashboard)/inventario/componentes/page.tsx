"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2, Eye, Power } from "lucide-react";
import { Input } from "@/components/ui/input";
import ComponenteFormModal from "@/components/inventory/ComponenteFormModal";
import ComponenteImportModal from "@/components/inventory/ComponenteImportModal";
import { useState, useMemo } from "react";

const fetchComponentes = async ({ queryKey }: any) => {
  const [_key, codigo, serie] = queryKey;
  const codigoTrim = String(codigo || "").trim();
  const serieTrim = String(serie || "").trim();

  let url = "/api/componentes";
  if (codigoTrim) url = `/api/componentes?codigoPatrimonial=${encodeURIComponent(codigoTrim)}`;
  else if (serieTrim) url = `/api/componentes?serie=${encodeURIComponent(serieTrim)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al cargar los componentes de bienes");
  return res.json();
};

const fetchSession = async () => {
  const res = await fetch("/api/auth/session");
  if (!res.ok) return { user: { role: "" } };
  return res.json();
};

export default function ComponentesPage() {
  const queryClient = useQueryClient();
  const [codigoSearch, setCodigoSearch] = useState("");
  const [serieSearch, setSerieSearch] = useState("");

  const { data: componentes, isLoading, error } = useQuery({
    queryKey: ["componentes", codigoSearch, serieSearch],
    queryFn: fetchComponentes,
  });
  const { data: sessionData } = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
  });
  const isSupport = String(sessionData?.user?.role || "").toLowerCase().includes("soporte");

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingComponente, setEditingComponente] = useState<any>(null);
  const [readOnlyMode, setReadOnlyMode] = useState(false);

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
    onError: (error: any) => {
      alert(error.message);
    },
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
    onError: (error: any) => {
      alert(error.message);
    },
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

      const matchesCodigo = !codigoTerm || codigo.includes(codigoTerm);
      const matchesSerie = !serieTerm || serie.includes(serieTerm);

      return matchesCodigo && matchesSerie;
    });
  }, [componentes, codigoSearch, serieSearch]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "BienDescripcion",
        header: "Bien",
        cell: (info: any) => (
          <div className="space-y-1">
            <div>{info.getValue() || "-"}</div>
            <div className="text-xs text-slate-500">{info.row.original.CodigoInventario || ""}</div>
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
              <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
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
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                title="Ver"
                onClick={() => {
                  setEditingComponente(comp);
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
                      setEditingComponente(comp);
                      setReadOnlyMode(false);
                      setModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${comp.Activo ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-slate-400 hover:text-slate-500 hover:bg-slate-100"}`}
                    title={comp.Activo ? "Desactivar" : "Activar"}
                    onClick={() => handleToggleActivo(comp)}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Dar de baja"
                    onClick={() => handleDelete(comp)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [isSupport]
  );

  const table = useReactTable({
    data: filteredComponentes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
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
              onClick={() => {
                setEditingComponente(null);
                setReadOnlyMode(false);
                setModalOpen(true);
              }}
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
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">Código Patrimonial</label>
          <Input
            placeholder="Buscar por código patrimonial"
            value={codigoSearch}
            onChange={(e) => { setCodigoSearch(e.target.value); setSerieSearch(""); }}
            className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">Serie</label>
          <Input
            placeholder="Buscar por serie"
            value={serieSearch}
            onChange={(e) => { setSerieSearch(e.target.value); setCodigoSearch(""); }}
            className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Cargando registros...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">Error al cargar los registros. Verifica la conexión.</div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto relative">
            <table className="w-full text-sm text-left text-slate-600 border-collapse">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-6 py-4 font-semibold whitespace-nowrap sticky top-0 bg-slate-50 z-10">
                        {flexRender(header.column.columnDef.header, header.getContext())}
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
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-4 text-center text-slate-500">
                      No se encontraron componentes registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">Mostrando {filteredComponentes.length} registros</div>
      </div>
    </div>
  );
}
