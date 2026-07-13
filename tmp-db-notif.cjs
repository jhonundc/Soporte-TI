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
    const proc = await pool.request().query("SELECT p.object_id, p.[name], p.type_desc, SCHEMA_NAME(p.schema_id) as schema_name FROM sys.procedures p WHERE p.[name]='sp_ConsultaNotificacion'");
    console.log('PROC', JSON.stringify(proc.recordset,null,2));
    if (proc.recordset.length) {
      const row = proc.recordset[0];
      const params = await pool.request().query(`SELECT parameter_id, name, TYPE_NAME(user_type_id) AS type_name, max_length, is_output FROM sys.parameters WHERE object_id=${row.object_id} ORDER BY parameter_id`);
      console.log('PARAMS', JSON.stringify(params.recordset,null,2));
    }
    const roles = await pool.request().query("SELECT TOP 20 u.IdUsuario, u.Usuario, u.Nombres, u.IdRol, r.NombreRol FROM Usuarios u INNER JOIN Roles r ON u.IdRol=r.IdRol WHERE u.Activo=1 ORDER BY u.IdUsuario");
    console.log('USERS', JSON.stringify(roles.recordset,null,2));
    await pool.close();
  } catch (e) {
    console.error('SCRIPT ERROR', e);
    process.exit(1);
  }
})();
