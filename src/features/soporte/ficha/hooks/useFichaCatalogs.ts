"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAreas,
  getCondiciones,
  getEstados,
  getPrioridades,
  getTiposBien,
} from "@/app/actions/catalogs";
import { useSession } from "@/lib/hooks/useSession";
import { QUERY_STALE_TIME } from "@/lib/query-config";
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

interface UseFichaCatalogsOptions {
  loadFormCatalogs?: boolean;
}

export function useFichaCatalogs(options: UseFichaCatalogsOptions = {}) {
  const loadFormCatalogs = options.loadFormCatalogs ?? true;
  const catalogOptions = {
    staleTime: QUERY_STALE_TIME.catalogs,
    gcTime: 30 * 60 * 1000,
  };

  const bienesQuery = useQuery({
    queryKey: queryKeys.bienes.all(),
    queryFn: bienesService.list,
    enabled: loadFormCatalogs,
    ...catalogOptions,
  });

  const condicionesQuery = useQuery<CondicionRef[]>({
    queryKey: queryKeys.catalogs.condiciones,
    queryFn: getCondiciones,
    enabled: loadFormCatalogs,
    ...catalogOptions,
  });

  const estadosQuery = useQuery<EstadoRef[]>({
    queryKey: queryKeys.catalogs.estados,
    queryFn: getEstados,
    enabled: loadFormCatalogs,
    ...catalogOptions,
  });

  const prioridadesQuery = useQuery<PrioridadRef[]>({
    queryKey: queryKeys.catalogs.prioridades,
    queryFn: getPrioridades,
    ...catalogOptions,
  });

  const areasQuery = useQuery<AreaRef[]>({
    queryKey: queryKeys.catalogs.areas,
    queryFn: getAreas,
    ...catalogOptions,
  });

  const tiposBienQuery = useQuery<TipoBienRef[]>({
    queryKey: queryKeys.catalogs.tiposBien,
    queryFn: getTiposBien,
    enabled: loadFormCatalogs,
    ...catalogOptions,
  });

  const sessionQuery = useSession();

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
