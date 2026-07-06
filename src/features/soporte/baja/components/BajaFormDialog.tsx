"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  CAUSAL_BAJA_OPTIONS,
  CONDICION_OPTIONS,
  DEPENDENCIA_OPTIONS,
  ESTADO_OPTIONS,
  RECOMENDACION_OPTIONS,
  TIPO_BIEN_OPTIONS,
} from "@/features/soporte/baja/types";
import type { useBajaForm } from "../hooks/useBajaForm";

type FormState = ReturnType<typeof useBajaForm>;

interface BajaFormDialogProps {
  form: FormState;
}

export function BajaFormDialog({ form }: BajaFormDialogProps) {
  const {
    open,
    setOpen,
    editingBaja,
    formData,
    bienSearch,
    setBienSearch,
    register,
    handleSubmit,
    setValue,
    watch,
    selectedBienDetails,
    filteredBienes,
    handleSelectField,
    onSubmit,
    closeForm,
    selectBien,
    savePending,
  } = form;

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) closeForm();
      }}
    >
      <FormDialogContent size="xl" className="max-h-[92vh] overflow-y-auto p-0">
        <div className="border-b border-border bg-muted/30 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">Hospital Rezola</p>
              <DialogHeader className="space-y-1 text-left">
                <DialogTitle>
                  {editingBaja ? "Editar Ficha de Baja" : "Nueva Ficha de Baja"}
                </DialogTitle>
                <DialogDescription>
                  Formulario institucional para registrar la baja de activos TI.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-[var(--shadow-soft)]">
              <span className="block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Estado
              </span>
              <span className="font-semibold text-foreground">
                {editingBaja ? "Edición" : "Nuevo registro"}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-6 py-6 sm:px-8">
          <input type="hidden" {...register("IdBien")} />
          <input type="hidden" {...register("Dependencia")} />
          <input type="hidden" {...register("Prioridad")} />
          <input type="hidden" {...register("TipoBien")} />
          <input type="hidden" {...register("IdCondicion")} />
          <input type="hidden" {...register("IdEstadoBien")} />
          <input type="hidden" {...register("CausalBaja")} />
          <input type="hidden" {...register("Recomendacion")} />
          <input type="hidden" {...register("Observacion")} />
          <input type="hidden" {...register("IdUsuarioRegistro")} />

          <section className="rounded-3xl border border-border bg-muted/30/80 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">1. Datos de la Ficha</h3>
                <p className="text-sm text-muted-foreground">
                  Número, unidad orgánica, responsable, dependencia y ambiente.
                </p>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                Institucional
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-1.5 text-sm text-foreground">
                <span className="font-medium">N° Ficha Baja</span>
                <Input
                  {...register("NumeroFichaBaja", { required: true })}
                  className="h-11 rounded-xl border-border bg-white shadow-sm"
                  readOnly
                />
              </label>
              <label className="space-y-1.5 text-sm text-foreground">
                <span className="font-medium">Unidad Orgánica</span>
                <Input
                  {...register("UnidadOrganica")}
                  value="UNIDAD DE ESTADISTICA E INFORMATICA"
                  readOnly
                  className="h-11 rounded-xl border-border bg-slate-100 text-muted-foreground shadow-sm"
                />
              </label>
              <label className="space-y-1.5 text-sm text-foreground">
                <span className="font-medium">Usuario Responsable</span>
                <Input
                  {...register("Responsable")}
                  placeholder="Nombre del responsable"
                  className="h-11 rounded-xl border-border bg-white shadow-sm"
                />
              </label>
              <label className="space-y-1.5 text-sm text-foreground">
                <span className="font-medium">Dependencia</span>
                <Select
                  value={watch("Dependencia") || ""}
                  onValueChange={(val) => setValue("Dependencia", val ?? "")}
                >
                  <SelectTrigger className="h-11 rounded-xl border-border bg-white shadow-sm">
                    <SelectValue placeholder="Seleccione dependencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPENDENCIA_OPTIONS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-1.5 text-sm text-foreground md:col-span-2 xl:col-span-1">
                <span className="font-medium">Ambiente</span>
                <Input
                  {...register("Ambiente")}
                  placeholder="Ej. Sala 01 / Oficina A"
                  className="h-11 rounded-xl border-border bg-white shadow-sm"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">2. Selección del Activo</h3>
              <p className="text-sm text-muted-foreground">
                Busque el bien y revise sus datos técnicos destacados.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm text-foreground md:col-span-2">
                <span className="font-medium">Bien / Activo</span>
                <Input
                  value={bienSearch}
                  onChange={(e) => setBienSearch(e.target.value)}
                  placeholder="Busque por descripción, inventario, serie o código patrimonial"
                  className="h-11 rounded-xl border-border bg-white shadow-sm"
                />
                <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-border bg-white shadow-sm">
                  {filteredBienes.length > 0 ? (
                    filteredBienes.slice(0, 8).map((bien) => (
                      <button
                        key={bien.IdBien}
                        type="button"
                        onClick={() => selectBien(bien)}
                        className={`w-full border-b border-slate-100 px-3 py-3 text-left transition hover:bg-muted/30 ${String(watch("IdBien")) === String(bien.IdBien) ? "bg-blue-50" : ""}`}
                      >
                        <div className="text-sm font-semibold text-slate-800">
                          {bien.Descripcion || "Sin descripción"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {bien.CodigoInventario || "-"} • {bien.CodigoPatrimonial || "-"} •{" "}
                          {bien.NumeroSerie || "-"}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-sm text-muted-foreground">
                      No hay bienes que coincidan con la búsqueda.
                    </div>
                  )}
                </div>
              </label>
              <label className="space-y-1.5 text-sm text-foreground">
                <span className="font-medium">Prioridad</span>
                <Select
                  value={watch("Prioridad") || ""}
                  onValueChange={(val) => setValue("Prioridad", val ?? "")}
                >
                  <SelectTrigger className="h-11 rounded-xl border-border bg-muted/30 shadow-sm">
                    <SelectValue placeholder="Seleccione prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-4 text-xs text-foreground shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-slate-600">Detalle del activo seleccionado</span>
                <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-blue-700">
                  Resumen
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <span className="font-semibold text-muted-foreground">Bien:</span>{" "}
                  {selectedBienDetails?.Descripcion || "-"}
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Inventario:</span>{" "}
                  {selectedBienDetails?.CodigoInventario || "-"}
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Código Patrimonial:</span>{" "}
                  {selectedBienDetails?.CodigoPatrimonial || "-"}
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Marca:</span>{" "}
                  {selectedBienDetails?.Marca?.Marca || "-"}
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Modelo:</span>{" "}
                  {selectedBienDetails?.Modelo?.Modelo || "-"}
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Serie:</span>{" "}
                  {selectedBienDetails?.NumeroSerie || "-"}
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Dimensión:</span>{" "}
                  {selectedBienDetails?.Dimension || "-"}
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Color:</span>{" "}
                  {selectedBienDetails?.Color || "-"}
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Fecha Adquisición:</span>{" "}
                  {selectedBienDetails?.FechaAdquisicion || "-"}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-muted/30/80 p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">3. Tipo, Condición y Estado</h3>
              <p className="text-sm text-muted-foreground">
                Selección visual por radio buttons para tipología y evaluación del bien.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-foreground">Tipo de Bien</p>
                <div className="space-y-2">
                  {TIPO_BIEN_OPTIONS.map((item) => (
                    <label key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="radio"
                        name="tipoBien"
                        value={item}
                        checked={watch("TipoBien") === item}
                        onChange={(e) => setValue("TipoBien", e.target.value)}
                        className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-foreground">Condición del Bien</p>
                <div className="space-y-2">
                  {CONDICION_OPTIONS.map((item) => (
                    <label key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="radio"
                        name="condicionBien"
                        value={item}
                        checked={
                          String(watch("IdCondicion") ?? formData.IdCondicion) ===
                          String(CONDICION_OPTIONS.indexOf(item) + 1)
                        }
                        onChange={() => {
                          handleSelectField(
                            "IdCondicion",
                            String(CONDICION_OPTIONS.indexOf(item) + 1)
                          );
                        }}
                        className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-foreground">Estado del Bien</p>
                <div className="space-y-2">
                  {ESTADO_OPTIONS.map((item, idx) => (
                    <label key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="radio"
                        name="estadoBien"
                        value={String(idx + 1)}
                        checked={
                          String(watch("IdEstadoBien") ?? formData.IdEstadoBien) === String(idx + 1)
                        }
                        onChange={(e) => handleSelectField("IdEstadoBien", e.target.value)}
                        className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">4. Evaluación y Causal</h3>
              <p className="text-sm text-muted-foreground">
                Causal, fundamentación y recomendación de baja institucional.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm text-foreground md:col-span-2">
                <span className="font-medium">Causal de Baja</span>
                <Select
                  value={formData.CausalBaja || watch("CausalBaja") || ""}
                  onValueChange={(val) => handleSelectField("CausalBaja", val ?? "")}
                >
                  <SelectTrigger className="h-11 rounded-xl border-border bg-muted/30 shadow-sm">
                    <SelectValue placeholder="Seleccione causal" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAUSAL_BAJA_OPTIONS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-1.5 text-sm text-foreground md:col-span-2">
                <span className="font-medium">Fundamentación</span>
                <Textarea
                  {...register("Fundamentacion")}
                  placeholder="Explique el motivo técnico y administrativo de la baja"
                  className="min-h-[110px] rounded-2xl border-border bg-muted/30 shadow-sm"
                />
              </label>
              <label className="space-y-1.5 text-sm text-foreground md:col-span-2">
                <span className="font-medium">Recomendación</span>
                <Select
                  value={formData.Recomendacion || watch("Recomendacion") || ""}
                  onValueChange={(val) => handleSelectField("Recomendacion", val ?? "")}
                >
                  <SelectTrigger className="h-11 rounded-xl border-border bg-muted/30 shadow-sm">
                    <SelectValue placeholder="Seleccione recomendación" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECOMENDACION_OPTIONS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
          </section>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeForm}
              className="h-11 rounded-xl border-border text-foreground hover:bg-muted/30"
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" size="lg" disabled={savePending}>
              {savePending ? "Guardando..." : "Guardar Ficha de Baja"}
            </Button>
          </div>
        </form>
      </FormDialogContent>
    </Dialog>
  );
}
