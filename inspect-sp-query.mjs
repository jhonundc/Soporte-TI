import sql from 'mssql';

const config = {
  server: 'DESKTOP-9GV713C',
  port: 1433,
  database: 'SoporteTI',
  user: 'sa',
  password: '12345',
  options: { encrypt: false, trustServerCertificate: true, cryptoCredentialsDetails: { minVersion: 'TLSv1' } }
};

(async () => {
  const pool = new sql.ConnectionPool(config);
  await pool.connect();
  try {
    const result = await pool.request()
      .input('Accion', sql.Char(1), 'L')
      .execute('sp_ConsultaBienComponente');
    console.log('fields:', result.recordset.length, Object.keys(result.recordset[0] || {}));
    console.log('first:', JSON.stringify(result.recordset[0] || {}, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.close();
  }
})();
