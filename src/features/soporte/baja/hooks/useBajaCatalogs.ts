"use client";

import { useQuery } from "@tanstack/react-query";
import { getAreas, getCondiciones, getEstados } from "@/app/actions/catalogs";
import { fetchSessionClient } from "@/lib/auth/session-client";
import { queryKeys } from "@/lib/query-keys";
import { bienesService } from "@/services/bienes.service";
import type { BienRef } from "@/features/soporte/baja/types";

export function useBajaCatalogs() {
  const bienesQuery = useQuery({
    queryKey: queryKeys.bienes.all(),
    queryFn: bienesService.list,
  });

  const condicionesQuery = useQuery({
    queryKey: queryKeys.catalogs.condiciones,
    queryFn: getCondiciones,
  });

  const estadosQuery = useQuery({
    queryKey: queryKeys.catalogs.estados,
    queryFn: getEstados,
  });

  const areasQuery = useQuery({
    queryKey: queryKeys.catalogs.areas,
    queryFn: getAreas,
  });

  const sessionQuery = useQuery({
    queryKey: queryKeys.session(),
    queryFn: fetchSessionClient,
  });

  return {
    bienes: bienesQuery.data as BienRef[] | undefined,
    condiciones: condicionesQuery.data,
    estados: estadosQuery.data,
    areas: areasQuery.data,
    sessionData: sessionQuery.data,
  };
}
