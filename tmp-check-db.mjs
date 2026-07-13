import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'SoporteTI',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASS || '',
  options: { encrypt: false, trustServerCertificate: true, cryptoCredentialsDetails: { minVersion: 'TLSv1' } },
};

const pool = await sql.connect(config);
try {
  const users = await pool.request().query("SELECT TOP 10 IdUsuario, Usuario, Nombres, IdRol, Activo FROM Usuarios ORDER BY IdUsuario");
  console.log('USERS');
  console.log(JSON.stringify(users.recordset, null, 2));

  const roles = await pool.request().query("SELECT TOP 10 IdRol, NombreRol, Activo FROM Roles ORDER BY IdRol");
  console.log('ROLES');
  console.log(JSON.stringify(roles.recordset, null, 2));

  const result = await pool.request()
    .input('Accion', sql.VarChar(1), 'R')
    .input('CodigoPatrimonial', sql.VarChar(100), 'TEST-PRUEBA-XYZ')
    .input('IdComponente', sql.Int, 1)
    .input('Observacion', sql.VarChar(500), 'prueba')
    .input('IdUsuario', sql.Int, 1)
    .input('Cantidad', sql.Int, 1)
    .input('DescripcionModelo', sql.VarChar(200), 'Modelo')
    .input('Marca', sql.VarChar(100), 'Marca')
    .input('Serie', sql.VarChar(100), 'SERIE-X')
    .input('ProcesadorEspecificaciones', sql.VarChar(300), 'Intel')
    .input('RAM', sql.VarChar(100), '8GB')
    .input('Almacenamiento', sql.VarChar(100), '256GB')
    .input('SistemaOperativo', sql.VarChar(100), 'Windows')
    .input('UbicacionFisica', sql.VarChar(200), 'Oficina')
    .input('UsuarioAsignado', sql.VarChar(200), 'Usuario')
    .input('EstadoEquipo', sql.VarChar(100), 'Activo')
    .query('EXEC dbo.sp_MantenimientoBienComponente @Accion,@CodigoPatrimonial,@IdComponente,@Observacion,@IdUsuario,@Cantidad,@DescripcionModelo,@Marca,@Serie,@ProcesadorEspecificaciones,@RAM,@Almacenamiento,@SistemaOperativo,@UbicacionFisica,@UsuarioAsignado,@EstadoEquipo');

  console.log('SP RESULT');
  console.log(JSON.stringify(result.recordset, null, 2));
} catch (err) {
  console.error('ERROR');
  console.error(err.message);
  if (err.originalError) {
    console.error(err.originalError.message);
  }
} finally {
  await pool.close();
}
