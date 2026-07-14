import { openPrintWindow } from "./open-print-window";
import { formatDate } from "@/lib/export/excel-base";

export { formatDate } from "@/lib/export/excel-base";

export type BajaPrintData = {
  NumeroFichaBaja?: string;
  FechaRegistro?: string;
  UnidadOrganica?: string;
  Responsable?: string;
  Dependencia?: string;
  Ambiente?: string;
  TipoBien?: string;
  IdCondicion?: number | string;
  IdEstadoBien?: number | string;
  Fundamentacion?: string;
  Recomendacion?: string;
  CausalBaja?: string;
  Condicion?: { Condicion?: string };
  Estado?: { EstadoBien?: string };
  Bien?: {
    CodigoInventario?: string;
    CodigoPatrimonial?: string;
    Descripcion?: string;
    NumeroSerie?: string;
    Dimension?: string;
    Color?: string;
    FechaAdquisicion?: string;
    FechaCompra?: string;
    Marca?: { Marca?: string };
    Modelo?: { Modelo?: string } | string;
  } | null;
};

export type BienEnriched = {
  CodigoInventario?: string;
  CodigoPatrimonial?: string;
  Descripcion?: string;
  NumeroSerie?: string;
  Dimension?: string;
  Color?: string;
  FechaAdquisicion?: string;
  FechaCompra?: string;
  Marca?: { Marca?: string };
  Modelo?: { Modelo?: string } | string;
};

export const CAUSALES = [
  "Estado de excedencia",
  "Obsolescencia técnica",
  "Mantenimiento o reparación onerosa",
  "Siniestro o destrucción",
  "Reposición",
  "Estado de chatarra",
  "Residuos de aparatos eléctricos y electrónicos - RAEE",
  "Otros (especificar)",
];

export const TIPOS_BIEN = [
  { key: "informatico", label: "a) Informático" },
  { key: "comunicacion", label: "b) Comunicación" },
  { key: "biomedico", label: "c) Biomédico" },
  { key: "electrico", label: "d) Eléctricos, electrónicos y electromecánico" },
  { key: "mobiliario", label: "e) Mobiliario" },
  { key: "mobiliario_clinico", label: "f) Mobiliario Clínico" },
];

export function normalize(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesTipo(tipoBien: string, key: string) {
  const t = normalize(tipoBien);
  switch (key) {
    case "informatico":
      return t.includes("informatic");
    case "comunicacion":
      return t.includes("comunicacion");
    case "biomedico":
      return t.includes("biomedic");
    case "electrico":
      return t.includes("electric") || t.includes("electromec");
    case "mobiliario":
      return t.includes("mobiliario") && !t.includes("clinic");
    case "mobiliario_clinico":
      return t.includes("mobiliario") && t.includes("clinic");
    default:
      return false;
  }
}

export function matchesCausal(causal: string, option: string) {
  const c = normalize(causal);
  const o = normalize(option);
  if (o.startsWith("otros")) return c === "otros" || c.startsWith("otros");
  return c.includes(o) || o.includes(c);
}

function checkbox(checked: boolean) {
  return `<span class="caja">${checked ? "X" : "&nbsp;"}</span>`;
}


export function getModelo(bien?: BienEnriched | null) {
  if (!bien?.Modelo) return "";
  return typeof bien.Modelo === "string" ? bien.Modelo : bien.Modelo.Modelo || "";
}

export function buildBajaPrintHtml(baja: BajaPrintData, bienExtra?: BienEnriched | null) {
  const bien = { ...(baja.Bien || {}), ...(bienExtra || {}) };
  const tipoBien = baja.TipoBien || "";
  const condicion = normalize(baja.Condicion?.Condicion);
  const estado = normalize(baja.Estado?.EstadoBien);
  const recomendacion = normalize(baja.Recomendacion);
  const causal = baja.CausalBaja || "";
  const fecha = formatDate(baja.FechaRegistro);
  const fechaAdquisicion = formatDate(bien.FechaAdquisicion || bien.FechaCompra);

  const tipoRow1 = TIPOS_BIEN.slice(0, 3)
    .map(
      (item) => `
      <td class="sin-borde tipo-item">
        ${item.label}
        ${checkbox(matchesTipo(tipoBien, item.key))}
      </td>`
    )
    .join("");

  const tipoRow2 = TIPOS_BIEN.slice(3, 6)
    .map(
      (item) => `
      <td class="sin-borde tipo-item">
        ${item.label}
        ${checkbox(matchesTipo(tipoBien, item.key))}
      </td>`
    )
    .join("");

  const causalRows = CAUSALES.map(
    (item) => `
      <tr>
        <td class="causal-label">${item}</td>
        <td class="causal-check">${checkbox(matchesCausal(causal, item))}</td>
      </tr>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Ficha Técnica para Baja ${baja.NumeroFichaBaja || ""}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    html, body { width: 100%; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .container { width: 100%; max-width: 780px; margin: 0 auto; padding: 0 4px; }
    .page-header {
      display: grid;
      grid-template-columns: 78px 1fr 132px;
      gap: 10px;
      align-items: start;
      margin-bottom: 8px;
    }
    .logo-left, .logo-right { width: 78px; height: 78px; }
    .logo-left img, .logo-right img { width: 100%; height: 100%; object-fit: contain; }
    .header-center { text-align: center; padding-top: 8px; }
    .titulo {
      font-size: 13px;
      font-weight: 800;
      line-height: 1.15;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .right-column { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
    .date-box {
      border: 2px solid #000;
      width: 132px;
      text-align: center;
      padding: 6px 8px;
      line-height: 1.2;
    }
    .date-box .label { font-size: 9px; font-weight: 700; margin-bottom: 4px; }
    .date-box .value { font-size: 12px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; }
    td, th { border: 1px solid #000; padding: 5px 6px; vertical-align: middle; }
    .info-table .label-cell { width: 18%; font-weight: 700; background: #fff; }
    .info-table .value-cell { font-weight: 700; text-transform: uppercase; }
    .seccion {
      margin-top: 8px;
      margin-bottom: 3px;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
    }
    .sin-borde { border: none !important; }
    .tipo-item { width: 33.33%; font-size: 9.5px; padding: 4px 6px; }
    .caja {
      width: 14px;
      height: 14px;
      border: 2px solid #000;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      margin-left: 6px;
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
    }
    .detalle th { font-size: 9px; text-align: center; font-weight: 700; background: #fff; }
    .detalle td { height: 42px; text-align: center; font-size: 10px; }
    .recuadro {
      border: 2px solid #000;
      min-height: 58px;
      padding: 8px 10px;
      line-height: 1.35;
      white-space: pre-wrap;
      font-size: 10px;
    }
    .recomendacion td { border: none !important; padding: 3px 6px; font-size: 10px; }
    .causal-table td { border: none !important; padding: 2px 0; font-size: 10px; }
    .causal-label { width: 92%; }
    .causal-check { width: 8%; text-align: right; }
    .firmas-top { margin-top: 34px; text-align: center; }
    .firmas-top .linea { width: 220px; margin: 0 auto; border-top: 1px solid #000; padding-top: 5px; font-weight: 700; font-size: 9px; }
    .firmas {
      margin-top: 42px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      text-align: center;
    }
    .firma .linea {
      border-top: 1px solid #000;
      min-height: 48px;
      padding-top: 5px;
      font-weight: 700;
      font-size: 8.5px;
      line-height: 1.2;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="page-header">
      <div class="logo-left"><img src="/logo1.png" alt="Gobierno Regional de Lima" /></div>
      <div class="header-center">
        <div class="titulo">FORMATO DE FICHA TECNICA INDIVIDUALIZADA DEL BIEN - PARA BAJA</div>
      </div>
      <div class="right-column">
        <div class="logo-right"><img src="/logo2.png" alt="Hospital Rezola" /></div>
        <div class="date-box">
          <div class="label">FECHA</div>
          <div class="value">${fecha}</div>
        </div>
      </div>
    </div>

    <table class="info-table">
      <tr>
        <td class="label-cell">Unidad Organica :</td>
        <td class="value-cell">${baja.UnidadOrganica || "UNIDAD DE ESTADISTICA E INFORMATICA"}</td>
      </tr>
    </table>

    <div class="seccion">USUARIO RESPONSABLE DEL BIEN:</div>
    <table>
      <tr>
        <td style="width:18%; font-weight:700;">Responsable:</td>
        <td>${baja.Responsable || ""}</td>
      </tr>
      <tr>
        <td style="font-weight:700;">Dependencia:</td>
        <td>${baja.Dependencia || ""}</td>
      </tr>
      <tr>
        <td style="font-weight:700;">Ambiente:</td>
        <td>${baja.Ambiente || ""}</td>
      </tr>
    </table>

    <div class="seccion">I. TIPO DEL BIEN</div>
    <table>
      <tr>${tipoRow1}</tr>
      <tr>${tipoRow2}</tr>
    </table>

    <div class="seccion">II. DETALLE TECNICO</div>
    <table class="detalle">
      <tr>
        <th rowspan="2" style="width:12%;">INVENTARIO<br/>2024</th>
        <th rowspan="2" style="width:18%;">DESCRIPCION</th>
        <th colspan="5">DETALLE TECNICO</th>
        <th rowspan="2" style="width:12%;">FECHA DE<br/>ADQUISICION</th>
      </tr>
      <tr>
        <th>MARCA</th>
        <th>MODELO</th>
        <th>SERIE</th>
        <th>DIMENSION</th>
        <th>COLOR</th>
      </tr>
      <tr>
        <td>${bien.CodigoInventario || ""}</td>
        <td>${bien.Descripcion || ""}</td>
        <td>${bien.Marca?.Marca || ""}</td>
        <td>${getModelo(bien)}</td>
        <td>${bien.NumeroSerie || ""}</td>
        <td>${bien.Dimension || ""}</td>
        <td>${bien.Color || ""}</td>
        <td>${fechaAdquisicion}</td>
      </tr>
    </table>

    <div class="seccion">III. CONDICION DEL BIEN</div>
    <table>
      <tr>
        <td class="sin-borde">Operativo ${checkbox(condicion.includes("operativo") && !condicion.includes("inoperativo"))}</td>
        <td class="sin-borde">Inoperativo ${checkbox(condicion.includes("inoperativo"))}</td>
      </tr>
    </table>

    <div class="seccion">IV. ESTADO DEL BIEN</div>
    <table>
      <tr>
        <td class="sin-borde">Bueno ${checkbox(estado.includes("bueno") && !estado.includes("malo"))}</td>
        <td class="sin-borde">Regular ${checkbox(estado.includes("regular"))}</td>
        <td class="sin-borde">Reparar ${checkbox(estado.includes("reparar") || estado.includes("malo por reparar"))}</td>
        <td class="sin-borde">Baja ${checkbox(estado === "baja" || estado.includes("malo para baja"))}</td>
      </tr>
    </table>

    <div class="seccion">V. FUNDAMENTACION</div>
    <div class="recuadro">${baja.Fundamentacion || ""}</div>

    <div class="seccion">VI. RECOMENDACIÓN</div>
    <table class="recomendacion">
      <tr>
        <td>a) Dar de baja ${checkbox(recomendacion.includes("dar de baja"))}</td>
        <td>b) Recuperar ${checkbox(recomendacion.includes("recuperar"))}</td>
        <td>b) Reasignar ${checkbox(recomendacion.includes("reasignar"))}</td>
      </tr>
    </table>

    <div class="seccion">VII. CAUSAL DE BAJA</div>
    <table class="causal-table">${causalRows}</table>

    <div class="firmas-top">
      <div class="linea">VALIDADOR</div>
    </div>

    <div class="firmas">
      <div class="firma"><div class="linea">ESPECIALISTA</div></div>
      <div class="firma"><div class="linea">JEFE DE DEPENDENCIA DE AREA USUARIA</div></div>
      <div class="firma"><div class="linea">JEFE DEL AREA DE CONTROL PATRIMONIAL</div></div>
    </div>
  </div>
</body>
</html>`;
}

export function openBajaPrintWindow(baja: BajaPrintData, bienExtra?: BienEnriched | null) {
  openPrintWindow(buildBajaPrintHtml(baja, bienExtra), "FichaBajaHospital");
}
