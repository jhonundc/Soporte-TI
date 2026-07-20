"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { notify } from "@/lib/feedback/toast";
import {
  CONDICION_OPTIONS,
  ESTADO_OPTIONS,
  type BajaFormSelection,
  type BajaFormValues,
  type BajaRecord,
  type BienRef,
} from "@/features/soporte/baja/types";
import type { useBajaMutations } from "./useBajaMutations";

type CatalogData = {
  bienes?: BienRef[];
  condiciones?: { IdCondicion: number; Condicion: string | null }[];
  estados?: { IdEstadoBien: number; EstadoBien: string | null }[];
  sessionData?: {
    user?: { id?: number | null };
  };
};

const defaultFormValues: BajaFormValues = {
  NumeroFichaBaja: "",
  UnidadOrganica: "UNIDAD DE ESTADISTICA E INFORMATICA",
  Dependencia: "",
  IdBien: "",
  Prioridad: "",
  TipoBien: "",
  IdCondicion: "",
  IdEstadoBien: "",
  CausalBaja: "",
  Recomendacion: "",
  Observacion: "",
  Fundamentacion: "",
  IdUsuarioRegistro: "",
  Responsable: "",
  Ambiente: "",
};

export function useBajaForm(
  catalogs: CatalogData,
  saveMutation: ReturnType<typeof useBajaMutations>["saveMutation"],
  deleteEvidenceMutation: ReturnType<typeof useBajaMutations>["deleteEvidenceMutation"]
) {
  const { bienes, condiciones, estados, sessionData } = catalogs;

  const [open, setOpen] = useState(false);
  const [editingBaja, setEditingBaja] = useState<BajaRecord | null>(null);
  const [formData, setFormData] = useState<BajaFormSelection>({
    IdCondicion: "",
    IdEstadoBien: "",
    Recomendacion: "",
    CausalBaja: "",
  });
  const [bienSearch, setBienSearch] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm<BajaFormValues>({
    defaultValues: defaultFormValues,
  });

  const selectedBien = watch("IdBien");
  const selectedCondicion = watch("IdCondicion");
  const selectedEstado = watch("IdEstadoBien");

  useEffect(() => {
    if (sessionData?.user?.id) {
      setValue("IdUsuarioRegistro", String(sessionData.user.id));
    }
  }, [sessionData, setValue]);

  const selectedBienDetails = useMemo(
    () => bienes?.find((b) => String(b.IdBien) === String(selectedBien)) || null,
    [bienes, selectedBien]
  );

  const filteredBienes = useMemo(() => {
    const term = bienSearch.toLowerCase().trim();
    if (!bienes) return [];
    return bienes.filter((bien) => {
      if (!term) return true;
      const haystack = [
        bien.Descripcion,
        bien.CodigoInventario,
        bien.CodigoPatrimonial,
        bien.NumeroSerie,
        bien.Marca?.Marca,
        bien.Modelo?.Modelo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [bienes, bienSearch]);

  const condicionCatalog = useMemo(
    () =>
      (condiciones || []).filter((c) =>
        CONDICION_OPTIONS.includes(c.Condicion as (typeof CONDICION_OPTIONS)[number])
      ),
    [condiciones]
  );

  const estadoCatalog = useMemo(
    () =>
      (estados || []).filter((e) =>
        ESTADO_OPTIONS.includes(e.EstadoBien as (typeof ESTADO_OPTIONS)[number])
      ),
    [estados]
  );

  const handleSelectField = (
    field: keyof BajaFormSelection,
    value: string
  ) => {
    setValue(field, value);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const closeForm = () => {
    reset(defaultFormValues);
    setFormData({ IdCondicion: "", IdEstadoBien: "", Recomendacion: "", CausalBaja: "" });
    setBienSearch("");
    setEvidence(null);
    setEditingBaja(null);
    setOpen(false);
  };

  const onSubmit = async (data: BajaFormValues) => {
    if (!data.NumeroFichaBaja) {
      notify.warning("La ficha debe tener un número.");
      return;
    }
    if (!data.IdBien) {
      notify.warning("Seleccione un bien antes de guardar la ficha.");
      return;
    }
    if (!data.TipoBien) {
      notify.warning("Seleccione el tipo de bien.");
      return;
    }
    if (!data.IdCondicion) {
      notify.warning("Seleccione la condición del bien.");
      return;
    }
    if (!data.IdEstadoBien) {
      notify.warning("Seleccione el estado del bien.");
      return;
    }
    if (!data.CausalBaja) {
      notify.warning("Seleccione la causal de baja.");
      return;
    }
    if (!data.Recomendacion) {
      notify.warning("Seleccione la recomendación.");
      return;
    }
    if (!data.Fundamentacion) {
      notify.warning("Complete la fundamentación.");
      return;
    }
    if (evidence && !["image/jpeg", "image/png", "image/webp"].includes(evidence.type)) {
      notify.warning("La evidencia debe ser una imagen JPG, PNG o WEBP.");
      return;
    }
    if (evidence && evidence.size > 5 * 1024 * 1024) {
      notify.warning("La imagen de evidencia no puede superar los 5 MB.");
      return;
    }

    const userId = sessionData?.user?.id || data.IdUsuarioRegistro || null;
    const payload: Record<string, unknown> = {
      ...data,
      IdUsuarioRegistro: userId ? String(userId) : null,
    };

    try {
      await saveMutation.mutateAsync({
        data: payload,
        editingId: editingBaja?.IdBaja,
        evidence: editingBaja ? evidence : null,
      });
      closeForm();
    } catch (error: unknown) {
      notify.fromError(error, "No se pudo guardar la ficha de baja. Revise los datos e intente de nuevo.");
    }
  };

  const handleEdit = (baja: BajaRecord) => {
    setEvidence(null);
    setEditingBaja(baja);
    setValue("NumeroFichaBaja", baja.NumeroFichaBaja || "");
    setValue("UnidadOrganica", baja.UnidadOrganica || "");
    setValue("IdBien", baja.IdBien?.toString() || "");
    setValue("Responsable", baja.Responsable || "");
    setValue("Dependencia", baja.Dependencia || "");
    setValue("Ambiente", baja.Ambiente || "");
    setValue("TipoBien", baja.TipoBien || "");
    setValue("Prioridad", baja.Prioridad || "");
    setValue("IdCondicion", baja.IdCondicion?.toString() || "");
    setValue("IdEstadoBien", baja.IdEstadoBien?.toString() || "");
    setValue("Fundamentacion", baja.Fundamentacion || "");
    setValue("Recomendacion", baja.Recomendacion || "");
    setValue("CausalBaja", baja.CausalBaja || "");
    setValue("Observacion", baja.Observacion || "");
    setValue(
      "IdUsuarioRegistro",
      baja.IdUsuarioRegistro?.toString() || sessionData?.user?.id?.toString() || ""
    );
    setFormData({
      IdCondicion: baja.IdCondicion?.toString() || "",
      IdEstadoBien: baja.IdEstadoBien?.toString() || "",
      Recomendacion: baja.Recomendacion || "",
      CausalBaja: baja.CausalBaja || "",
    });
    setBienSearch(baja.Bien?.Descripcion || "");
    setOpen(true);
  };

  const handleNuevo = () => {
    const newFolio = `FB-${Math.floor(1000 + Math.random() * 9000)}`;
    const userId = sessionData?.user?.id ? String(sessionData.user.id) : "";

    setEditingBaja(null);
    setEvidence(null);
    setFormData({ IdCondicion: "", IdEstadoBien: "", Recomendacion: "", CausalBaja: "" });
    reset({
      ...defaultFormValues,
      NumeroFichaBaja: newFolio,
      IdUsuarioRegistro: userId,
    });
    setBienSearch("");
    setOpen(true);
  };

  const handleDeleteEvidence = async () => {
    if (!editingBaja?.EvidenciaFirma) return;
    if (!window.confirm("¿Desea eliminar la imagen de evidencia de esta ficha?")) return;

    try {
      await deleteEvidenceMutation.mutateAsync(editingBaja.IdBaja);
      setEditingBaja((current) => current ? { ...current, EvidenciaFirma: undefined } : current);
      setEvidence(null);
      notify.success("La imagen de evidencia fue eliminada.");
    } catch (error: unknown) {
      notify.fromError(error, "No se pudo eliminar la imagen de evidencia.");
    }
  };

  const selectBien = (bien: BienRef) => {
    setValue("IdBien", String(bien.IdBien));
    setBienSearch(bien.Descripcion || "");
  };

  return {
    open,
    setOpen,
    editingBaja,
    formData,
    bienSearch,
    setBienSearch,
    evidence,
    setEvidence,
    register,
    handleSubmit,
    setValue,
    watch,
    selectedBienDetails,
    filteredBienes,
    condicionCatalog,
    estadoCatalog,
    handleSelectField,
    onSubmit,
    handleEdit,
    handleNuevo,
    handleDeleteEvidence,
    closeForm,
    selectBien,
    savePending: saveMutation.isPending,
    deleteEvidencePending: deleteEvidenceMutation.isPending,
    selectedCondicion,
    selectedEstado,
  };
}
