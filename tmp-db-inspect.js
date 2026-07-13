const {config}=require('dotenv'); config();
const sql=require('mssql');
const cfg={
  server:process.env.DB_SERVER||'localhost',
  port:process.env.DB_PORT?parseInt(process.env.DB_PORT,10):1433,
  database:process.env.DB_NAME||process.env.DB_DATABASE||'SoporteTI',
  user:process.env.DB_USER,
  password:process.env.DB_PASS,
  options:{encrypt:false, trustServerCertificate:true}
};
(async()=>{
  try {
    const pool = await sql.connect(cfg);
    const procs = await pool.request().query("SELECT p.object_id, p.[name], p.type_desc, SCHEMA_NAME(p.schema_id) as schema_name FROM sys.procedures p WHERE p.[name] IN ('sp_MantenimientoNotificacion','sp_ConsultaNotificacion')");
    console.log('PROCS', JSON.stringify(procs.recordset,null,2));
    for (const row of procs.recordset) {
      const params = await pool.request().query(`SELECT parameter_id, name, TYPE_NAME(user_type_id) AS type_name, max_length, is_output FROM sys.parameters WHERE object_id=${row.object_id} ORDER BY parameter_id`);
      console.log('PARAMS', row.name, JSON.stringify(params.recordset,null,2));
    }
    const notifs = await pool.request().query("SELECT TABLE_NAME,COLUMN_NAME,DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME LIKE '%Notific%'");
    console.log('NOTIF TABLES', JSON.stringify(notifs.recordset,null,2));
    await pool.close();
  } catch (e) {
    console.error('SCRIPT ERROR', e);
    process.exit(1);
  }
})();
