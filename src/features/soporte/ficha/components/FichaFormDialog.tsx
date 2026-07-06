"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormDialogContent } from "@/components/forms/FormDialogContent";
import {
  Dialog,
  DialogDescription,
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
import type {
  AreaRef,
  BienRef,
  PrioridadRef,
  TipoBienRef,
} from "@/features/soporte/ficha/types";
import type { useFichaForm } from "../hooks/useFichaForm";
import { FichaBienLookupDialog } from "./FichaBienLookupDialog";

type FormState = ReturnType<typeof useFichaForm>;

interface FichaFormDialogProps {
  form: FormState;
  areas?: AreaRef[];
  prioridades?: PrioridadRef[];
  tiposBien?: TipoBienRef[];
  bienes?: BienRef[];
}

export function FichaFormDialog({
  form,
  areas,
  prioridades,
  tiposBien,
  bienes,
}: FichaFormDialogProps) {
  const {
    open,
    setOpen,
    editingFicha,
    lookupOpen,
    setLookupOpen,
    lookupSearch,
    setLookupSearch,
    tipoBien,
    setTipoBien,
    condicionBien,
    setCondicionBien,
    estadoBienOptions,
    register,
    handleSubmit,
    setValue,
    watch,
    errors,
    selectedAreaName,
    lookupFilteredBienes,
    onSubmit,
    closeForm,
    selectBien,
    savePending,
  } = form;

  const selectedBienLabel = (() => {
    const selected = bienes?.find((b) => String(b.IdBien) === String(watch("IdBien")));
    if (!selected) return "";
    return `${selected.Descripcion}${selected.NumeroSerie ? ` (S/N: ${selected.NumeroSerie})` : ""}${selected.CodigoPatrimonial ? ` (Pat: ${selected.CodigoPatrimonial})` : ""}`;
  })();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <FormDialogContent size="xl" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFicha ? "Editar Ficha de Soporte" : "Nueva Ficha de Soporte"}
            </DialogTitle>
            <DialogDescription>
              Complete todos los campos para registrar la ficha de soporte técnico.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
              <h3 className="border-b pb-2 text-sm font-semibold text-foreground">
                1. Datos de la Ficha y Responsable
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block text-xs font-semibold text-muted-foreground">Nº de Ficha</Label>
                  <Input
                    {...register("NumeroFicha", { required: true })}
                    placeholder="Ej: ST-20260519-1234"
                  />
                  {errors.NumeroFicha ? (
                    <span className="text-xs text-destructive">Este campo es requerido</span>
                  ) : null}
                </div>
                <div>
                  <Label className="mb-2 block text-xs font-semibold text-muted-foreground">Unidad Orgánica</Label>
                  <Input
                    {...register("UnidadOrganica")}
                    readOnly
                    className="cursor-not-allowed bg-muted text-muted-foreground"
                  />
                </div>
                <div>
                  <Label className="mb-2 block text-xs font-semibold text-muted-foreground">Usuario Responsable</Label>
                  <Input
                    {...register("Responsable", { required: true })}
                    placeholder="Nombre del responsable del bien"
                  />
                  {errors.Responsable ? (
                    <span className="text-xs text-destructive">Este campo es requerido</span>
                  ) : null}
                </div>
                <div>
                  <Label className="mb-2 block text-xs font-semibold text-muted-foreground">Dependencia (Área)</Label>
                  <Select
                    value={watch("Dependencia") || undefined}
                    onValueChange={(value) => setValue("Dependencia", value ?? "")}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccione dependencia / área">
                        {watch("Dependencia")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {areas?.map((area) => (
                        <SelectItem key={area.IdArea} value={area.NombreArea}>
                          {area.NombreArea}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="mb-2 block text-xs font-semibold text-muted-foreground">Ambiente</Label>
                  <Input {...register("Ambiente")} placeholder="Ambiente / Ubicación física" />
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
              <h3 className="border-b pb-2 text-sm font-semibold text-foreground">
                2. Selección del Activo / Bien
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block text-xs font-semibold text-muted-foreground">Bien / Activo</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      placeholder="Haga clic en el botón (...) para buscar"
                      value={selectedBienLabel}
                      className="flex-1 cursor-not-allowed border-border bg-muted text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLookupOpen(true)}
                      className="border-border font-semibold text-foreground hover:bg-muted"
                      title="Buscar bien"
                    >
                      ...
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block text-xs font-semibold text-muted-foreground">Prioridad</Label>
                  <Select
                    value={watch("IdPrioridad") ? String(watch("IdPrioridad")) : undefined}
                    onValueChange={(value) => setValue("IdPrioridad", value ?? "")}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccione prioridad">
                        {
                          prioridades?.find(
                            (p) => String(p.IdPrioridad) === String(watch("IdPrioridad"))
                          )?.NombrePrioridad
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {prioridades?.map((p) => (
                        <SelectItem key={p.IdPrioridad} value={String(p.IdPrioridad)}>
                          {p.NombrePrioridad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border bg-white p-4 text-xs">
                <span className="mb-1 block font-bold text-muted-foreground">
                  Detalle Técnico del Activo Seleccionado:
                </span>
                {watch("IdBien") ? (
                  (() => {
                    const selected = bienes?.find(
                      (b) => String(b.IdBien) === String(watch("IdBien"))
                    );
                    return selected ? (
                      <div className="grid grid-cols-2 gap-2 text-foreground sm:grid-cols-3">
                        <div>
                          <span className="font-semibold text-muted-foreground">Bien:</span>{" "}
                          {selected.Descripcion || "-"}
                        </div>
                        <div>
                          <span className="font-semibold text-muted-foreground">Código Inventario:</span>{" "}
                          {selected.CodigoInventario || "-"}
                        </div>
                        <div>
                          <span className="font-semibold text-muted-foreground">Código Patrimonial:</span>{" "}
                          {selected.CodigoPatrimonial || "-"}
                        </div>
                        <div>
                          <span className="font-semibold text-muted-foreground">Marca:</span>{" "}
                          {selected.Marca?.Marca || "-"}
                        </div>
                        <div>
                          <span className="font-semibold text-muted-foreground">Modelo:</span>{" "}
                          {selected.Modelo?.Modelo || "-"}
                        </div>
                        <div>
                          <span className="font-semibold text-muted-foreground">Nº Serie:</span>{" "}
                          {selected.NumeroSerie || "-"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Activo no encontrado</span>
                    );
                  })()
                ) : (
                  <span className="text-muted-foreground">
                    Seleccione un bien de la lista para ver sus especificaciones técnicas.
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
              <h3 className="border-b pb-2 text-sm font-semibold text-foreground">
                3. Tipo, Condición y Estado del Bien
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <Label className="mb-2 block text-xs font-semibold text-muted-foreground">
                    Tipo de Bien (Elegir uno)
                  </Label>
                  <div className="space-y-2 rounded-lg border bg-white p-3">
                    {tiposBien?.map((tipo) => (
                      <div key={tipo.IdTipoBien} className="flex items-center gap-2">
                        <input
                          type="radio"
                          id={`tipoBien-${tipo.IdTipoBien}`}
                          name="tipoBien"
                          value={tipo.TipoBien}
                          checked={tipoBien === tipo.TipoBien}
                          onChange={(e) => {
                            setTipoBien(e.target.value);
                            setValue("TipoBien", e.target.value);
                          }}
                          className="text-primary focus:ring-ring"
                        />
                        <Label
                          htmlFor={`tipoBien-${tipo.IdTipoBien}`}
                          className="cursor-pointer text-xs text-foreground"
                        >
                          {tipo.TipoBien}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-xs font-semibold text-muted-foreground">
                    Condición (Elegir uno)
                  </Label>
                  <div className="space-y-2 rounded-lg border bg-white p-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="condicion-operativo"
                        name="condicionBien"
                        value="Operativo"
                        checked={condicionBien === "Operativo" || watch("IdCondicion") === "1"}
                        onChange={() => {
                          setCondicionBien("Operativo");
                          setValue("IdCondicion", "1");
                          setValue("IdEstadoBien", "");
                        }}
                        className="text-primary focus:ring-ring"
                      />
                      <Label htmlFor="condicion-operativo" className="cursor-pointer text-xs text-foreground">
                        Operativo
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="condicion-inoperativo"
                        name="condicionBien"
                        value="Inoperativo"
                        checked={condicionBien === "Inoperativo" || watch("IdCondicion") === "2"}
                        onChange={() => {
                          setCondicionBien("Inoperativo");
                          setValue("IdCondicion", "2");
                          setValue("IdEstadoBien", "");
                        }}
                        className="text-primary focus:ring-ring"
                      />
                      <Label
                        htmlFor="condicion-inoperativo"
                        className="cursor-pointer text-xs text-foreground"
                      >
                        Inoperativo
                      </Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-xs font-semibold text-muted-foreground">
                    Estado del Bien (Elegir uno)
                  </Label>
                  <div className="flex min-h-[82px] flex-col justify-center space-y-2 rounded-lg border bg-white p-3">
                    {estadoBienOptions.length > 0 ? (
                      estadoBienOptions.map((estado) => (
                        <div key={estado.IdEstadoBien} className="flex items-center gap-2">
                          <input
                            type="radio"
                            id={`estado-${estado.IdEstadoBien}`}
                            name="estadoBien"
                            value={String(estado.IdEstadoBien)}
                            checked={
                              String(watch("IdEstadoBien")) === String(estado.IdEstadoBien)
                            }
                            onChange={(e) => setValue("IdEstadoBien", e.target.value)}
                            className="text-primary focus:ring-ring"
                          />
                          <Label
                            htmlFor={`estado-${estado.IdEstadoBien}`}
                            className="cursor-pointer text-xs text-foreground"
                          >
                            {estado.EstadoBien}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <span className="block text-center text-xs text-muted-foreground">
                        Seleccione primero la condición.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
              <h3 className="border-b pb-2 text-sm font-semibold text-foreground">
                4. Trabajos Realizados y Diagnóstico
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block text-xs font-semibold text-muted-foreground">
                    Problema Solicitado / Reportado
                  </Label>
                  <Textarea
                    {...register("DescripcionProblema")}
                    placeholder="Escriba la descripción del problema original reportado por el usuario..."
                    className="h-20 bg-white"
                  />
                </div>
                <div>
                  <Label className="mb-2 block text-xs font-semibold text-muted-foreground">
                    Trabajos Realizados (Texto libre)
                  </Label>
                  <Textarea
                    {...register("TrabajosRealizados")}
                    placeholder="Detalle todas las actividades y correcciones técnicas realizadas..."
                    className="h-24 bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="mb-2 block text-xs font-semibold text-muted-foreground">
                      Diagnóstico (Texto libre)
                    </Label>
                    <Textarea
                      {...register("Diagnostico")}
                      placeholder="Conclusión del diagnóstico sobre el estado real del bien..."
                      className="h-24 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs font-semibold text-muted-foreground">
                      Recomendación (Texto libre)
                    </Label>
                    <Textarea
                      {...register("Recomendacion")}
                      placeholder="Recomendaciones técnicas de uso o derivaciones..."
                      className="h-24 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 border-t pt-4">
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savePending}
              >
                {savePending ? "Guardando..." : "Guardar Ficha"}
              </Button>
            </div>
          </form>
        </FormDialogContent>
      </Dialog>

      <FichaBienLookupDialog
        open={lookupOpen}
        onOpenChange={setLookupOpen}
        selectedAreaName={selectedAreaName}
        lookupSearch={lookupSearch}
        onLookupSearchChange={setLookupSearch}
        bienes={lookupFilteredBienes}
        onSelect={selectBien}
        onCancel={() => {
          setLookupOpen(false);
          setLookupSearch("");
        }}
      />
    </>
  );
}
