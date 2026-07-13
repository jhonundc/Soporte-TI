import sql from "mssql";

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
    const ids = [1,2,3,4,5,7,10,20];
    for (const id of ids) {
      const res = await pool.request()
        .input('Accion', sql.Char(1), 'A')
        .input('IdArea', sql.Int, id)
        .execute('sp_ConsultaBienComponente');
      console.log('IdArea', id, 'rows', res.recordset.length);
      if (res.recordset.length > 0) console.log(JSON.stringify(res.recordset.slice(0,2), null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.close();
  }
})();
