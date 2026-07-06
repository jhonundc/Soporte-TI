"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export default function QuickCreateMarcaModal() {
  const [open, setOpen] = useState(false);
  const [marca, setMarca] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (nombreMarca: string) => {
      const res = await fetch("/api/marcas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Marca: nombreMarca }),
      });
      if (!res.ok) throw new Error("Error al crear la marca");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marcas"] });
      setOpen(false);
      setMarca("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!marca.trim()) return;
    mutation.mutate(marca);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex items-center text-xs font-medium text-primary hover:text-primary/80">
        <Plus className="h-3 w-3 mr-0.5" /> Nuevo
      </DialogTrigger>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Nueva Marca</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Nombre de la Marca *</label>
            <Input 
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              placeholder="Ej. Dell" 
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
