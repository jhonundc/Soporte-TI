USE [SoporteTI];
GO

CREATE OR ALTER PROCEDURE dbo.sp_EliminarEvidenciaBaja
(
    @IdBaja INT
)
AS
BEGIN
    SET NOCOUNT ON;

    IF @IdBaja IS NULL
    BEGIN
        RAISERROR('Debe ingresar el IdBaja.', 16, 1);
        RETURN;
    END;

    IF NOT EXISTS
    (
        SELECT 1
        FROM dbo.BajasBienes
        WHERE IdBaja = @IdBaja
    )
    BEGIN
        RAISERROR('La ficha de baja no existe.', 16, 1);
        RETURN;
    END;

    UPDATE dbo.BajasBienes
    SET EvidenciaFirma = NULL
    WHERE IdBaja = @IdBaja;

    SELECT 'Evidencia de firma eliminada correctamente.' AS Mensaje;
END;
GO
