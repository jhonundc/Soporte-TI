"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/lib/feedback/toast";
import { queryKeys } from "@/lib/query-keys";
import { fichaService } from "@/services/ficha.service";

export function useFichaMutations(onSaveSuccess?: () => void) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.fichasSoporte() });
  };

  const saveMutation = useMutation({
    mutationFn: ({
      data,
      editingId,
    }: {
      data: Record<string, unknown>;
      editingId?: number;
    }) => fichaService.save(data, editingId),
    onSuccess: () => {
      invalidate();
      onSaveSuccess?.();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fichaService.remove(id),
    onSuccess: invalidate,
  });

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de cerrar este ticket de soporte?")) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch {
        notify.error("Error al cerrar la ficha");
      }
    }
  };

  return { saveMutation, deleteMutation, handleDelete };
}
