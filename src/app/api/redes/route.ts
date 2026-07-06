import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";

// Obtener todas las redes (IPs)
export async function GET() {
  try {
    const result = await executeQuery(
      `SELECT 
          i.*,
          a.NombreArea AS Area_NombreArea, a.Piso AS Area_Piso, a.Referencia AS Area_Referencia, a.Activo AS Area_Activo,
          t.TipoEstacion AS TipoEstacion_TipoEstacion, t.Activo AS TipoEstacion_Activo
       FROM InventarioIPs i
       LEFT JOIN Areas a ON i.IdArea = a.IdArea
       LEFT JOIN TiposEstacion t ON i.IdTipoEstacion = t.IdTipoEstacion
       WHERE i.Activo = 1
       ORDER BY i.DireccionIp ASC`
    );

    const redes = result.recordset.map((row: any) => ({
      IdIp: row.IdIp,
      DireccionIp: row.DireccionIp,
      Vlan: row.Vlan,
      Estacion: row.Estacion,
      IdTipoEstacion: row.IdTipoEstacion,
      IdArea: row.IdArea,
      Observacion: row.Observacion,
      DireccionMac: row.DireccionMac,
      DHCP: row.DHCP,
      FechaRegistro: row.FechaRegistro,
      IdEmpleadoRegistro: row.IdEmpleadoRegistro,
      IdEstado: row.IdEstado,
      Activo: row.Activo,
      Area: row.IdArea 
        ? { IdArea: row.IdArea, NombreArea: row.Area_NombreArea, Piso: row.Area_Piso, Referencia: row.Area_Referencia, Activo: row.Area_Activo }
        : null,
      TipoEstacion: row.IdTipoEstacion
        ? { IdTipoEstacion: row.IdTipoEstacion, TipoEstacion: row.TipoEstacion_TipoEstacion, Activo: row.TipoEstacion_Activo }
        : null
    }));

    return NextResponse.json(redes);
  } catch (error) {
    console.error("Error en GET /api/redes:", error);
    return NextResponse.json(
      { error: "Error al obtener las redes" },
      { status: 500 }
    );
  }
}

// Crear una nueva red (IP)
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.DireccionIp) {
      return NextResponse.json(
        { error: "La dirección IP es requerida" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO InventarioIPs (DireccionIp, Vlan, Estacion, IdTipoEstacion, IdArea, Observacion, DireccionMac, DHCP, Activo, FechaRegistro) 
       OUTPUT INSERTED.* 
       VALUES (@DireccionIp, @Vlan, @Estacion, @IdTipoEstacion, @IdArea, @Observacion, @DireccionMac, @DHCP, 1, GETDATE())`,
      {
        DireccionIp: data.DireccionIp,
        Vlan: data.Vlan || null,
        Estacion: data.Estacion || null,
        IdTipoEstacion: data.IdTipoEstacion ? parseInt(data.IdTipoEstacion) : null,
        IdArea: data.IdArea ? parseInt(data.IdArea) : null,
        Observacion: data.Observacion || null,
        DireccionMac: data.DireccionMac || null,
        DHCP: data.DHCP === "true" || data.DHCP === true ? 1 : 0,
      }
    );
    
    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/redes:", error);
    return NextResponse.json(
      { error: "Error al crear la red" },
      { status: 500 }
    );
  }
}

// Actualizar una red
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.IdIp || !data.DireccionIp) {
      return NextResponse.json(
        { error: "El ID y la dirección IP son requeridos" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `UPDATE InventarioIPs 
       SET DireccionIp = @DireccionIp,
           Vlan = @Vlan,
           Estacion = @Estacion,
           IdTipoEstacion = @IdTipoEstacion,
           IdArea = @IdArea,
           Observacion = @Observacion,
           DireccionMac = @DireccionMac,
           DHCP = @DHCP
       OUTPUT INSERTED.* 
       WHERE IdIp = @IdIp`,
      {
        IdIp: parseInt(data.IdIp),
        DireccionIp: data.DireccionIp,
        Vlan: data.Vlan || null,
        Estacion: data.Estacion || null,
        IdTipoEstacion: data.IdTipoEstacion ? parseInt(data.IdTipoEstacion) : null,
        IdArea: data.IdArea ? parseInt(data.IdArea) : null,
        Observacion: data.Observacion || null,
        DireccionMac: data.DireccionMac || null,
        DHCP: data.DHCP === "true" || data.DHCP === true ? 1 : 0,
      }
    );
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Red no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error("Error en PATCH /api/redes:", error);
    return NextResponse.json(
      { error: "Error al actualizar la red" },
      { status: 500 }
    );
  }
}

// Desactivar una red (Soft Delete)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "El ID es requerido" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `UPDATE InventarioIPs 
       SET Activo = 0 
       OUTPUT INSERTED.* 
       WHERE IdIp = @IdIp`,
      {
        IdIp: parseInt(id),
      }
    );
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Red no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error("Error en DELETE /api/redes:", error);
    return NextResponse.json(
      { error: "Error al desactivar la red" },
      { status: 500 }
    );
  }
}

