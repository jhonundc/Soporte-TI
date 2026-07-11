const sql = require('mssql');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

(async () => {
  const config = {
    server: process.env.DB_SERVER || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
    database: process.env.DB_NAME || process.env.DB_DATABASE || 'SoporteTI',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASS || '',
    options: {
      encrypt: false,
      trustServerCertificate: true,
      cryptoCredentialsDetails: { minVersion: 'TLSv1' }
    }
  };

  const pool = await sql.connect(config);
  try {
    const definition = await pool.request().query("SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.sp_MantenimientoBienComponente')) AS definition");
    console.log(definition.recordset[0]?.definition || 'No definition');
  } finally {
    await pool.close();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
