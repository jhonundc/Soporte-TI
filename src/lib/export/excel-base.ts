import type { Workbook, Worksheet } from "exceljs";

export const thinBorder = {
  top: { style: "thin" as const },
  left: { style: "thin" as const },
  bottom: { style: "thin" as const },
  right: { style: "thin" as const },
};

export const thickBorder = {
  top: { style: "medium" as const },
  left: { style: "medium" as const },
  bottom: { style: "medium" as const },
  right: { style: "medium" as const },
};

export const labelFill = {
  type: "pattern" as const,
  pattern: "solid" as const,
  fgColor: { argb: "FFF3F4F6" },
};

export const DEFAULT_A4_PORTRAIT_PAGE_SETUP = {
  paperSize: 9,
  orientation: "portrait" as const,
  fitToPage: true,
  fitToWidth: 1,
  fitToHeight: 0,
  margins: {
    left: 0.5,
    right: 0.5,
    top: 0.75,
    bottom: 0.75,
    header: 0.3,
    footer: 0.3,
  },
};

export const DEFAULT_A4_PORTRAIT_FIT_PAGE_SETUP = {
  ...DEFAULT_A4_PORTRAIT_PAGE_SETUP,
  fitToHeight: 1,
  margins: {
    left: 0.45,
    right: 0.45,
    top: 0.45,
    bottom: 0.45,
    header: 0.15,
    footer: 0.15,
  },
};

/** Configuración de impresión para ficha de baja (A4, 1 hoja, centrada). */
export const FICHA_BAJA_PAGE_SETUP = {
  paperSize: 9,
  orientation: "portrait" as const,
  fitToPage: true,
  fitToWidth: 1,
  fitToHeight: 1,
  horizontalCentered: true,
  verticalCentered: false,
  margins: {
    left: 0.35,
    right: 0.35,
    top: 0.4,
    bottom: 0.4,
    header: 0.1,
    footer: 0.1,
  },
};

export function mark(checked: boolean) {
  return checked ? "☑" : "☐";
}

/** Marca de casilla cuadrada para formatos oficiales (X / vacío). */
export function checkboxMark(checked: boolean) {
  return checked ? "X" : "";
}

export function colLetter(index: number): string {
  let n = index;
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

export type BorderWeight = "thin" | "medium" | "thick";

export type CellBorderSides = Partial<
  Record<"top" | "bottom" | "left" | "right", BorderWeight>
>;

export function buildCellBorder(
  sides: CellBorderSides,
  color = "FF000000"
): {
  top?: { style: BorderWeight; color: { argb: string } };
  bottom?: { style: BorderWeight; color: { argb: string } };
  left?: { style: BorderWeight; color: { argb: string } };
  right?: { style: BorderWeight; color: { argb: string } };
} {
  const border: Record<string, { style: BorderWeight; color: { argb: string } }> = {};
  (["top", "bottom", "left", "right"] as const).forEach((side) => {
    if (sides[side]) {
      border[side] = { style: sides[side]!, color: { argb: color } };
    }
  });
  return border;
}

export function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function loadImage(
  url: string
): Promise<{ buffer: ArrayBuffer; width: number; height: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const blob = new Blob([buffer]);
    const objectUrl = URL.createObjectURL(blob);

    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ buffer, width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ buffer, width: 120, height: 60 });
      };
      img.src = objectUrl;
    });
  } catch {
    return null;
  }
}

export function fitImageSize(
  naturalW: number,
  naturalH: number,
  maxW: number,
  maxH: number
) {
  if (!naturalW || !naturalH) return { width: maxW, height: maxH };
  const scale = Math.min(maxW / naturalW, maxH / naturalH, 1);
  return {
    width: Math.max(1, Math.round(naturalW * scale)),
    height: Math.max(1, Math.round(naturalH * scale)),
  };
}

export function colWidthToPx(width: number) {
  return width * 7 + 5;
}

export function rangeSizePx(
  ws: Worksheet,
  colStart: number,
  colEnd: number,
  rowStart: number,
  rowEnd: number
) {
  let widthPx = 0;
  for (let c = colStart; c <= colEnd; c++) {
    widthPx += colWidthToPx(ws.getColumn(c).width || 10);
  }
  let heightPx = 0;
  for (let r = rowStart; r <= rowEnd; r++) {
    heightPx += ws.getRow(r).height || 15;
  }
  return { widthPx, heightPx };
}

export function fillPageHeight(ws: Worksheet, lastRow: number, targetPt = 700) {
  let total = 0;
  for (let r = 1; r <= lastRow; r++) {
    total += ws.getRow(r).height || 15;
  }
  if (total <= 0) return;
  const factor = targetPt / total;
  for (let r = 1; r <= lastRow; r++) {
    const h = ws.getRow(r).height || 15;
    ws.getRow(r).height = Math.max(10, Math.round(h * factor));
  }
}

/** Plantilla oficial de ficha de baja (public/templates/ficha-baja.xlsx). */
export const FICHA_BAJA_TEMPLATE_URL = "/templates/ficha-baja.xlsx";

/** Plantilla oficial de ficha de soporte técnico (public/templates/ficha-soporte.xlsx). */
export const FICHA_SOPORTE_TEMPLATE_URL = "/templates/ficha-soporte.xlsx";

/** Plantilla oficial de acta de entrega (public/templates/acta-entrega.xlsx). */
export const ACTA_ENTREGA_TEMPLATE_URL = "/templates/acta-entrega.xlsx";

/** Carga un libro Excel existente conservando vistas, pageSetup, merges y estilos. */
export async function loadWorkbookTemplate(url: string): Promise<Workbook> {
  const mod = await import("exceljs");
  const ExcelJS = mod.default ?? mod;
  const res = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `No se encontró la plantilla Excel en ${url}. Coloque el archivo oficial en public/templates/ficha-baja.xlsx`
    );
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await res.arrayBuffer());
  return workbook;
}

export async function downloadWorkbook(workbook: Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const data = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function embedLogo(
  workbook: Workbook,
  ws: Worksheet,
  url: string,
  col: number,
  row: number,
  maxW: number,
  maxH: number
) {
  const img = await loadImage(url);
  if (!img) return;

  const size = fitImageSize(img.width, img.height, maxW, maxH);
  const imageId = workbook.addImage({ buffer: img.buffer, extension: "png" });
  ws.addImage(imageId, {
    tl: { col: col + 0.25, row: row + 0.35 },
    ext: { width: size.width, height: size.height },
  });
}

export async function embedLogoCentered(
  workbook: Workbook,
  ws: Worksheet,
  url: string,
  colStart: number,
  colEnd: number,
  rowStart: number,
  rowEnd: number,
  maxW: number,
  maxH: number
) {
  const img = await loadImage(url);
  if (!img) return;

  const size = fitImageSize(img.width, img.height, maxW, maxH);
  const { widthPx, heightPx } = rangeSizePx(ws, colStart, colEnd, rowStart, rowEnd);
  const offsetXPx = Math.max(0, (widthPx - size.width) / 2);
  const offsetYPx = Math.max(0, (heightPx - size.height) / 2);

  const firstColW = Math.max(colWidthToPx(ws.getColumn(colStart).width || 10), 1);
  const firstRowH = Math.max(ws.getRow(rowStart).height || 15, 1);

  const imageId = workbook.addImage({
    buffer: img.buffer as ArrayBuffer,
    extension: "png",
  });
  ws.addImage(imageId, {
    tl: {
      col: colStart - 1 + offsetXPx / firstColW,
      row: rowStart - 1 + offsetYPx / firstRowH,
    },
    ext: { width: size.width, height: size.height },
  });
}

export async function exportJsonSheet(params: {
  sheetName: string;
  rows: Record<string, unknown>[];
  filename: string;
}) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(params.rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, params.sheetName);
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const data = new Blob([excelBuffer], { type: "application/octet-stream" });
  const url = window.URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", params.filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
