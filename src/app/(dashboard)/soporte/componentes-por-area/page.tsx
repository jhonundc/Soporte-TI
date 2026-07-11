"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";

type Area = {
  IdArea: number;
  NombreArea: string;
};

type Componente = {
  IdBienComponente: number;
  IdBien: number;
  IdComponente: number;
  CodigoInventario: string;
  BienDescripcion: string;
  NombreComponente: string;
  Modelo: string | null;
  NumeroSerie: string | null;
  Capacidad: string | null;
  Marca: string | null;
  EstadoEquipo: string | null;
  IdArea: number;
  NombreArea: string;
};

const fetchComponentesPorArea = async (idArea?: number) => {
  let url = "/api/soporte/componentes-por-area";
  if (idArea) {
    url += `?idArea=${idArea}`;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Error al cargar los componentes por área");
  }

  return res.json();
};

export default function ComponentesPorAreaPage() {
  const [selectedAreaId, setSelectedAreaId] = useState<number | undefined>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["componentes-por-area", selectedAreaId],
    queryFn: () => fetchComponentesPorArea(selectedAreaId),
  });

  const areas: Area[] = data?.areas || [];
  const componentes: Componente[] = data?.componentes || [];

  // Group components by area
  const componentesPorArea = useMemo(() => {
    const grouped: { [key: number]: { area: Area; componentes: Componente[] } } = {};

    componentes.forEach((comp) => {
      if (!grouped[comp.IdArea]) {
        grouped[comp.IdArea] = {
          area: { IdArea: comp.IdArea, NombreArea: comp.NombreArea },
          componentes: [],
        };
      }
      grouped[comp.IdArea].componentes.push(comp);
    });

    return Object.values(grouped);
  }, [componentes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Componentes por Área
          </h1>
          <p className="text-slate-600">
            Vista de todos los componentes agrupados por área
          </p>
        </div>

        {/* Filter Section */}
        <Card className="mb-6 p-4 bg-white border border-slate-200">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Filtrar por Área
                </label>
                <Select
                  value={selectedAreaId?.toString() || ""}
                  onValueChange={(value) =>
                    setSelectedAreaId(value ? parseInt(value) : undefined)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar área..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las áreas</SelectItem>
                    {areas.map((area) => (
                      <SelectItem key={area.IdArea} value={area.IdArea.toString()}>
                        {area.NombreArea}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-sm text-slate-600">
              {isLoading ? (
                "Cargando..."
              ) : (
                <>
                  Total de componentes: <strong>{componentes.length}</strong>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card className="p-8 text-center bg-white border border-slate-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando componentes...</p>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-4 bg-red-50 border border-red-200">
            <p className="text-red-700">Error: {(error as Error).message}</p>
          </Card>
        )}

        {/* Components Display */}
        {!isLoading && !error && (
          <>
            {componentesPorArea.length === 0 ? (
              <Card className="p-8 text-center bg-white border border-slate-200">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No hay componentes para mostrar</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {componentesPorArea.map((grupo) => (
                  <Card
                    key={grupo.area.IdArea}
                    className="bg-white border border-slate-200 overflow-hidden"
                  >
                    {/* Area Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                      <h2 className="text-xl font-bold text-white">
                        {grupo.area.NombreArea}
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">
                        {grupo.componentes.length} componente{grupo.componentes.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Components Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                              Bien
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                              Código
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                              Componente
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                              Modelo
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                              Marca
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                              Serie
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                              Estado
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {grupo.componentes.map((comp, idx) => (
                            <tr
                              key={comp.IdBienComponente}
                              className={`border-b border-slate-200 ${
                                idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                              } hover:bg-blue-50 transition-colors`}
                            >
                              <td className="px-4 py-3 text-sm text-slate-900">
                                <div className="font-medium">
                                  {comp.BienDescripcion}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {comp.CodigoInventario}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                                {comp.NombreComponente}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {comp.Modelo || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {comp.Marca || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {comp.NumeroSerie || "-"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    comp.EstadoEquipo === "Activo" ||
                                    comp.EstadoEquipo === "Disponible"
                                      ? "bg-green-100 text-green-800"
                                      : comp.EstadoEquipo === "En Reparación"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : comp.EstadoEquipo === "Retirado"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-slate-100 text-slate-800"
                                  }`}
                                >
                                  {comp.EstadoEquipo || "Sin especificar"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
