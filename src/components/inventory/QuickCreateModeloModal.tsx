"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface QuickCreateModeloModalProps {
  idMarca?: string;
  idCategoria?: string;
}

export default function QuickCreateModeloModal(_: QuickCreateModeloModalProps) {
  const [open, setOpen] = useState(false);
  const [modelo, setModelo] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (nombreModelo: string) => {
      const res = await fetch("/api/modelos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Modelo: nombreModelo }),
      });
      if (!res.ok) throw new Error("Error al crear el modelo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelos"] });
      setOpen(false);
      setModelo("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!modelo.trim()) return;
    mutation.mutate(modelo);
  };

  const isDisabled = false;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="flex items-center text-xs font-medium text-primary hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground"
        disabled={isDisabled}
        title=""
      >
        <Plus className="mr-0.5 size-3" aria-hidden="true" /> Nuevo
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Nuevo Modelo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Nombre del Modelo *</label>
            <Input
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              placeholder="Ej. ProBook 450 G8"
            />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || isDisabled}>
              {mutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
