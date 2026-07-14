"use client";

import { useMemo, useState, type UIEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { notify } from "@/lib/feedback/toast";
import { exportFichasSoporteListExcel } from "@/lib/export/fichas-soporte-list-excel";
import { QUERY_STALE_TIME } from "@/lib/query-config";
import { queryKeys } from "@/lib/query-keys";
import { fichaService } from "@/services/ficha.service";
import type { FichaSoporteRecord } from "@/features/soporte/ficha/types";

export const ESTADOS_TICKET = [
  "Pendiente",
  "Aprobada",
  "Rechazada",
  "En Proceso",
  "Atendido",
  "Derivado",
  "Cerrado",
] as const;

const PAGE_SIZE = 25;

function matchesSearch(ficha: FichaSoporteRecord, texto: string): boolean {
  const invCode = (ficha.Bien?.CodigoInventario || "").toLowerCase();
  const patCode = (ficha.Bien?.CodigoPatrimonial || "").toLowerCase();
  const serial = (ficha.Bien?.NumeroSerie || "").toLowerCase();
  const numFicha = (ficha.NumeroFicha || "").toLowerCase();
  const resp = (ficha.Responsable || "").toLowerCase();
  const dep = (ficha.Dependencia || "").toLowerCase();
  const amb = (ficha.Ambiente || "").toLowerCase();
  const prob = (ficha.DescripcionProblema || "").toLowerCase();
  const trabajos = (ficha.TrabajosRealizados || "").toLowerCase();
  const diag = (ficha.Diagnostico || "").toLowerCase();
  const rec = (ficha.Recomendacion || "").toLowerCase();

  return (
    numFicha.includes(texto) ||
    invCode.includes(texto) ||
    patCode.includes(texto) ||
    serial.includes(texto) ||
    resp.includes(texto) ||
    dep.includes(texto) ||
    amb.includes(texto) ||
    prob.includes(texto) ||
    trabajos.includes(texto) ||
    diag.includes(texto) ||
    rec.includes(texto)
  );
}

function getEstadoMostrado(ficha: FichaSoporteRecord): string {
  const estadoAprobacion = String(ficha.EstadoAprobacion || "").trim();
  return estadoAprobacion && estadoAprobacion.toUpperCase() !== "PENDIENTE"
    ? estadoAprobacion
    : String(ficha.EstadoTicket || "").trim();
}

export function useFichaList() {
  const [buscarText, setBuscarTextState] = useState("");
  const [filterEstadoTicket, setFilterEstadoTicketState] = useState("");
  const [filterPrioridad, setFilterPrioridadState] = useState("");
  const [filterArea, setFilterAreaState] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const resetVisibleCount = () => setVisibleCount(PAGE_SIZE);

  const setBuscarText = (value: string) => {
    setBuscarTextState(value);
    resetVisibleCount();
  };

  const setFilterEstadoTicket = (value: string) => {
    setFilterEstadoTicketState(value);
    resetVisibleCount();
  };

  const setFilterPrioridad = (value: string) => {
    setFilterPrioridadState(value);
    resetVisibleCount();
  };

  const setFilterArea = (value: string) => {
    setFilterAreaState(value);
    resetVisibleCount();
  };

  const numeroFichaBuscada = buscarText.trim();

  const { data: fichas, isLoading, error } = useQuery({
    queryKey: queryKeys.fichasSoporte(numeroFichaBuscada),
    queryFn: () => fichaService.list({ numeroFicha: numeroFichaBuscada || undefined }),
    staleTime: QUERY_STALE_TIME.lists,
    gcTime: 15 * 60 * 1000,
  });

  const filteredFichas = useMemo(() => {
    const list = fichas ?? [];
    return list.filter((ficha) => {
      const matchesEstadoTicket =
        !filterEstadoTicket ||
        getEstadoMostrado(ficha).toLowerCase() === filterEstadoTicket.toLowerCase();
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

  const displayFichas = useMemo(
    () => filteredFichas.slice(0, visibleCount),
    [filteredFichas, visibleCount]
  );

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

  const handleTableScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 40) {
      if (visibleCount < filteredFichas.length) {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredFichas.length));
      }
    }
  };

  const exportToExcel = async () => {
    const listToExport = filteredFichas;
    if (listToExport.length === 0) {
      notify.warning("No hay datos para exportar");
      return;
    }
    await exportFichasSoporteListExcel(listToExport);
  };

  return {
    fichas,
    displayFichas,
    filteredCount: filteredFichas.length,
    visibleCount,
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
    handleTableScroll,
    exportToExcel,
  };
}
