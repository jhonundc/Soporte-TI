import sql from 'mssql';

const config = {
  server: 'DESKTOP-9GV713C',
  port: 1433,
  database: 'SoporteTI',
  user: 'sa',
  password: '12345',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    cryptoCredentialsDetails: { minVersion: 'TLSv1' },
  },
};

(async () => {
  const pool = new sql.ConnectionPool(config);
  await pool.connect();
  try {
    const result = await pool.request().input('Accion', sql.Char(1), 'L').execute('sp_ConsultaBienComponente');
    const rows = result.recordset || [];
    const bad = rows.filter((r) =>
      String(r.UbicacionFisica || '').toLowerCase().includes('oficina') ||
      String(r.CodigoPatrimonial || '').toLowerCase().includes('oficina') ||
      String(r.NombreArea || '').toLowerCase().includes('oficina') ||
      String(r.Area || '').toLowerCase().includes('oficina')
    );
    console.log('total', rows.length, 'bad', bad.length);
    console.log(bad.slice(0, 10).map((r) => ({
      IdBienComponente: r.IdBienComponente,
      CodigoPatrimonial: r.CodigoPatrimonial,
      UbicacionFisica: r.UbicacionFisica,
      NombreArea: r.NombreArea ?? null,
      Area: r.Area ?? null,
      IdComponente: r.IdComponente,
      Marca: r.Marca,
      Serie: r.Serie,
    })));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.close();
  }
})();
