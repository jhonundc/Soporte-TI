"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { bajaService } from "@/services/baja.service";
import type { BajaRecord } from "@/features/soporte/baja/types";

function matchesSearch(baja: BajaRecord, term: string): boolean {
  const fields = [
    baja.NumeroFichaBaja,
    baja.Bien?.Descripcion,
    baja.Bien?.CodigoPatrimonial,
    baja.Bien?.CodigoInventario,
    baja.UnidadOrganica,
    baja.Estado?.EstadoBien,
    baja.Condicion?.Condicion,
    baja.Fundamentacion,
    baja.Recomendacion,
    baja.Responsable,
    baja.CausalBaja,
    baja.UsuarioRegistro?.Nombres,
    baja.UsuarioRegistro?.Usuario,
  ];

  return fields.some((field) => String(field || "").toLowerCase().includes(term));
}

export function useBajaList() {
  const [buscarText, setBuscarText] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterCondicion, setFilterCondicion] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  const { data: bajas, isLoading, error } = useQuery({
    queryKey: queryKeys.fichasBaja(),
    queryFn: bajaService.list,
  });

  const displayBajas = useMemo(() => {
    const list = bajas ?? [];
    const term = buscarText.toLowerCase().trim();

    return list.filter((baja) => {
      const matchesText = !term || matchesSearch(baja, term);
      const matchesArea =
        !filterArea ||
        String(baja.UnidadOrganica || "").toLowerCase() === filterArea.toLowerCase();
      const matchesCondicion =
        !filterCondicion ||
        String(baja.Condicion?.Condicion || "").toLowerCase() === filterCondicion.toLowerCase();
      const matchesEstado =
        !filterEstado ||
        String(baja.Estado?.EstadoBien || "").toLowerCase() === filterEstado.toLowerCase();

      return matchesText && matchesArea && matchesCondicion && matchesEstado;
    });
  }, [bajas, buscarText, filterArea, filterCondicion, filterEstado]);

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
