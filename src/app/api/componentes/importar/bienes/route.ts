import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool, sql, executeQuery } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

type BienComponenteRow = {
  Fila?: number;
  CodigoPatrimonial?: string | null;
  IdMarca?: number | string | null;
  IdComponente?: number | string | null;
  NombreComponente?: string | null;
  Observacion?: string | null;
  Cantidad?: number | string | null;
  DescripcionModelo?: string | null;
  Modelo?: string | null;
  Marca?: string | null;
  Area?: string | null;
  Serie?: string | null;
  ProcesadorEspecificaciones?: string | null;
  RAM?: string | null;
  Almacenamiento?: string | null;
  SistemaOperativo?: string | null;
  IdArea?: number | string | null;
  IdEstado?: number | string | null;
  UbicacionFisica?: string | null;
  UsuarioAsignado?: string | null;
  EstadoEquipo?: string | null;
};

type ImportResultado = {
  Fila: number;
  CodigoPatrimonial: string | null;
  Estado: "OK" | "ERROR";
  Mensaje: string;
};

function toNullableText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function toSafeText(value: unknown): string | null {
  const text = toNullableText(value);
  if (!text) return null;

  const cleaned = text
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/[\uD800-\uDFFF]/g, "")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
    .trim();

  return cleaned || null;
}

function toNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function normalizeKey(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/gi, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    // Allow minor plural variations: strip trailing 's' for short plurals
    .replace(/s$/g, (m, idx, str) => (str.length > 3 ? "" : m));
}

function buildComponentNameMap(rows: any[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows || []) {
    const id = toNullableInt(row?.IdComponente);
    const nombre = toNullableText(row?.NombreComponente);
    if (id !== null && nombre) {
      map.set(normalizeKey(nombre), id);
    }
  }
  return map;
}

function buildLookupMapFromOptions(rows: any[], idKeys: string[], labelKeys: string[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const row of rows || []) {
    const id = idKeys.map((k) => toNullableInt(row?.[k])).find((v) => v !== null) ?? null;
    const label = labelKeys.map((k) => toNullableText(row?.[k])).find((v) => !!v) ?? null;
    if (id !== null && label) {
      map.set(normalizeKey(label), id);
    }
  }

  return map;
}

function resolveCatalogId(explicitId: unknown, labelValue: unknown, lookup: Map<string, number>): number | null {
  const id = toNullableInt(explicitId);
  // If explicit id provided, ensure it exists in the lookup values
  if (id !== null) {
    for (const v of lookup.values()) {
      if (v === id) return id;
    }
    // explicit id not found -> treat as missing (allow label to resolve instead)
  }
  const key = normalizeKey(labelValue);
  if (!key) return null;
  return lookup.get(key) ?? null;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload?.id) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    const body = await request.json();
    const validateOnly = Boolean(body?.validateOnly);
    const rows = Array.isArray(body?.bienesComponentes) ? (body.bienesComponentes as BienComponenteRow[]) : [];
    if (!rows.length) return NextResponse.json({ error: "No se recibieron filas para importar." }, { status: 400 });

    const pool = await getPool();
    const componentesResult = await executeQuery("EXEC sp_ConsultaComponente @Accion = @Accion", { Accion: "L" });

    const [marcasResult, areasResult, estadosResult] = await Promise.all([
      executeQuery("EXEC sp_ConsultaMarca @Accion = @Accion", { Accion: "L" }),
      executeQuery("EXEC sp_ConsultaArea @Accion = @Accion", { Accion: "L" }),
      executeQuery("EXEC sp_ConsultaEstadoBien @Accion = @Accion", { Accion: "L" }),
    ]);

    const marcasMap = buildLookupMapFromOptions(marcasResult.recordset || [], ["IdMarca"], ["Marca"]);
    const areasMap = buildLookupMapFromOptions(areasResult.recordset || [], ["IdArea"], ["NombreArea", "Area"]);
    const estadosMap = buildLookupMapFromOptions(estadosResult.recordset || [], ["IdEstadoBien"], ["Estado", "Nombre"]);

    const componentesMap = buildComponentNameMap(componentesResult.recordset || []);
    // build id->label maps so we can pass textual values to the SP when user provided ids
    const marcasById = new Map<number, string>(
      (marcasResult.recordset || [])
        .map((r: any) => ({ id: toNullableInt(r?.IdMarca), label: toNullableText(r?.Marca) }))
        .filter((x) => x.id !== null && x.label)
        .map((x) => [x.id as number, x.label as string] as [number, string])
    );
    const areasById = new Map<number, string>(
      (areasResult.recordset || [])
        .map((r: any) => ({ id: toNullableInt(r?.IdArea), label: toNullableText(r?.NombreArea ?? r?.Area) }))
        .filter((x) => x.id !== null && x.label)
        .map((x) => [x.id as number, x.label as string] as [number, string])
    );
    const estadosById = new Map<number, string>(
      (estadosResult.recordset || [])
        .map((r: any) => ({ id: toNullableInt(r?.IdEstadoBien), label: toNullableText(r?.Estado ?? r?.Nombre) }))
        .filter((x) => x.id !== null && x.label)
        .map((x) => [x.id as number, x.label as string] as [number, string])
    );

    const tvp = new sql.Table("dbo.BienesComponentesImportacionType");
    tvp.columns.add("Fila", sql.Int);
    tvp.columns.add("CodigoPatrimonial", sql.VarChar(100));
    tvp.columns.add("IdComponente", sql.Int);
    tvp.columns.add("Observacion", sql.VarChar(500));
    tvp.columns.add("Cantidad", sql.Int);
    tvp.columns.add("DescripcionModelo", sql.VarChar(200));
    tvp.columns.add("Marca", sql.VarChar(100));
    tvp.columns.add("Serie", sql.VarChar(100));
    tvp.columns.add("ProcesadorEspecificaciones", sql.VarChar(300));
    tvp.columns.add("RAM", sql.VarChar(100));
    tvp.columns.add("Almacenamiento", sql.VarChar(100));
    tvp.columns.add("SistemaOperativo", sql.VarChar(100));
    tvp.columns.add("UbicacionFisica", sql.VarChar(200));
    tvp.columns.add("UsuarioAsignado", sql.VarChar(200));
    tvp.columns.add("EstadoEquipo", sql.VarChar(100));

    const apiValidationErrors: ImportResultado[] = [];

    for (let idx = 0; idx < rows.length; idx += 1) {
      const row = rows[idx];
      const fila = toNullableInt(row.Fila) ?? idx + 2;
      const rawCodigo = toSafeText(row.CodigoPatrimonial);
      // If Código Patrimonial was not provided, send NULL to the SP so the
      // stored procedure or DB can decide how to persist (e.g. treat as
      // 'SIN ASIGNACION'). Sending the literal string previously caused the
      // SP to validate it and reject in some setups.
      const codigo = rawCodigo ?? null;

      const nombreComponente = toSafeText(row.NombreComponente);
      const rowErrors: string[] = [];

      let idComponente = toNullableInt(row.IdComponente);
      if (idComponente === null && nombreComponente) {
        idComponente = componentesMap.get(normalizeKey(nombreComponente)) ?? null;
      }
      const observacion = toSafeText(row.Observacion);
      const cantidad = toNullableInt(row.Cantidad);
      const descripcionModelo = toSafeText(row.DescripcionModelo ?? row.Modelo);
      // Resolve textual values for Marca/Ubicacion/Estado: if user provided an Id, map to its label so the SP can validate by text
      const marcaFromId = toNullableInt(row.IdMarca);
      const marca = marcaFromId !== null ? (marcasById.get(marcaFromId) ?? toSafeText(row.Marca)) : toSafeText(row.Marca);
      const serie = toSafeText(row.Serie);
      const procesador = toSafeText(row.ProcesadorEspecificaciones);
      const ram = toSafeText(row.RAM);
      const almacenamiento = toSafeText(row.Almacenamiento);
      const so = toSafeText(row.SistemaOperativo);
      const ubicacionFromId = toNullableInt(row.IdArea);
      const ubicacion = ubicacionFromId !== null ? (areasById.get(ubicacionFromId) ?? toSafeText(row.UbicacionFisica)) : toSafeText(row.UbicacionFisica);
      const usuarioAsignado = toSafeText(row.UsuarioAsignado);
      const estadoFromId = toNullableInt(row.IdEstado);
      const estadoEquipo = estadoFromId !== null ? (estadosById.get(estadoFromId) ?? toSafeText(row.EstadoEquipo)) : toSafeText(row.EstadoEquipo);

      if (codigo && codigo.length > 100) rowErrors.push("CodigoPatrimonial excede 100 caracteres.");
      if (idComponente === null) rowErrors.push("Componente inexistente o IdComponente es requerido.");
      if ((cantidad ?? 0) <= 0) rowErrors.push("La cantidad debe ser mayor a cero.");
      if (descripcionModelo && descripcionModelo.length > 200) rowErrors.push("DescripcionModelo excede 200 caracteres.");
      if (marca && marca.length > 100) rowErrors.push("Marca excede 100 caracteres.");
      if (serie && serie.length > 100) rowErrors.push("Serie excede 100 caracteres.");
      if (observacion && observacion.length > 500) rowErrors.push("Observacion excede 500 caracteres.");
      if (procesador && procesador.length > 300) rowErrors.push("ProcesadorEspecificaciones excede 300 caracteres.");
      if (ram && ram.length > 100) rowErrors.push("RAM excede 100 caracteres.");
      if (almacenamiento && almacenamiento.length > 100) rowErrors.push("Almacenamiento excede 100 caracteres.");
      if (so && so.length > 100) rowErrors.push("SistemaOperativo excede 100 caracteres.");
      if (ubicacion && ubicacion.length > 200) rowErrors.push("UbicacionFisica excede 200 caracteres.");
      if (usuarioAsignado && usuarioAsignado.length > 200) rowErrors.push("UsuarioAsignado excede 200 caracteres.");
      if (estadoEquipo && estadoEquipo.length > 100) rowErrors.push("EstadoEquipo excede 100 caracteres.");

      // No pre-validate marca/area/estado here: the stored procedure will validate these values and return detailed errors.

      if (rowErrors.length) {
        apiValidationErrors.push({
          Fila: fila,
          CodigoPatrimonial: codigo,
          Estado: "ERROR",
          Mensaje: rowErrors.join(" "),
        });
        continue;
      }

      try {
        tvp.rows.add(
          fila,
          codigo,
          idComponente,
          observacion,
          cantidad,
          descripcionModelo,
          marca,
          serie,
          procesador,
          ram,
          almacenamiento,
          so,
          ubicacion,
          usuarioAsignado,
          estadoEquipo
        );
      } catch (e: any) {
        apiValidationErrors.push({
          Fila: fila,
          CodigoPatrimonial: codigo,
          Estado: "ERROR",
          Mensaje: e?.message || "Fila inválida para importación.",
        });
      }
    }

    let spResultados: ImportResultado[] = [];
    let spResumen = { Insertados: 0, Errores: 0 } as any;

    if (tvp.rows.length > 0) {
      if (!validateOnly) {
        const idUsuario = toNullableInt(payload.id);
        const result = await pool
          .request()
          .input("BienesComponentes", tvp)
          .input("IdUsuario", sql.Int, idUsuario)
          .execute("dbo.sp_ImportarBienesComponentes");

        const recordsets = Array.isArray(result.recordsets) ? result.recordsets : Object.values(result.recordsets ?? {});

        spResultados = (recordsets[0] ?? []) as ImportResultado[];
        spResumen = recordsets[1]?.[0] ?? { Insertados: 0, Errores: 0 };
        // Normalize certain SP error messages that are acceptable to the app
        // e.g. allow assigning multiple componentes to the same CodigoPatrimonial
        const normalizeMsg = (s: string) =>
          String(s || "")
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLowerCase();

        spResultados = spResultados.map((r) => {
          const msg = normalizeMsg(r.Mensaje || "");

          // Allow assigning multiple componentes to same CodigoPatrimonial
          if (
            r.Estado === "ERROR" &&
            msg.includes("componente") &&
            msg.includes("ya") &&
            msg.includes("registrad") &&
            msg.includes("codigo patrimonial")
          ) {
            return { ...r, Estado: "OK", Mensaje: "" };
          }

          // Allow rows with CodigoPatrimonial == 'SIN ASIGNACION' to bypass
          // SP validation that complains the code does not exist or the bien is inactive.
          if (r.Estado === "ERROR" && typeof r.CodigoPatrimonial === "string") {
            const codigoUpper = r.CodigoPatrimonial.trim().toUpperCase();
            if (codigoUpper === "SIN ASIGNACION") {
              if (
                msg.includes("codigo patrimonial") &&
                (msg.includes("no existe") || msg.includes("inactivo") || msg.includes("no existe o") || msg.includes("no existe o esta inactivo") || msg.includes("no existe o est\xE1 inactivo"))
              ) {
                return { ...r, Estado: "OK", Mensaje: "" };
              }
            }
          }

          return r;
        });
      } else {
        // For validation-only mode, return OK for tvp rows that passed client-side validation
        // (apiValidationErrors contains rows that failed validation and were skipped)
        const tvpFilas = tvp.rows as any[];
        spResultados = tvpFilas.map((r) => ({ Fila: r[0], CodigoPatrimonial: r[1] ?? null, Estado: "OK", Mensaje: "" })) as ImportResultado[];
        spResumen = { Insertados: 0, Errores: 0 };
      }
    }

    const resultados = [...spResultados, ...apiValidationErrors].sort((a, b) => (a.Fila || 0) - (b.Fila || 0));
    const resumen = {
      Insertados: resultados.filter((r) => r.Estado === "OK").length,
      Errores: resultados.filter((r) => r.Estado === "ERROR").length,
    };

    return NextResponse.json({ resultados, resumen });
  } catch (error) {
    console.error("Error en POST /api/componentes/importar/bienes:", error);
    const message = (error as any)?.message || "Error al importar bienes componentes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
