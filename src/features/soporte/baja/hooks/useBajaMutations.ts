"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/lib/feedback/toast";
import { queryKeys } from "@/lib/query-keys";
import { bajaService } from "@/services/baja.service";

export function useBajaMutations(onSaveSuccess?: () => void) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.fichasBaja() });
    queryClient.invalidateQueries({ queryKey: queryKeys.bienes.all() });
  };

  const saveMutation = useMutation({
    mutationFn: ({
      data,
      editingId,
    }: {
      data: Record<string, unknown>;
      editingId?: number;
    }) => bajaService.save(data, editingId),
    onSuccess: () => {
      invalidate();
      onSaveSuccess?.();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bajaService.remove(id),
    onSuccess: invalidate,
  });

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Desea eliminar esta ficha de baja?")) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch {
      notify.error("No se pudo eliminar la ficha");
    }
  };

  return { saveMutation, deleteMutation, handleDelete };
}
