"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export default function QuickCreateTipoEstacionModal() {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (nombreTipo: string) => {
      const res = await fetch("/api/tipos-estacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TipoEstacion: nombreTipo }),
      });
      if (!res.ok) throw new Error("Error al crear el tipo de estación");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tiposEstacion"] });
      setOpen(false);
      setTipo("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!tipo.trim()) return;
    mutation.mutate(tipo);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex items-center text-xs font-medium text-primary hover:text-primary/80">
        <Plus className="h-3 w-3 mr-0.5" /> Nuevo
      </DialogTrigger>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Nuevo Tipo de Estación</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Nombre del Tipo *</label>
            <Input 
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Ej. Servidor" 
            />
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
