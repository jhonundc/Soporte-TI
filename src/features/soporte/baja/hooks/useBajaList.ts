"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { bajaService } from "@/services/baja.service";

export function useBajaList() {
  const [buscarText, setBuscarText] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterCondicion, setFilterCondicion] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  const numeroFichaBuscada = buscarText.trim();

  const { data: bajas, isLoading, error } = useQuery({
    queryKey: queryKeys.fichasBaja(numeroFichaBuscada),
    queryFn: () => bajaService.list({ numeroFicha: numeroFichaBuscada || undefined }),
  });

  const displayBajas = useMemo(() => {
    const list = bajas ?? [];
    return list.filter((baja) => {
      const matchesArea =
        !filterArea ||
        String(baja.UnidadOrganica || "").toLowerCase() === filterArea.toLowerCase();
      const matchesCondicion =
        !filterCondicion ||
        String(baja.Condicion?.Condicion || "").toLowerCase() === filterCondicion.toLowerCase();
      const matchesEstado =
        !filterEstado ||
        String(baja.Estado?.EstadoBien || "").toLowerCase() === filterEstado.toLowerCase();

      return matchesArea && matchesCondicion && matchesEstado;
    });
  }, [bajas, filterArea, filterCondicion, filterEstado]);

  const activeFilterCount =
    Number(Boolean(buscarText.trim())) +
    Number(Boolean(filterArea)) +
    Number(Boolean(filterCondicion)) +
    Number(Boolean(filterEstado));

  const clearFilters = () => {
    setBuscarText("");
    setFilterArea("");
    setFilterCondicion("");
    setFilterEstado("");
  };

  return {
    bajas,
    displayBajas,
    isLoading,
    error: error as Error | null,
    buscarText,
    setBuscarText,
    filterArea,
    setFilterArea,
    filterCondicion,
    setFilterCondicion,
    filterEstado,
    setFilterEstado,
    activeFilterCount,
    clearFilters,
  };
}
