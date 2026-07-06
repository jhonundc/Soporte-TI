"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { notify } from "@/lib/feedback/toast";
import { exportFichasSoporteListExcel } from "@/lib/export/fichas-soporte-list-excel";
import { queryKeys } from "@/lib/query-keys";
import { fichaService } from "@/services/ficha.service";
import type { FichaSoporteRecord } from "@/features/soporte/ficha/types";

export const ESTADOS_TICKET = [
  "Pendiente",
  "En Proceso",
  "Atendido",
  "Derivado",
  "Cerrado",
] as const;

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

export function useFichaList() {
  const [buscarText, setBuscarText] = useState("");
  const [filterEstadoTicket, setFilterEstadoTicket] = useState("");
  const [filterPrioridad, setFilterPrioridad] = useState("");
  const [filterArea, setFilterArea] = useState("");

  const { data: fichas, isLoading, error } = useQuery({
    queryKey: queryKeys.fichasSoporte(),
    queryFn: fichaService.list,
  });

  const displayFichas = useMemo(() => {
    const list = fichas ?? [];
    const texto = buscarText.trim().toLowerCase();

    return list.filter((ficha) => {
      const matchesText = !texto || matchesSearch(ficha, texto);
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

      return matchesText && matchesEstadoTicket && matchesPrioridad && matchesArea;
    });
  }, [buscarText, filterArea, filterEstadoTicket, filterPrioridad, fichas]);

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
