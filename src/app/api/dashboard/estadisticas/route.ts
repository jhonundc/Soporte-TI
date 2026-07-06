import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// Dashboard estadísticas: totales por área, por mes y por día de soporte
export async function GET(request: Request) {
  try {
    const [bienesResult, componentesResult, softwareResult, countsResult, areaResult, mesResult, diaResult] = await Promise.all([
      executeQuery(`EXEC sp_ConsultaBien @Accion = @Accion`, { Accion: "T" }).catch(() => ({ recordset: [] })),
      executeQuery(`EXEC sp_ConsultaBienComponente @Accion = @Accion`, { Accion: "L" }).catch(() => ({ recordset: [] })),
      executeQuery(`SELECT IdSoftware FROM BienSoftware`).catch(() => ({ recordset: [] })),
      executeQuery(`
        SELECT
          (SELECT COUNT(*) FROM BajasBienes) AS totalBajas,
          (SELECT COUNT(*) FROM SoporteTecnico) AS totalSoporte,
          (SELECT COUNT(*) FROM SoporteTecnico WHERE EstadoTicket = 'Pendiente') AS totalSoportePendiente,
          (SELECT COUNT(*) FROM SoporteTecnico WHERE EstadoTicket = 'En Proceso') AS totalSoporteProceso,
          (SELECT COUNT(*) FROM SoporteTecnico WHERE EstadoTicket = 'Atendido') AS totalSoporteAtendido,
          (SELECT COUNT(*) FROM SoporteTecnico WHERE EstadoTicket = 'Derivado') AS totalSoporteDerivado
      `).catch(() => ({ recordset: [{}] })),
      executeQuery(`
        SELECT 
            ISNULL(a.NombreArea, 'Sin Área') AS NombreArea, 
            COUNT(s.IdSoporte) AS Cantidad
        FROM SoporteTecnico s
        LEFT JOIN Bienes b ON s.IdBien = b.IdBien
        LEFT JOIN Areas a ON b.IdArea = a.IdArea
        GROUP BY a.NombreArea
      `).catch(() => ({ recordset: [] })),
      executeQuery(`
        SELECT 
            CONVERT(VARCHAR(7), FechaRegistro, 120) AS label,
            COUNT(*) AS Fichas
        FROM SoporteTecnico
        WHERE FechaRegistro IS NOT NULL
        GROUP BY CONVERT(VARCHAR(7), FechaRegistro, 120)
        ORDER BY label DESC
      `).catch(() => ({ recordset: [] })),
      executeQuery(`
        SELECT TOP 30
            CONVERT(VARCHAR(10), FechaRegistro, 120) AS fecha,
            COUNT(*) AS cantidad
        FROM SoporteTecnico
        WHERE FechaRegistro IS NOT NULL
        GROUP BY CONVERT(VARCHAR(10), FechaRegistro, 120)
        ORDER BY fecha DESC
      `).catch(() => ({ recordset: [] }))
    ]);

    const counts = countsResult.recordset?.[0] || {};
    const totalBienes = bienesResult.recordset?.length ?? 0;
    const totalBienesActivos = bienesResult.recordset?.filter((row: any) => row.Activo === 1 || row.Activo === true).length ?? 0;
    const totalBienesInactivos = totalBienes - totalBienesActivos;
    const totalComponentes = componentesResult.recordset?.length ?? 0;
    const totalSoftware = softwareResult.recordset?.length ?? 0;

    // Formatear fichas por área
    const fichasPorArea: Record<string, number> = {};
    areaResult.recordset?.forEach((row: any) => {
      fichasPorArea[row.NombreArea] = row.Cantidad;
    });

    // Formatear soporte por mes
    const soportePorMes = mesResult.recordset?.map((row: any) => ({
      label: row.label,
      Fichas: row.Fichas
    })) || [];

    // Formatear soporte por día (ordenar cronológicamente para el gráfico)
    const soportePorDia = (diaResult.recordset || [])
      .map((row: any) => ({
        fecha: row.fecha,
        cantidad: row.cantidad
      }))
      .reverse();

    return NextResponse.json({
      totales: {
        totalBienes,
        totalBienesActivos,
        totalBienesInactivos,
        totalComponentes,
        totalSoftware,
        totalBajas: counts.totalBajas || 0,
        totalSoporte: counts.totalSoporte || 0,
        totalSoportePendiente: counts.totalSoportePendiente || 0,
        totalSoporteProceso: counts.totalSoporteProceso || 0,
        totalSoporteAtendido: counts.totalSoporteAtendido || 0,
        totalSoporteDerivado: counts.totalSoporteDerivado || 0,
      },
      fichasPorArea,
      soportePorMes,
      soportePorDia,
    });
  } catch (error) {
    console.error("Error en GET /api/dashboard/estadisticas:", error);
    // Retornar valores por defecto en caso de error
    return NextResponse.json({
      totales: {
        totalBienes: 0,
        totalBienesActivos: 0,
        totalBienesInactivos: 0,
        totalComponentes: 0,
        totalSoftware: 0,
        totalBajas: 0,
        totalSoporte: 0,
        totalSoportePendiente: 0,
        totalSoporteProceso: 0,
        totalSoporteAtendido: 0,
        totalSoporteDerivado: 0,
      },
      fichasPorArea: {},
      soportePorMes: [],
      soportePorDia: [],
    });
  }
}

