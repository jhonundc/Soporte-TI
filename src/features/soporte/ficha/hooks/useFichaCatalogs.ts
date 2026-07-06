"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAreas,
  getCondiciones,
  getEstados,
  getPrioridades,
  getTiposBien,
} from "@/app/actions/catalogs";
import { fetchSessionClient } from "@/lib/auth/session-client";
import { queryKeys } from "@/lib/query-keys";
import { bienesService } from "@/services/bienes.service";
import type {
  AreaRef,
  BienRef,
  CondicionRef,
  EstadoRef,
  PrioridadRef,
  TipoBienRef,
} from "@/features/soporte/ficha/types";

export function useFichaCatalogs() {
  const bienesQuery = useQuery({
    queryKey: queryKeys.bienes.all(),
    queryFn: bienesService.list,
  });

  const condicionesQuery = useQuery<CondicionRef[]>({
    queryKey: ["condicionesFichas"],
    queryFn: getCondiciones,
  });

  const estadosQuery = useQuery<EstadoRef[]>({
    queryKey: ["estadosFichas"],
    queryFn: getEstados,
  });

  const prioridadesQuery = useQuery<PrioridadRef[]>({
    queryKey: ["prioridadesFichas"],
    queryFn: getPrioridades,
  });

  const areasQuery = useQuery<AreaRef[]>({
    queryKey: queryKeys.catalogs.areas,
    queryFn: getAreas,
  });

  const tiposBienQuery = useQuery<TipoBienRef[]>({
    queryKey: ["tiposBien"],
    queryFn: getTiposBien,
  });

  const sessionQuery = useQuery({
    queryKey: queryKeys.session(),
    queryFn: fetchSessionClient,
  });

  return {
    bienes: bienesQuery.data as BienRef[] | undefined,
    condiciones: condicionesQuery.data,
    estados: estadosQuery.data,
    prioridades: prioridadesQuery.data,
    areas: areasQuery.data,
    tiposBien: tiposBienQuery.data,
    sessionData: sessionQuery.data,
  };
}
