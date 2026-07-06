"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit, Eye, Power } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { getAreas, getTiposEstacion } from "@/app/actions/catalogs";
import QuickCreateTipoEstacionModal from "@/components/inventory/QuickCreateTipoEstacionModal";
import QuickCreateAreaModal from "@/components/inventory/QuickCreateAreaModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable } from "@/components/data-display/DataTable";
import { TableActionButton, TableRowActions } from "@/components/data-display/TableRowActions";
import { cn } from "@/lib/utils";

const fetchRedes = async () => {
  const res = await fetch("/api/redes");
  if (!res.ok) throw new Error("Error al cargar las redes");
  return res.json();
};

export default function RedesPage() {
  const [open, setOpen] = useState(false);
  const [editingRed, setEditingRed] = useState<any>(null);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  const { data: redes, isLoading, error } = useQuery({
    queryKey: ["redes"],
    queryFn: fetchRedes,
  });

  const { data: areas } = useQuery({ queryKey: ["areas"], queryFn: () => getAreas() });
  const { data: tiposEstacion } = useQuery({ queryKey: ["tiposEstacion"], queryFn: () => getTiposEstacion() });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingRed ? "PATCH" : "POST";
      const res = await fetch("/api/redes", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRed ? { ...data, IdIp: editingRed.IdIp } : data),
      });
      if (!res.ok) throw new Error(`Error al ${editingRed ? "actualizar" : "crear"} la red`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redes"] });
      setOpen(false);
      reset();
      setEditingRed(null);
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const handleEdit = (red: any) => {
    setEditingRed(red);
    setValue("DireccionIp", red.DireccionIp);
    setValue("Vlan", red.Vlan || "");
    setValue("Estacion", red.Estacion || "");
    setValue("IdTipoEstacion", red.IdTipoEstacion?.toString() || "");
    setValue("IdArea", red.IdArea?.toString() || "");
    setValue("DireccionMac", red.DireccionMac || "");
    setValue("DHCP", red.DHCP ? "true" : "false");
    setValue("Observacion", red.Observacion || "");
    setOpen(true);
  };

  const handleNew = () => {
    setEditingRed(null);
    reset();
    setOpen(true);
  };

  const selectedArea = watch("IdArea");
  const selectedTipo = watch("IdTipoEstacion");
  const ipValue = watch("DireccionIp");
  const isDhcp = watch("DHCP") === "true";
  
  const selectedAreaName = areas?.find((a: any) => String(a.IdArea) === String(selectedArea))?.NombreArea;
  const selectedTipoName = tiposEstacion?.find((t: any) => String(t.IdTipoEstacion) === String(selectedTipo))?.TipoEstacion;

  // Lógica de VLAN Automática
  useEffect(() => {
    if (ipValue && !isDhcp) {
      const parts = ipValue.split('.');
      if (parts.length >= 3) {
        const vlan = parts[2];
        setValue("Vlan", vlan);
      }
    }
  }, [ipValue, setValue, isDhcp]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "DireccionIp",
        header: "Dirección IP",
        cell: ({ getValue }) => (
          <span className="font-medium text-primary">{String(getValue() ?? "-")}</span>
        ),
      },
      {
        accessorKey: "Vlan",
        header: "VLAN",
        cell: ({ getValue }) => String(getValue() ?? "-") || "-",
      },
      {
        accessorKey: "Estacion",
        header: "Estación",
        cell: ({ getValue }) => String(getValue() ?? "-") || "-",
      },
      {
        id: "TipoEstacion",
        header: "Tipo",
        cell: ({ row }) => row.original.TipoEstacion?.TipoEstacion || "-",
      },
      {
        id: "Area",
        header: "Área",
        cell: ({ row }) => row.original.Area?.NombreArea || row.original.NombreArea || "-",
      },
      {
        accessorKey: "DHCP",
        header: "Modo",
        cell: ({ getValue }) => {
          const dhcp = Boolean(getValue());
          return (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                dhcp
                  ? "bg-success/10 text-success ring-success/20"
                  : "bg-primary/10 text-primary ring-primary/20"
              )}
            >
              {dhcp ? "DHCP" : "Estática"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => {
          const red = row.original;
          return (
            <TableRowActions>
              <TableActionButton title="Ver" aria-label="Ver red">
                <Eye className="size-4" />
              </TableActionButton>
              <TableActionButton
                actionVariant="primary"
                title="Editar"
                aria-label="Editar red"
                onClick={() => handleEdit(red)}
              >
                <Edit className="size-4" />
              </TableActionButton>
              <TableActionButton actionVariant="warning" title="Desactivar" aria-label="Desactivar">
                <Power className="size-4" />
              </TableActionButton>
              <TableActionButton actionVariant="destructive" title="Eliminar" aria-label="Eliminar">
                <Trash2 className="size-4" />
              </TableActionButton>
            </TableRowActions>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario de Redes (IPs)"
        description="Gestiona las direcciones IP y puntos de red."
        actions={
          <Button size="lg" className="gap-2" onClick={handleNew}>
            <Plus className="size-4" aria-hidden="true" /> Nueva IP
          </Button>
        }
      />

        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setEditingRed(null);
            reset();
          }
        }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRed ? "Editar Red / IP" : "Registrar Nueva IP"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Modo IP</label>
                <Select value={watch("DHCP") || "false"} onValueChange={(val) => setValue("DHCP", val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Estática</SelectItem>
                    <SelectItem value="true">DHCP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Dirección IP *</label>
                  <Input 
                    {...register("DireccionIp", { required: !isDhcp ? "La IP es requerida" : false })} 
                    placeholder={isDhcp ? "Asignada por DHCP" : "Ej. 192.168.10.22"} 
                    disabled={isDhcp}
                  />
                  {errors.DireccionIp && <p className="text-xs text-red-500">{(errors.DireccionIp as any).message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">VLAN</label>
                  <Input 
                    {...register("Vlan")} 
                    placeholder={isDhcp ? "Auto" : "Ej. 10"} 
                    disabled={isDhcp}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Estación / Nombre</label>
                  <Input {...register("Estacion")} placeholder="Ej. PC-CONTABILIDAD" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Dirección MAC</label>
                  <Input {...register("DireccionMac")} placeholder="Ej. AA:BB:CC:DD:EE:FF" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-foreground">Tipo Estación</label>
                    <QuickCreateTipoEstacionModal />
                  </div>
                  <Select value={watch("IdTipoEstacion") ? String(watch("IdTipoEstacion")) : ""} onValueChange={(val) => setValue("IdTipoEstacion", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar">{selectedTipoName}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {tiposEstacion?.map((t: any) => (
                        <SelectItem key={t.IdTipoEstacion} value={t.IdTipoEstacion.toString()}>{t.TipoEstacion}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-foreground">Área</label>
                    <QuickCreateAreaModal />
                  </div>
                  <Select value={watch("IdArea") ? String(watch("IdArea")) : ""} onValueChange={(val) => setValue("IdArea", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar">{selectedAreaName}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {areas?.map((a: any) => (
                        <SelectItem key={a.IdArea} value={a.IdArea.toString()}>{a.NombreArea}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Observación</label>
                <Input {...register("Observacion")} placeholder="Ej. Punto de red fallando" />
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

      <DataTable
        columns={columns}
        data={redes ?? []}
        isLoading={isLoading}
        error={error as Error | null}
        emptyMessage="No hay redes registradas. Crea una para comenzar."
      />
    </div>
  );
}
