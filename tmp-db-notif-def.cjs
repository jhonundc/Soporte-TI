const { config } = require('dotenv'); config();
const sql = require('mssql');
const cfg = {
  server: process.env.DB_SERVER || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'SoporteTI',
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  options: { encrypt: false, trustServerCertificate: true }
};
(async () => {
  try {
    const pool = await sql.connect(cfg);
    const text = await pool.request().query("SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.sp_MantenimientoNotificacion')) AS definition");
    console.log('DEFINITION', text.recordset[0]?.definition?.substring(0, 4000));
    const notifTop = await pool.request().query("SELECT TOP 5 * FROM Notificaciones ORDER BY FechaCreacion DESC");
    console.log('NOTIFS', JSON.stringify(notifTop.recordset, null, 2));
    const soporteTop = await pool.request().query("SELECT TOP 5 * FROM SoporteTecnico ORDER BY FechaRegistro DESC");
    console.log('SOPORTE', JSON.stringify(soporteTop.recordset, null, 2));
    await pool.close();
  } catch (e) {
    console.error('SCRIPT ERROR', e);
    process.exit(1);
  }
})();
