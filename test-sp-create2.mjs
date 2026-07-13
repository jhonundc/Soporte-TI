import sql from 'mssql';

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
    console.log('Ejecutando sp_MantenimientoBienComponente con tipos correctos...');
    const request = pool.request();
    request.input('Accion', sql.Char(1), 'R');
    request.input('IdBienComponente', sql.Int, null);
    request.input('CodigoPatrimonial', sql.VarChar(100), 'SIN ASIGNACIÓN');
    request.input('IdComponente', sql.Int, 1);
    request.input('Observacion', sql.VarChar(500), null);
    request.input('IdUsuario', sql.Int, 1);
    request.input('Cantidad', sql.Int, 1);
    request.input('DescripcionModelo', sql.VarChar(200), 'TEST');
    request.input('Marca', sql.VarChar(100), 'TEST');
    request.input('Serie', sql.VarChar(100), 'SER123');
    request.input('ProcesadorEspecificaciones', sql.VarChar(300), 'Intel');
    request.input('RAM', sql.VarChar(100), '8GB');
    request.input('Almacenamiento', sql.VarChar(100), '256GB');
    request.input('SistemaOperativo', sql.VarChar(100), 'Windows 10');
    request.input('UbicacionFisica', sql.VarChar(200), 'Oficina');
    request.input('UsuarioAsignado', sql.VarChar(200), 'Test');
    request.input('EstadoEquipo', sql.VarChar(100), 'Funcionando');

    const result = await request.execute('sp_MantenimientoBienComponente');
    console.log('✓ SP ejecutado exitosamente');
    console.log('Recordset:', JSON.stringify(result.recordset, null, 2));
  } catch (err) {
    console.error('✗ Error al ejecutar SP:', err.message);
    console.error('Número:', err.number);
    console.error('Estado:', err.state);
    console.error('Línea:', err.lineNumber);
  }
  await pool.close();
})().catch(err => { 
  console.error('Error fatal:', err); 
  process.exit(1); 
});
