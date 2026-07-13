const sql = require('mssql');
(async () => {
  const config = {
    server: process.env.DB_SERVER || 'DESKTOP-9GV713C',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
    database: process.env.DB_NAME || process.env.DB_DATABASE || 'SoporteTI',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASS || '12345',
    options: { encrypt: false, trustServerCertificate: true }
  };

  const pool = new sql.ConnectionPool(config);
  await pool.connect();
  try {
    const q = `EXEC sp_MantenimientoBienComponente @Accion='R', @IdBienComponente=NULL, @CodigoPatrimonial='SIN ASIGNACIÓN', @IdComponente=1, @Observacion=NULL, @IdUsuario=1, @Cantidad=1, @DescripcionModelo=NULL, @Marca='TEST', @Serie='S1', @ProcesadorEspecificaciones=NULL, @RAM=NULL, @Almacenamiento=NULL, @SistemaOperativo=NULL, @UbicacionFisica=NULL, @UsuarioAsignado=NULL, @EstadoEquipo=NULL`;
    const r = await pool.request().query(q);
    console.log('OK, recordset:', JSON.stringify(r.recordset || []));
  } catch (e) {
    console.error('ERROR executing SP:', e && e.message ? e.message : e);
  } finally {
    await pool.close();
  }
})();
