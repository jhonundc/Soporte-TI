"use client";

import { useQuery } from "@tanstack/react-query";
import { getAreas, getCondiciones, getEstados } from "@/app/actions/catalogs";
import { useSession } from "@/lib/hooks/useSession";
import { QUERY_STALE_TIME } from "@/lib/query-config";
import { queryKeys } from "@/lib/query-keys";
import { bienesService } from "@/services/bienes.service";
import type { BienRef } from "@/features/soporte/baja/types";

interface UseBajaCatalogsOptions {
  loadFormCatalogs?: boolean;
}

export function useBajaCatalogs(options: UseBajaCatalogsOptions = {}) {
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

  const condicionesQuery = useQuery({
    queryKey: queryKeys.catalogs.condiciones,
    queryFn: getCondiciones,
    enabled: loadFormCatalogs,
    ...catalogOptions,
  });

  const estadosQuery = useQuery({
    queryKey: queryKeys.catalogs.estados,
    queryFn: getEstados,
    enabled: loadFormCatalogs,
    ...catalogOptions,
  });

  const areasQuery = useQuery({
    queryKey: queryKeys.catalogs.areas,
    queryFn: getAreas,
    ...catalogOptions,
  });

  const sessionQuery = useSession();

  return {
    bienes: bienesQuery.data as BienRef[] | undefined,
    condiciones: condicionesQuery.data,
    estados: estadosQuery.data,
    areas: areasQuery.data,
    sessionData: sessionQuery.data,
  };
}
