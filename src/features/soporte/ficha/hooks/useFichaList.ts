"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { notify } from "@/lib/feedback/toast";
import { exportFichasSoporteListExcel } from "@/lib/export/fichas-soporte-list-excel";
import { queryKeys } from "@/lib/query-keys";
import { fichaService } from "@/services/ficha.service";

export const ESTADOS_TICKET = [
  "Pendiente",
  "En Proceso",
  "Atendido",
  "Derivado",
  "Cerrado",
] as const;

export function useFichaList() {
  const [buscarText, setBuscarText] = useState("");
  const [filterEstadoTicket, setFilterEstadoTicket] = useState("");
  const [filterPrioridad, setFilterPrioridad] = useState("");
  const [filterArea, setFilterArea] = useState("");

  const numeroFichaBuscada = buscarText.trim();

  const { data: fichas, isLoading, error } = useQuery({
    queryKey: queryKeys.fichasSoporte(numeroFichaBuscada),
    queryFn: () => fichaService.list({ numeroFicha: numeroFichaBuscada || undefined }),
  });

  const displayFichas = useMemo(() => {
    const list = fichas ?? [];
    return list.filter((ficha) => {
      const matchesEstadoTicket =
        !filterEstadoTicket ||
        String(ficha.EstadoTicket || "").toLowerCase() === filterEstadoTicket.toLowerCase();
      const prioridadNombre =
        ficha.Prioridad?.NombrePrioridad || String(ficha.IdPrioridad ?? "");
      const matchesPrioridad =
        !filterPrioridad ||
        String(prioridadNombre).toLowerCase() === filterPrioridad.toLowerCase();
      const matchesArea =
        !filterArea ||
        String(ficha.Dependencia || "").toLowerCase() === filterArea.toLowerCase();

      return matchesEstadoTicket && matchesPrioridad && matchesArea;
    });
  }, [filterArea, filterEstadoTicket, filterPrioridad, fichas]);

  const activeFilterCount =
    Number(Boolean(buscarText.trim())) +
    Number(Boolean(filterEstadoTicket)) +
    Number(Boolean(filterPrioridad)) +
    Number(Boolean(filterArea));

  const clearFilters = () => {
    setBuscarText("");
    setFilterEstadoTicket("");
    setFilterPrioridad("");
    setFilterArea("");
  };

  const exportToExcel = async () => {
    const listToExport = displayFichas;
    if (listToExport.length === 0) {
      notify.warning("No hay datos para exportar");
      return;
    }
    await exportFichasSoporteListExcel(listToExport);
  };

  return {
    fichas,
    displayFichas,
    isLoading,
    error: error as Error | null,
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
  };
}
