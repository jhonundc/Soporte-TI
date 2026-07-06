import { exportJsonSheet } from "./excel-base";
import type { FichaSoporteRecord } from "@/features/soporte/ficha/types";

function mapFichaToExportRow(ficha: FichaSoporteRecord) {
  return {
    "Nº Ficha": ficha.NumeroFicha || "",
    "Unidad Orgánica": ficha.UnidadOrganica || "UNIDAD DE ESTADISTICA E INFORMATICA",
    "Fecha Registro": ficha.FechaRegistro
      ? new Date(ficha.FechaRegistro).toLocaleString()
      : "",
    Responsable: ficha.Responsable || "",
    "Dependencia (Área)": ficha.Dependencia || "",
    Ambiente: ficha.Ambiente || "",
    "Tipo de Bien": ficha.TipoBien || "",
    "Código Inventario": ficha.Bien?.CodigoInventario || "",
    "Código Patrimonial": ficha.Bien?.CodigoPatrimonial || "",
    "Descripción del Bien": ficha.Bien?.Descripcion || "",
    Marca: ficha.Bien?.Marca?.Marca || "",
    Modelo: ficha.Bien?.Modelo?.Modelo || "",
    "Nº Serie": ficha.Bien?.NumeroSerie || "",
    Condición: ficha.Condicion?.Condicion || "",
    Estado: ficha.Estado?.EstadoBien || "",
    "Trabajos Realizados": ficha.TrabajosRealizados || "",
    Diagnóstico: ficha.Diagnostico || "",
    Recomendaciones: ficha.Recomendacion || "",
    "Firma Soporte": ficha.FirmaSoporte || "",
    "Firma Jefe": ficha.FirmaJefeUnidad || "",
    "Firma Usuario": ficha.FirmaAreaUsuario || "",
    "Registrado Por": ficha.UsuarioSoporte?.Nombres || "",
  };
}

export async function exportFichasSoporteListExcel(fichas: FichaSoporteRecord[]) {
  const date = new Date().toISOString().slice(0, 10);
  await exportJsonSheet({
    sheetName: "Fichas Soporte",
    rows: fichas.map(mapFichaToExportRow),
    filename: `Fichas_Soporte_${date}.xlsx`,
  });
}
