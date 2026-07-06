import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

export async function GET() {
  try {
    const result = await executeQuery("EXEC sp_ConsultaBien @Accion = @Accion", { Accion: "L" });

    const bienes = result.recordset.map((row: any) => ({
      CodigoInventario: row.CodigoInventario ?? "",
      CodigoPatrimonial: row.CodigoPatrimonial ?? "",
      Descripcion: row.Descripcion ?? "",
      NumeroSerie: row.NumeroSerie ?? "",
      Marca: row.Marca_Marca ?? "",
      Modelo: row.Modelo ?? row.Modelo_Modelo ?? "",
      Area: row.Area_NombreArea ?? "",
      Categoria: row.Categoria_CategoriaBien ?? "",
      Condicion: row.Condicion_Condicion ?? "",
      Estado: row.Estado_EstadoBien ?? "",
      FechaCompra: row.FechaCompra ? new Date(row.FechaCompra).toLocaleDateString("es-PE") : "",
      FechaRegistro: row.FechaRegistro ? new Date(row.FechaRegistro).toLocaleString("es-PE") : "",
      FechaModificacion: row.FechaModificacion ? new Date(row.FechaModificacion).toLocaleString("es-PE") : "",
      Activo: row.Activo ? "Sí" : "No",
    }));

    const headers = [
      "Código Inventario",
      "Código Patrimonial",
      "Bien / Descripción",
      "Marca",
      "Modelo",
      "Área",
      "Categoría",
      "Condición",
      "Estado",
      "Nº Serie",
      "Fecha Compra",
      "Fecha Registro",
      "Fecha Modificación",
      "Activo",
    ];

    const rows = bienes.map((b: any) => [
      b.CodigoInventario,
      b.CodigoPatrimonial,
      b.Descripcion,
      b.Marca,
      b.Modelo,
      b.Area,
      b.Categoria,
      b.Condicion,
      b.Estado,
      b.NumeroSerie,
      b.FechaCompra,
      b.FechaRegistro,
      b.FechaModificacion,
      b.Activo,
    ]);

    const csvContent = [
      headers.join("\t"),
      ...rows.map((row: any[]) =>
        row
          .map((cell) => String(cell ?? "").replace(/\t/g, " ").replace(/\n/g, " "))
          .join("\t")
      ),
    ].join("\n");

    const now = new Date();
    const filename = `inventario_bienes_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}.csv`;

    return new NextResponse("\uFEFF" + csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error en GET /api/bienes/exportar:", error);
    return NextResponse.json(
      { error: "Error al exportar inventario" },
      { status: 500 }
    );
  }
}
