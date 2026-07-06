"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { notify } from "@/lib/feedback/toast";
import type {
  BienRef,
  EstadoRef,
  FichaFormValues,
  FichaSoporteRecord,
} from "@/features/soporte/ficha/types";
import type { useFichaMutations } from "./useFichaMutations";

type CatalogData = {
  bienes?: BienRef[];
  estados?: EstadoRef[];
  sessionData?: {
    user?: {
      id?: number | null;
      name?: string;
      username?: string;
    };
  };
};

export function useFichaForm(
  catalogs: CatalogData,
  saveMutation: ReturnType<typeof useFichaMutations>["saveMutation"]
) {
  const { bienes, estados, sessionData } = catalogs;

  const [open, setOpen] = useState(false);
  const [editingFicha, setEditingFicha] = useState<FichaSoporteRecord | null>(null);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupSearch, setLookupSearch] = useState("");
  const [tipoBien, setTipoBien] = useState("");
  const [condicionBien, setCondicionBien] = useState("");
  const [estadoBienOptions, setEstadoBienOptions] = useState<EstadoRef[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FichaFormValues>();

  const selectedAreaName = watch("Dependencia");

  const filteredBienes = useMemo(() => {
    if (!bienes) return [];
    if (!selectedAreaName) return bienes;
    return bienes.filter((bien) => bien.Area?.NombreArea === selectedAreaName);
  }, [bienes, selectedAreaName]);

  const lookupFilteredBienes = useMemo(() => {
    let list = filteredBienes;
    if (lookupSearch.trim()) {
      const term = lookupSearch.toLowerCase();
      list = list.filter((bien) => {
        return (
          (bien.Descripcion?.toLowerCase() || "").includes(term) ||
          (bien.NumeroSerie?.toLowerCase() || "").includes(term) ||
          (bien.CodigoPatrimonial?.toLowerCase() || "").includes(term) ||
          (bien.CodigoInventario?.toLowerCase() || "").includes(term) ||
          (bien.Marca?.Marca?.toLowerCase() || "").includes(term) ||
          (bien.Modelo?.Modelo?.toLowerCase() || "").includes(term)
        );
      });
    }
    return list;
  }, [filteredBienes, lookupSearch]);

  useEffect(() => {
    if (!bienes || !selectedAreaName) return;
    const currentBienId = watch("IdBien");
    if (!currentBienId) return;

    const currentBien = bienes.find((b) => String(b.IdBien) === String(currentBienId));
    if (currentBien && currentBien.Area?.NombreArea !== selectedAreaName) {
      setValue("IdBien", "");
    }
  }, [selectedAreaName, bienes, setValue, watch]);

  const selectedBienId = watch("IdBien");
  useEffect(() => {
    if (!selectedBienId || !bienes || editingFicha) return;

    const selectedBien = bienes.find((b) => String(b.IdBien) === String(selectedBienId));
    if (selectedBien?.Area?.NombreArea) {
      setValue("Dependencia", selectedBien.Area.NombreArea);
    }
  }, [selectedBienId, bienes, editingFicha, setValue]);

  useEffect(() => {
    if (!estados) return;

    let filteredEstados: EstadoRef[] = [];
    const condUpper = (condicionBien || "").toUpperCase();

    if (condUpper === "OPERATIVO") {
      filteredEstados = estados.filter(
        (e) =>
          e.EstadoBien?.toUpperCase() === "BUENO" ||
          e.EstadoBien?.toUpperCase() === "REGULAR"
      );
    } else if (condUpper === "INOPERATIVO") {
      filteredEstados = estados.filter(
        (e) =>
          e.EstadoBien?.toUpperCase() === "REPARAR" ||
          e.EstadoBien?.toUpperCase() === "BAJA"
      );
    } else {
      filteredEstados = estados;
    }

    setEstadoBienOptions(filteredEstados);
  }, [condicionBien, estados]);

  const closeForm = () => {
    reset();
    setEditingFicha(null);
    setTipoBien("");
    setCondicionBien("");
    setOpen(false);
  };

  const onSubmit = async (data: FichaFormValues) => {
    const payload: Record<string, unknown> = { ...data };

    if (!payload.UnidadOrganica) {
      payload.UnidadOrganica = "UNIDAD DE ESTADISTICA E INFORMATICA";
    }
    if (!editingFicha && sessionData?.user?.id) {
      payload.IdUsuarioSoporte = String(sessionData.user.id);
    }
    if (!editingFicha && sessionData?.user?.name) {
      const parts = sessionData.user.name.split(" ");
      const initials = parts
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 10);
      payload.Siglas = initials;
    } else if (!editingFicha && sessionData?.user?.username) {
      payload.Siglas = sessionData.user.username.toUpperCase().slice(0, 10);
    }

    payload.FirmaSoporte = "";
    payload.FirmaJefeUnidad = "";
    payload.FirmaAreaUsuario = "";

    try {
      await saveMutation.mutateAsync({
        data: payload,
        editingId: editingFicha?.IdSoporte,
      });
      closeForm();
    } catch (e: unknown) {
      notify.fromError(e, "Error al guardar la ficha");
    }
  };

  const handleEdit = (ficha: FichaSoporteRecord) => {
    setEditingFicha(ficha);

    Object.keys(ficha).forEach((key) => {
      setValue(key, String(ficha[key] ?? ""));
    });

    if (ficha.IdBien) setValue("IdBien", String(ficha.IdBien));
    if (ficha.IdPrioridad) setValue("IdPrioridad", String(ficha.IdPrioridad));
    if (ficha.IdCondicion) setValue("IdCondicion", String(ficha.IdCondicion));
    if (ficha.IdEstadoBien) setValue("IdEstadoBien", String(ficha.IdEstadoBien));

    if (ficha.TipoBien) setTipoBien(ficha.TipoBien);

    if (ficha.Condicion?.Condicion) {
      setCondicionBien(ficha.Condicion.Condicion);
    } else if (ficha.Bien?.Condicion?.Condicion) {
      setCondicionBien(ficha.Bien.Condicion.Condicion);
    }

    setOpen(true);
  };

  const handleNuevo = () => {
    reset();
    setEditingFicha(null);
    setTipoBien("");
    setCondicionBien("");

    const now = new Date();
    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(1000 + Math.random() * 9000);
    const generatedNumero = `ST-${yyyymmdd}-${random}`;

    setValue("NumeroFicha", generatedNumero);
    setValue("UnidadOrganica", "UNIDAD DE ESTADISTICA E INFORMATICA");
    if (sessionData?.user?.id) {
      setValue("IdUsuarioSoporte", String(sessionData.user.id));
    }

    setOpen(true);
  };

  const selectBien = (bien: BienRef) => {
    setValue("IdBien", String(bien.IdBien));
    setLookupOpen(false);
    setLookupSearch("");
  };

  return {
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
    handleEdit,
    handleNuevo,
    closeForm,
    selectBien,
    savePending: saveMutation.isPending,
  };
}
