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
    mutationFn: async ({
      data,
      editingId,
      evidence,
    }: {
      data: Record<string, unknown>;
      editingId?: number;
      evidence?: File | null;
    }) => {
      const saved = await bajaService.save(data, editingId);
      if (editingId && evidence) {
        await bajaService.saveEvidence(editingId, evidence);
      }
      return saved;
    },
    onSuccess: () => {
      invalidate();
      onSaveSuccess?.();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bajaService.remove(id),
    onSuccess: invalidate,
  });

  const deleteEvidenceMutation = useMutation({
    mutationFn: (id: number) => bajaService.removeEvidence(id),
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

  return { saveMutation, deleteMutation, deleteEvidenceMutation, handleDelete };
}
