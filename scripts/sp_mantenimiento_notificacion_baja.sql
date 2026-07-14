IF COL_LENGTH('dbo.BajasBienes', 'EstadoAprobacion') IS NULL
BEGIN
  ALTER TABLE dbo.BajasBienes
    ADD EstadoAprobacion VARCHAR(20) NOT NULL
      CONSTRAINT DF_BajasBienes_EstadoAprobacion DEFAULT 'PENDIENTE';
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_MantenimientoNotificacionBaja
  @Accion CHAR(1),
  @IdNotificacion INT = NULL,
  @IdReferencia INT = NULL,
  @IdUsuarioOrigen INT = NULL,
  @IdUsuarioDestino INT = NULL,
  @IdUsuarioAdministrador INT = NULL,
  @Titulo VARCHAR(200) = NULL,
  @Mensaje VARCHAR(500) = NULL,
  @ObservacionAdministrador VARCHAR(500) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  BEGIN TRY
    BEGIN TRANSACTION;

    IF @Accion = 'R'
    BEGIN
      IF @IdReferencia IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.BajasBienes WHERE IdBaja = @IdReferencia)
        RAISERROR('La ficha de baja indicada no existe.', 16, 1);

      IF NOT EXISTS (
        SELECT 1
        FROM dbo.Usuarios u
        INNER JOIN dbo.Roles r ON r.IdRol = u.IdRol
        WHERE u.IdUsuario = @IdUsuarioOrigen
          AND u.Activo = 1
          AND r.Activo = 1
          AND LOWER(LTRIM(RTRIM(r.NombreRol))) = 'soporte'
      )
        RAISERROR('El usuario de origen debe tener rol de soporte.', 16, 1);

      IF NOT EXISTS (
        SELECT 1
        FROM dbo.Usuarios u
        INNER JOIN dbo.Roles r ON r.IdRol = u.IdRol
        WHERE u.IdUsuario = @IdUsuarioDestino
          AND u.Activo = 1
          AND r.Activo = 1
          AND LOWER(LTRIM(RTRIM(r.NombreRol))) = 'admin'
      )
        RAISERROR('El usuario de destino debe tener rol de administrador.', 16, 1);

      IF NULLIF(LTRIM(RTRIM(@Titulo)), '') IS NULL OR NULLIF(LTRIM(RTRIM(@Mensaje)), '') IS NULL
        RAISERROR('El título y el mensaje son obligatorios.', 16, 1);

      IF EXISTS (
        SELECT 1 FROM dbo.Notificaciones WITH (UPDLOCK, HOLDLOCK)
        WHERE TipoFicha = 'BAJA' AND IdReferencia = @IdReferencia
          AND EstadoAprobacion = 'PENDIENTE' AND Activo = 1
      )
        RAISERROR('Ya existe una notificación pendiente para esta ficha de baja.', 16, 1);

      INSERT INTO dbo.Notificaciones (
        TipoFicha, IdReferencia, IdUsuarioOrigen, IdUsuarioDestino, Titulo, Mensaje,
        EstadoAprobacion, Leido, FechaCreacion, Activo
      ) VALUES (
        'BAJA', @IdReferencia, @IdUsuarioOrigen, @IdUsuarioDestino,
        LTRIM(RTRIM(@Titulo)), LTRIM(RTRIM(@Mensaje)), 'PENDIENTE', 0, GETDATE(), 1
      );

      COMMIT TRANSACTION;
      SELECT CONVERT(INT, SCOPE_IDENTITY()) AS IdNotificacion, 'Notificación registrada correctamente.' AS Mensaje;
      RETURN;
    END;

    IF @Accion NOT IN ('P', 'X')
      RAISERROR('La acción de mantenimiento no es válida.', 16, 1);

    IF NOT EXISTS (
      SELECT 1
      FROM dbo.Usuarios u
      INNER JOIN dbo.Roles r ON r.IdRol = u.IdRol
      WHERE u.IdUsuario = @IdUsuarioAdministrador
        AND u.Activo = 1
        AND r.Activo = 1
        AND LOWER(LTRIM(RTRIM(r.NombreRol))) = 'admin'
    )
      RAISERROR('El usuario indicado no tiene rol de administrador.', 16, 1);

    IF @Accion = 'X' AND NULLIF(LTRIM(RTRIM(@ObservacionAdministrador)), '') IS NULL
      RAISERROR('Debe indicar el motivo del rechazo.', 16, 1);

    DECLARE @IdBaja INT;
    SELECT @IdBaja = IdReferencia
    FROM dbo.Notificaciones WITH (UPDLOCK, ROWLOCK)
    WHERE IdNotificacion = @IdNotificacion
      AND TipoFicha = 'BAJA'
      AND EstadoAprobacion = 'PENDIENTE'
      AND Activo = 1;

    IF @IdBaja IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.BajasBienes WHERE IdBaja = @IdBaja)
      RAISERROR('La notificación está inactiva, ya fue respondida o su ficha no existe.', 16, 1);

    DECLARE @Estado VARCHAR(20) = CASE WHEN @Accion = 'P' THEN 'APROBADA' ELSE 'RECHAZADA' END;
    UPDATE dbo.Notificaciones
    SET EstadoAprobacion = @Estado,
        Leido = 1,
        FechaLectura = ISNULL(FechaLectura, GETDATE()),
        FechaRespuesta = GETDATE(),
        IdUsuarioRespondio = @IdUsuarioAdministrador,
        ObservacionAdministrador = CASE
          WHEN @Accion = 'X' THEN LTRIM(RTRIM(@ObservacionAdministrador))
          ELSE NULLIF(LTRIM(RTRIM(@ObservacionAdministrador)), '')
        END
    WHERE IdNotificacion = @IdNotificacion
      AND EstadoAprobacion = 'PENDIENTE'
      AND Activo = 1;

    IF @@ROWCOUNT = 0
      RAISERROR('La notificación ya fue respondida por otro administrador.', 16, 1);

    UPDATE dbo.BajasBienes SET EstadoAprobacion = @Estado WHERE IdBaja = @IdBaja;

    COMMIT TRANSACTION;
    SELECT CASE WHEN @Accion = 'P' THEN 'Ficha de baja aprobada correctamente.' ELSE 'Ficha de baja rechazada correctamente.' END AS Mensaje;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END;
