const sql = require('mssql');

(async () => {
  const config = {
    server: 'DESKTOP-9GV713C',
    port: 1433,
    database: 'SoporteTI',
    user: 'sa',
    password: '12345',
    options: { encrypt: false, trustServerCertificate: true, cryptoCredentialsDetails: { minVersion: 'TLSv1' } }
  };
  const pool = new sql.ConnectionPool(config);
  await pool.connect();
  try {
    console.log('Ejecutando sp_MantenimientoBienComponente con acción R (Register)...');
    const result = await pool.request()
      .input('Accion', sql.VarChar(1), 'R')
      .input('IdBienComponente', sql.Int, null)
      .input('CodigoPatrimonial', sql.VarChar(50), 'SIN ASIGNACIÓN')
      .input('IdComponente', sql.Int, 1)
      .input('Observacion', sql.VarCharMax, null)
      .input('IdUsuario', sql.Int, 1)
      .input('Cantidad', sql.Int, 1)
      .input('DescripcionModelo', sql.VarCharMax, null)
      .input('Marca', sql.VarCharMax, 'TEST')
      .input('Serie', sql.VarCharMax, 'SER123')
      .input('ProcesadorEspecificaciones', sql.VarCharMax, 'Intel')
      .input('RAM', sql.VarCharMax, '8GB')
      .input('Almacenamiento', sql.VarCharMax, '256GB')
      .input('SistemaOperativo', sql.VarCharMax, 'Windows 10')
      .input('UbicacionFisica', sql.VarCharMax, 'Oficina')
      .input('UsuarioAsignado', sql.VarCharMax, 'Test')
      .input('EstadoEquipo', sql.VarCharMax, 'Funcionando')
      .execute('sp_MantenimientoBienComponente');
    console.log('✓ SP ejecutado exitosamente');
    console.log('Recordset:', JSON.stringify(result.recordset, null, 2));
  } catch (err) {
    console.error('✗ Error al ejecutar SP:', err.message);
    console.error('Número: ', err.number);
    console.error('Estado: ', err.state);
    console.error('Línea: ', err.lineNumber);
  }
  await pool.close();
})().catch(err => { 
  console.error('Error fatal:', err); 
  process.exit(1); 
});
