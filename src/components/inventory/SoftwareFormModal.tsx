"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { notify } from "@/lib/feedback/toast";

const softwareSchema = z.object({
  TipoSoftware: z.string().min(1, "El tipo de software es obligatorio."),
  VersionSoftware: z.string().min(1, "La versión es obligatoria."),
  ProveedorEntidad: z.string().min(2, "El proveedor o entidad es obligatorio."),
  TipoLicencia: z.string().min(1, "El tipo de licencia es obligatorio."),
  CantidadLicencias: z.string().regex(/^\d+$/, "La cantidad de licencias debe ser un número entero."),
  EstadoLicencia: z.string().min(1, "El estado de la licencia es obligatorio."),
  IdSoftwareCatalogo: z.string().min(1, "Selecciona un software del catálogo."),
  FechaCaducidad: z.string().optional(),
  EquiposUsuariosAsignados: z.string().optional(),
  UsoFinalidad: z.string().optional(),
});

export type SoftwareFormValues = z.infer<typeof softwareSchema>;

interface SoftwareFormModalProps {
  software?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
}

const fetchTiposSoftware = async () => {
  const res = await fetch("/api/tipos-software");
  if (!res.ok) throw new Error("Error al cargar tipos de software");
  return res.json();
};

const fetchProveedores = async () => {
  const res = await fetch("/api/proveedores");
  if (!res.ok) throw new Error("Error al cargar proveedores");
  return res.json();
};

// (No se necesitan consultas a bienes/usuarios para este formulario)

const fetchTiposLicencia = async () => {
  const res = await fetch("/api/tipos-licencia");
  if (!res.ok) throw new Error("Error al cargar tipos de licencia");
  return res.json();
};

const fetchTiposAsignacion = async () => {
  const res = await fetch("/api/tipos-asignacion-software");
  if (!res.ok) throw new Error("Error al cargar tipos de asignación");
  return res.json();
};

const fetchSoftwareCatalogo = async () => {
  const res = await fetch("/api/software-catalogo");
  if (!res.ok) throw new Error("Error al cargar catálogo de software");
  return res.json();
};

export default function SoftwareFormModal({
  software,
  open,
  onOpenChange,
  readOnly = false,
}: SoftwareFormModalProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SoftwareFormValues>({
    resolver: zodResolver(softwareSchema),
  });

  const findLabel = (list: any[], id: string | number | undefined, idKey: string, labelKey: string) => {
    if (!id) return "";
    const found = list.find((x: any) => String(x[idKey]) === String(id) || String(x[labelKey]) === String(id));
    return found ? String(found[labelKey]) : String(id || "");
  };

  const { data: tiposSoftware = [] } = useQuery({
    queryKey: ["tipos-software"],
    queryFn: fetchTiposSoftware,
    enabled: open,
  });

  const { data: proveedores = [] } = useQuery({
    queryKey: ["proveedores"],
    queryFn: fetchProveedores,
    enabled: open,
  });

  const { data: tiposLicencia = [] } = useQuery({
    queryKey: ["tipos-licencia"],
    queryFn: fetchTiposLicencia,
    enabled: open,
  });

  const { data: tiposAsignacion = [] } = useQuery({
    queryKey: ["tipos-asignacion-software"],
    queryFn: fetchTiposAsignacion,
    enabled: open,
  });

  const { data: softwareCatalogo = [] } = useQuery({
    queryKey: ["software-catalogo"],
    queryFn: fetchSoftwareCatalogo,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    if (software) {
      reset({
        // the DB stores names (not ids) for these fields
        TipoSoftware: software.TipoSoftware || "",
        VersionSoftware: software.VersionSoftware || "",
        ProveedorEntidad: software.ProveedorEntidad || "",
        TipoLicencia: software.TipoLicencia || "",
        CantidadLicencias: String(software.CantidadLicencias ?? "0"),
        EstadoLicencia: software.EstadoLicencia || "",
        IdSoftwareCatalogo: software.IdSoftwareCatalogo ? String(software.IdSoftwareCatalogo) : (software.NombreSoftware ? String(software.NombreSoftware) : ""),
        FechaCaducidad: software.FechaCaducidad ? new Date(software.FechaCaducidad).toISOString().slice(0,10) : "",
        EquiposUsuariosAsignados: software.EquiposUsuariosAsignados || "",
        UsoFinalidad: software.UsoFinalidad || "",
      });
    } else {
      reset({
        TipoSoftware: "",
        VersionSoftware: "",
        ProveedorEntidad: "",
        TipoLicencia: "",
        CantidadLicencias: "0",
        EstadoLicencia: "",
        IdSoftwareCatalogo: "",
        FechaCaducidad: "",
        EquiposUsuariosAsignados: "",
        UsoFinalidad: "",
      });
    }
  }, [open, software, reset]);

  const mutation = useMutation({
    mutationFn: async (values: SoftwareFormValues) => {
      const method = software ? "PATCH" : "POST";
      // map catalog selection into NombreSoftware for existing stored procedures
      const payload = {
        ...values,
        NombreSoftware: values.IdSoftwareCatalogo,
      } as any;
      const body = software ? { IdSoftware: software.IdSoftware, ...payload } : payload;
      const res = await fetch("/api/software", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al guardar el software");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["software"] });
      onOpenChange(false);
    },
    onError: (error) => notify.fromError(error),
  });

  const onSubmit = (values: SoftwareFormValues) => {
    if (readOnly) return;
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {readOnly
              ? "Detalle del Software"
              : software
              ? "Editar Software"
              : "Registrar Software"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Catálogo de software *</label>
              <Select 
                value={watch("IdSoftwareCatalogo")} 
                onValueChange={(value) => value !== null && setValue("IdSoftwareCatalogo", value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue>{watch("IdSoftwareCatalogo") || "Selecciona un software del catálogo"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {softwareCatalogo.map((sw: any) => (
                    <SelectItem key={sw.IdSoftwareCatalogo} value={String(sw.NombreSoftware)}>
                      {sw.NombreSoftware}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.IdSoftwareCatalogo && (
                <p className="text-xs text-destructive">{errors.IdSoftwareCatalogo.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Tipo de software *</label>
              <Select 
                value={watch("TipoSoftware")} 
                onValueChange={(value) => value !== null && setValue("TipoSoftware", value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue>{watch("TipoSoftware") || "Selecciona un tipo de software"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tiposSoftware.map((tipo: any) => (
                    <SelectItem key={tipo.IdTipoSoftware} value={String(tipo.TipoSoftware)}>
                      {tipo.TipoSoftware}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.TipoSoftware && (
                <p className="text-xs text-destructive">{errors.TipoSoftware.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Versión *</label>
              <Input
                {...register("VersionSoftware")}
                placeholder="Ej. 2024"
                readOnly={readOnly}
              />
              {errors.VersionSoftware && (
                <p className="text-xs text-destructive">{errors.VersionSoftware.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Proveedor / Entidad *</label>
              <Select
                value={watch("ProveedorEntidad")}
                onValueChange={(value) => value !== null && setValue("ProveedorEntidad", value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue>{watch("ProveedorEntidad") || "Selecciona un proveedor"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((p: any) => (
                    <SelectItem key={p.IdProveedor} value={String(p.Proveedor)}>
                      {p.Proveedor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.ProveedorEntidad && (
                <p className="text-xs text-destructive">{errors.ProveedorEntidad.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Tipo de licencia *</label>
              <Select 
                value={watch("TipoLicencia")} 
                onValueChange={(value) => value !== null && setValue("TipoLicencia", value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue>{watch("TipoLicencia") || "Selecciona un tipo de licencia"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tiposLicencia.map((tipo: any) => (
                    <SelectItem key={tipo.IdTipoLicencia} value={String(tipo.TipoLicencia)}>
                      {tipo.TipoLicencia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.TipoLicencia && (
                <p className="text-xs text-destructive">{errors.TipoLicencia.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Cantidad de licencias *</label>
              <Input
                type="number"
                {...register("CantidadLicencias")}
                placeholder="Ej. 10"
                readOnly={readOnly}
                min={0}
              />
              {errors.CantidadLicencias && (
                <p className="text-xs text-destructive">{errors.CantidadLicencias.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Estado de licencia *</label>
              <Select 
                value={watch("EstadoLicencia")} 
                onValueChange={(value) => value !== null && setValue("EstadoLicencia", value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue>{watch("EstadoLicencia") || "Selecciona un estado"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vigente">Vigente</SelectItem>
                  <SelectItem value="Vencida">Vencida</SelectItem>
                  <SelectItem value="Suspendida">Suspendida</SelectItem>
                </SelectContent>
              </Select>
              {errors.EstadoLicencia && (
                <p className="text-xs text-destructive">{errors.EstadoLicencia.message}</p>
              )}
            </div>
            
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Fecha de caducidad</label>
            <Input
              type="date"
              {...register("FechaCaducidad")}
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Equipos / asignación</label>
            <Select
              value={watch("EquiposUsuariosAsignados")}
              onValueChange={(value) => value !== null && setValue("EquiposUsuariosAsignados", value)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo de asignación" />
              </SelectTrigger>
              <SelectContent>
                {tiposAsignacion.map((t: any) => (
                  <SelectItem key={t.IdTipoAsignacion} value={String(t.TipoAsignacion)}>
                    {t.TipoAsignacion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Uso / finalidad</label>
            <Textarea
              {...register("UsoFinalidad")}
              placeholder="Ej. Gestión administrativa"
              rows={3}
              readOnly={readOnly}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando..." : software ? "Actualizar" : "Crear"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
