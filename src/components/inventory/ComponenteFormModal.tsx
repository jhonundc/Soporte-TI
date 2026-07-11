"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import QuickCreateMarcaModal from "./QuickCreateMarcaModal";
import { notify } from "@/lib/feedback/toast";

const componenteSchema = z.object({
  IdBienComponente: z.string().optional(),
  IdBien: z.string().min(1, "El bien es requerido"),
  IdComponente: z.string().min(1, "El componente es requerido"),
  DescripcionModelo: z.string().max(200).optional(),
  Marca: z.string().max(100).optional(),
  Serie: z.string().max(100).optional(),
  CodigoPatrimonial: z.string().max(100).optional(),
  ProcesadorEspecificaciones: z.string().max(200).optional(),
  RAM: z.string().max(100).optional(),
  Almacenamiento: z.string().max(100).optional(),
  SistemaOperativo: z.string().max(100).optional(),
  UbicacionFisica: z.string().max(200).optional(),
  UsuarioAsignado: z.string().max(200).optional(),
  EstadoEquipo: z.string().max(100).optional(),
  Cantidad: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "La cantidad debe ser un número mayor o igual a 0",
  }),
  Observacion: z.string().optional(),
});

type ComponenteFormValues = z.infer<typeof componenteSchema>;

interface ComponenteFormModalProps {
  componente?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
}

export default function ComponenteFormModal({ componente, open, onOpenChange, readOnly = false }: ComponenteFormModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ComponenteFormValues>({
    resolver: zodResolver(componenteSchema),
  });

  const selectedMarca = watch("Marca");
  const codigoPatrimonialValue = watch("CodigoPatrimonial");
  const idBienValue = watch("IdBien");

  const { data: bienes } = useQuery({
    queryKey: ["bienesSelect"],
    queryFn: async () => {
      const res = await fetch("/api/bienes?includeInactive=true");
      if (!res.ok) throw new Error("Error al cargar los bienes");
      return res.json();
    },
  });

  const { data: componentesCatalog } = useQuery({
    queryKey: ["componentesCatalog"],
    queryFn: async () => {
      const res = await fetch("/api/componentes-catalogo");
      if (!res.ok) throw new Error("Error al cargar los componentes");
      return res.json();
    },
  });

  const { data: marcas } = useQuery({
    queryKey: ["marcas"],
    queryFn: async () => {
      const res = await fetch("/api/marcas");
      if (!res.ok) throw new Error("Error al cargar las marcas");
      return res.json();
    },
  });

  const { data: areas } = useQuery({
    queryKey: ["areasSelect"],
    queryFn: async () => {
      const res = await fetch("/api/areas");
      if (!res.ok) throw new Error("Error al cargar las áreas");
      return res.json();
    },
  });

  const { data: estados } = useQuery({
    queryKey: ["estadosSelect"],
    queryFn: async () => {
      const res = await fetch("/api/estados");
      if (!res.ok) throw new Error("Error al cargar los estados");
      return res.json();
    },
  });

  const selectedMarcaName =
    marcas?.find((m: { IdMarca: number; Marca: string }) => String(m.IdMarca) === String(selectedMarca))
      ?.Marca || selectedMarca || "";

  const selectedBien = bienes?.find((b: any) => String(b.IdBien) === watch("IdBien"));
  const selectedComponenteName = componentesCatalog?.find(
    (c: any) => String(c.IdComponente) === watch("IdComponente")
  )?.NombreComponente;

  const selectedAreaName = watch("UbicacionFisica") || "";
  const selectedEstadoName = watch("EstadoEquipo") || "";

  const normalizarCodigo = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

  const buscarBienPorCodigoPatrimonial = (codigo: string) => {
    const normalizedCode = normalizarCodigo(codigo);
    if (!normalizedCode || !Array.isArray(bienes)) {
      if (watch("IdBien")) {
        setValue("IdBien", "");
      }
      return;
    }

    const bienEncontrado = bienes.find((b: any) => {
      const codigoPatrimonial = normalizarCodigo(b.CodigoPatrimonial);
      const codigoInventario = normalizarCodigo(b.CodigoInventario);
      return codigoPatrimonial === normalizedCode || codigoInventario === normalizedCode;
    });

    if (bienEncontrado) {
      setValue("IdBien", String(bienEncontrado.IdBien));
      setValue("CodigoPatrimonial", String(bienEncontrado.CodigoPatrimonial ?? ""));
      return;
    }

    setValue("IdBien", "");
  };

  const codigoPatrimonialValido = Boolean(
    codigoPatrimonialValue &&
    Array.isArray(bienes) &&
    bienes.some((b: any) => {
      const codigoPatrimonial = normalizarCodigo(b.CodigoPatrimonial);
      const codigoInventario = normalizarCodigo(b.CodigoInventario);
      return codigoPatrimonial === normalizarCodigo(codigoPatrimonialValue) || codigoInventario === normalizarCodigo(codigoPatrimonialValue);
    })
  );

  useEffect(() => {
    if (open && selectedBien?.CodigoPatrimonial) {
      setValue("CodigoPatrimonial", selectedBien.CodigoPatrimonial);
      return;
    }

    if (open) {
      if (componente) {
        // Si tenemos IdBienComponente, obtener la versión más reciente del servidor
        (async () => {
          try {
            if (componente.IdBienComponente) {
              const res = await fetch(`/api/componentes?idBienComponente=${encodeURIComponent(String(componente.IdBienComponente))}`);
              if (res.ok) {
                const fresh = await res.json();
                const source = Array.isArray(fresh) ? fresh[0] : fresh;
                if (source) {
                  reset({
                    IdBienComponente: source.IdBienComponente ? String(source.IdBienComponente) : "",
                    IdBien: source.IdBien ? String(source.IdBien) : "",
                    IdComponente: source.IdComponente ? String(source.IdComponente) : "",
                    DescripcionModelo: source.DescripcionModelo || "",
                    Marca: typeof source.Marca === "object" ? source.Marca?.Marca || "" : source.Marca || "",
                    Serie: source.Serie || "",
                    CodigoPatrimonial: source.CodigoPatrimonial || "",
                    ProcesadorEspecificaciones: source.ProcesadorEspecificaciones || "",
                    RAM: source.RAM || "",
                    Almacenamiento: source.Almacenamiento || "",
                    SistemaOperativo: source.SistemaOperativo || "",
                    UbicacionFisica: source.UbicacionFisica || "",
                    UsuarioAsignado: source.UsuarioAsignado || "",
                    EstadoEquipo: source.EstadoEquipo || "",
                    Cantidad: String(source.Cantidad ?? 0),
                    Observacion: source.Observacion || "",
                  });
                  return;
                }
              }
            }
          } catch (e) {
            console.warn("No se pudo obtener detalle fresco:", e);
          }

          // Fallback a los datos que vinieron en `componente`
          reset({
            IdBienComponente: componente.IdBienComponente ? String(componente.IdBienComponente) : "",
            IdBien: componente.IdBien ? String(componente.IdBien) : "",
            IdComponente: componente.IdComponente ? String(componente.IdComponente) : "",
            DescripcionModelo: componente.DescripcionModelo || "",
            Marca: typeof componente.Marca === "object" ? componente.Marca?.Marca || "" : componente.Marca || "",
            Serie: componente.Serie || "",
            CodigoPatrimonial: componente.CodigoPatrimonial || "",
            ProcesadorEspecificaciones: componente.ProcesadorEspecificaciones || "",
            RAM: componente.RAM || "",
            Almacenamiento: componente.Almacenamiento || "",
            SistemaOperativo: componente.SistemaOperativo || "",
            UbicacionFisica: componente.UbicacionFisica || "",
            UsuarioAsignado: componente.UsuarioAsignado || "",
            EstadoEquipo: componente.EstadoEquipo || "",
            Cantidad: String(componente.Cantidad ?? 0),
            Observacion: componente.Observacion || "",
          });
        })();
      } else {
        reset({
          IdBienComponente: "",
          IdBien: "",
          IdComponente: "",
          DescripcionModelo: "",
          Marca: "",
          Serie: "",
          CodigoPatrimonial: "",
          ProcesadorEspecificaciones: "",
          RAM: "",
          Almacenamiento: "",
          SistemaOperativo: "",
          UbicacionFisica: "",
          UsuarioAsignado: "",
          EstadoEquipo: "",
          Cantidad: "0",
          Observacion: "",
        });
      }
    }
  }, [open, componente, reset, selectedBien, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: ComponenteFormValues) => {
      const url = "/api/componentes";
      const method = componente ? "PATCH" : "POST";
      const body = data;
      const payload = {
        ...body,
        Cantidad: parseInt(body.Cantidad, 10) || 0,
        IdBienComponente: body.IdBienComponente || componente?.IdBienComponente || "",
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Error al ${componente ? "actualizar" : "registrar"} el registro`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["componentes"] });
      onOpenChange(false);
      reset();
    },
    onError: (error) => notify.fromError(error),
  });

  const onSubmit = (data: ComponenteFormValues) => {
    if (readOnly) return;

    if (data.CodigoPatrimonial && !codigoPatrimonialValido) {
      notify.fromError(new Error("El código patrimonial ingresado no está registrado en bienes"));
      return;
    }

    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {readOnly ? "Detalle del componente del bien" : componente ? "Editar componente del bien" : "Registrar componente del bien"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <input type="hidden" {...register("IdBienComponente")} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Componente *</label>
              <Select
                value={watch("IdComponente") || ""}
                onValueChange={(val) => setValue("IdComponente", val as any)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar componente">{selectedComponenteName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {componentesCatalog?.map((c: any) => (
                    <SelectItem key={c.IdComponente} value={String(c.IdComponente)}>
                      {c.NombreComponente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.IdComponente && <p className="text-xs text-destructive">{errors.IdComponente.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Código patrimonial *</label>
              <Input
                {...register("CodigoPatrimonial")}
                placeholder="Ej. BP-001"
                readOnly={readOnly}
                onChange={(e) => {
                  setValue("CodigoPatrimonial", e.target.value);
                  buscarBienPorCodigoPatrimonial(e.target.value);
                }}
                onBlur={(e) => buscarBienPorCodigoPatrimonial(e.target.value)}
              />
              {errors.CodigoPatrimonial && <p className="text-xs text-destructive">{errors.CodigoPatrimonial.message}</p>}
              {!readOnly && codigoPatrimonialValue && !codigoPatrimonialValido && (
                <p className="text-xs text-destructive">El código patrimonial ingresado no está registrado en bienes.</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Marca</label>
            <div className="flex items-center gap-2">
              <Select
                value={watch("Marca") || ""}
                onValueChange={(val) => setValue("Marca", val as any)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar marca">{selectedMarcaName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {marcas?.map((m: any) => (
                    <SelectItem key={m.IdMarca} value={m.Marca}>
                      {m.Marca}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!readOnly && <QuickCreateMarcaModal />}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Descripción / Modelo</label>
              <Input
                {...register("DescripcionModelo")}
                placeholder="Ej. Inspiron 15, FX-8300"
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Número de Serie</label>
              <Input
                {...register("Serie")}
                placeholder="Ej. SN123456"
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Cantidad *</label>
              <Input
                type="number"
                {...register("Cantidad")}
                readOnly={readOnly}
              />
              {errors.Cantidad && <p className="text-xs text-destructive">{errors.Cantidad.message}</p>}
            </div>
            <div />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Procesador / Especificaciones</label>
              <Input
                {...register("ProcesadorEspecificaciones")}
                placeholder="Ej. Intel i5, AMD Ryzen"
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">RAM</label>
              <Input
                {...register("RAM")}
                placeholder="Ej. 8GB, 16GB"
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Almacenamiento</label>
              <Input
                {...register("Almacenamiento")}
                placeholder="Ej. 256GB SSD"
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Sistema Operativo</label>
              <Input
                {...register("SistemaOperativo")}
                placeholder="Ej. Windows 10"
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Ubicación Física</label>
              <Select
                value={watch("UbicacionFisica") || ""}
                onValueChange={(val) => setValue("UbicacionFisica", val as any)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar área">{selectedAreaName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {areas?.map((a: any) => (
                    <SelectItem key={a.IdArea} value={a.NombreArea}>
                      {a.NombreArea}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Usuario Asignado</label>
              <Input
                {...register("UsuarioAsignado")}
                placeholder="Ej. Juan Pérez"
                readOnly={readOnly}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Estado del Equipo</label>
              <Select
                value={watch("EstadoEquipo") || ""}
                onValueChange={(val) => setValue("EstadoEquipo", val as any)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado">{selectedEstadoName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {estados?.map((e: any) => (
                    <SelectItem key={e.IdEstado} value={e.EstadoBien}>
                      {e.EstadoBien}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Observación</label>
            <Textarea
              {...register("Observacion")}
              placeholder="Notas adicionales"
              className="min-h-[60px]"
              readOnly={readOnly}
            />
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {readOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando..." : componente ? "Actualizar" : "Guardar"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
