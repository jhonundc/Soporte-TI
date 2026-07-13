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

  const pool = new sql.ConnectionPool(config);
  await pool.connect();
  try {
    const script = `ALTER PROCEDURE dbo.sp_MantenimientoBienComponente
    (
      @Accion CHAR(1),
      @IdBienComponente INT = NULL,
      @CodigoPatrimonial VARCHAR(100) = NULL,
      @IdComponente INT = NULL,
      @Observacion VARCHAR(500) = NULL,
      @IdUsuario INT = NULL,
      @Cantidad INT = NULL,
      @DescripcionModelo VARCHAR(200) = NULL,
      @Marca VARCHAR(100) = NULL,
      @Serie VARCHAR(100) = NULL,
      @ProcesadorEspecificaciones VARCHAR(300) = NULL,
      @RAM VARCHAR(100) = NULL,
      @Almacenamiento VARCHAR(100) = NULL,
      @SistemaOperativo VARCHAR(100) = NULL,
      @UbicacionFisica VARCHAR(200) = NULL,
      @UsuarioAsignado VARCHAR(200) = NULL,
      @EstadoEquipo VARCHAR(100) = NULL
    )
    AS
    BEGIN
      SET NOCOUNT ON;

      DECLARE @CodigoPatrimonialTrimmed VARCHAR(100) = NULLIF(LTRIM(RTRIM(@CodigoPatrimonial)), '');

      ---------------------------------------------------------
      -- R = REGISTRAR
      ---------------------------------------------------------
      IF @Accion = 'R'
      BEGIN
        IF @IdComponente IS NULL
        BEGIN
          RAISERROR('Debe seleccionar un componente.', 16, 1);
          RETURN;
        END;

        IF NOT EXISTS
        (
          SELECT 1
          FROM dbo.Componentes
          WHERE IdComponente = @IdComponente
            AND Activo = 1
        )
        BEGIN
          RAISERROR('El componente seleccionado no existe o está inactivo.', 16, 1);
          RETURN;
        END;

        IF @Cantidad IS NULL OR @Cantidad <= 0
        BEGIN
          RAISERROR('La cantidad debe ser mayor que cero.', 16, 1);
          RETURN;
        END;

        IF @CodigoPatrimonialTrimmed IS NOT NULL
        AND UPPER(REPLACE(REPLACE(@CodigoPatrimonialTrimmed, ' ', ''), '-', '')) COLLATE Latin1_General_CI_AI <> 'SINASIGNACION' COLLATE Latin1_General_CI_AI
        BEGIN
          IF EXISTS
          (
            SELECT 1
            FROM dbo.BienesComponentes
            WHERE CodigoPatrimonial = @CodigoPatrimonialTrimmed
              AND IdComponente = @IdComponente
              AND Activo = 1
          )
          BEGIN
            RAISERROR('El componente ya está registrado para este código patrimonial.', 16, 1);
            RETURN;
          END;
        END;

        INSERT INTO dbo.BienesComponentes
        (
          CodigoPatrimonial,
          IdComponente,
          FechaRegistro,
          Observacion,
          IdUsuario,
          Cantidad,
          Activo,
          DescripcionModelo,
          Marca,
          Serie,
          ProcesadorEspecificaciones,
          RAM,
          Almacenamiento,
          SistemaOperativo,
          UbicacionFisica,
          UsuarioAsignado,
          EstadoEquipo
        )
        VALUES
        (
          @CodigoPatrimonialTrimmed,
          @IdComponente,
          GETDATE(),
          NULLIF(LTRIM(RTRIM(@Observacion)), ''),
          @IdUsuario,
          @Cantidad,
          1,
          NULLIF(LTRIM(RTRIM(@DescripcionModelo)), ''),
          NULLIF(LTRIM(RTRIM(@Marca)), ''),
          NULLIF(LTRIM(RTRIM(@Serie)), ''),
          NULLIF(LTRIM(RTRIM(@ProcesadorEspecificaciones)), ''),
          NULLIF(LTRIM(RTRIM(@RAM)), ''),
          NULLIF(LTRIM(RTRIM(@Almacenamiento)), ''),
          NULLIF(LTRIM(RTRIM(@SistemaOperativo)), ''),
          NULLIF(LTRIM(RTRIM(@UbicacionFisica)), ''),
          NULLIF(LTRIM(RTRIM(@UsuarioAsignado)), ''),
          NULLIF(LTRIM(RTRIM(@EstadoEquipo)), '')
        );

        SELECT
          SCOPE_IDENTITY() AS IdBienComponente,
          'Bien componente registrado correctamente.' AS Mensaje;

        RETURN;
      END;

      ---------------------------------------------------------
      -- A = ACTUALIZAR
      ---------------------------------------------------------
      IF @Accion = 'A'
      BEGIN
        IF @IdBienComponente IS NULL
        BEGIN
          RAISERROR('Debe ingresar el IdBienComponente.', 16, 1);
          RETURN;
        END;

        IF NOT EXISTS
        (
          SELECT 1
          FROM dbo.BienesComponentes
          WHERE IdBienComponente = @IdBienComponente
        )
        BEGIN
          RAISERROR('El registro no existe.', 16, 1);
          RETURN;
        END;

        IF NOT EXISTS
        (
          SELECT 1
          FROM dbo.Componentes
          WHERE IdComponente = @IdComponente
            AND Activo = 1
        )
        BEGIN
          RAISERROR('El componente seleccionado no existe o está inactivo.', 16, 1);
          RETURN;
        END;

        IF @Cantidad IS NULL OR @Cantidad <= 0
        BEGIN
          RAISERROR('La cantidad debe ser mayor que cero.', 16, 1);
          RETURN;
        END;

        IF @CodigoPatrimonialTrimmed IS NOT NULL
        AND UPPER(REPLACE(REPLACE(@CodigoPatrimonialTrimmed, ' ', ''), '-', '')) COLLATE Latin1_General_CI_AI <> 'SINASIGNACION' COLLATE Latin1_General_CI_AI
        BEGIN
          IF EXISTS
          (
            SELECT 1
            FROM dbo.BienesComponentes
            WHERE CodigoPatrimonial = @CodigoPatrimonialTrimmed
              AND IdComponente = @IdComponente
              AND IdBienComponente <> @IdBienComponente
              AND Activo = 1
          )
          BEGIN
            RAISERROR('Ya existe este componente para el código patrimonial indicado.', 16, 1);
            RETURN;
          END;
        END;

        UPDATE dbo.BienesComponentes
        SET
          CodigoPatrimonial = @CodigoPatrimonialTrimmed,
          IdComponente = @IdComponente,
          Observacion = NULLIF(LTRIM(RTRIM(@Observacion)), ''),
          IdUsuario = @IdUsuario,
          Cantidad = @Cantidad,
          DescripcionModelo = NULLIF(LTRIM(RTRIM(@DescripcionModelo)), ''),
          Marca = NULLIF(LTRIM(RTRIM(@Marca)), ''),
          Serie = NULLIF(LTRIM(RTRIM(@Serie)), ''),
          ProcesadorEspecificaciones = NULLIF(LTRIM(RTRIM(@ProcesadorEspecificaciones)), ''),
          RAM = NULLIF(LTRIM(RTRIM(@RAM)), ''),
          Almacenamiento = NULLIF(LTRIM(RTRIM(@Almacenamiento)), ''),
          SistemaOperativo = NULLIF(LTRIM(RTRIM(@SistemaOperativo)), ''),
          UbicacionFisica = NULLIF(LTRIM(RTRIM(@UbicacionFisica)), ''),
          UsuarioAsignado = NULLIF(LTRIM(RTRIM(@UsuarioAsignado)), ''),
          EstadoEquipo = NULLIF(LTRIM(RTRIM(@EstadoEquipo)), '')
        WHERE IdBienComponente = @IdBienComponente;

        SELECT 'Bien componente actualizado correctamente.' AS Mensaje;

        RETURN;
      END;

      ---------------------------------------------------------
      -- E = DESACTIVAR
      ---------------------------------------------------------
      IF @Accion = 'E'
      BEGIN
        IF NOT EXISTS
        (
          SELECT 1
          FROM dbo.BienesComponentes
          WHERE IdBienComponente = @IdBienComponente
        )
        BEGIN
          RAISERROR('El registro no existe.', 16, 1);
          RETURN;
        END;

        UPDATE dbo.BienesComponentes
        SET Activo = 0
        WHERE IdBienComponente = @IdBienComponente;

        SELECT 'Bien componente desactivado correctamente.' AS Mensaje;
        RETURN;
      END;

      ---------------------------------------------------------
      -- T = ACTIVAR
      ---------------------------------------------------------
      IF @Accion = 'T'
      BEGIN
        IF NOT EXISTS
        (
          SELECT 1
          FROM dbo.BienesComponentes
          WHERE IdBienComponente = @IdBienComponente
        )
        BEGIN
          RAISERROR('El registro no existe.', 16, 1);
          RETURN;
        END;

        UPDATE dbo.BienesComponentes
        SET Activo = 1
        WHERE IdBienComponente = @IdBienComponente;

        SELECT 'Bien componente activado correctamente.' AS Mensaje;
        RETURN;
      END;

      ---------------------------------------------------------
      -- D = ELIMINAR DEFINITIVAMENTE
      ---------------------------------------------------------
      IF @Accion = 'D'
      BEGIN
        IF NOT EXISTS
        (
          SELECT 1
          FROM dbo.BienesComponentes
          WHERE IdBienComponente = @IdBienComponente
        )
        BEGIN
          RAISERROR('El registro no existe.', 16, 1);
          RETURN;
        END;

        DELETE FROM dbo.BienesComponentes
        WHERE IdBienComponente = @IdBienComponente;

        SELECT 'Bien componente eliminado definitivamente.' AS Mensaje;
        RETURN;
      END;

      RAISERROR('La acción indicada no es válida.', 16, 1);
    END;`;

    const result = await pool.request().query(script);
    console.log('Procedure updated successfully.');
    console.log(result);
  } catch (error) {
    console.error('Failed to update procedure:', error);
    process.exit(1);
  } finally {
    await pool.close();
  }
})();
