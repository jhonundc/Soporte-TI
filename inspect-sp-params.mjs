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
    console.log('Inspeccionando parámetros del SP...');
    const result = await pool.request().query(`
      SELECT p.name AS parameter_name, t.name AS type_name, p.max_length, p.is_output
      FROM sys.procedures sp
      JOIN sys.parameters p ON sp.object_id = p.object_id
      JOIN sys.types t ON p.user_type_id = t.user_type_id
      WHERE sp.name = 'sp_MantenimientoBienComponente'
      ORDER BY p.parameter_id;
    `);
    console.log('Parámetros del SP:');
    console.log(JSON.stringify(result.recordset, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
  await pool.close();
})().catch(err => { 
  console.error('Error fatal:', err); 
  process.exit(1); 
});
