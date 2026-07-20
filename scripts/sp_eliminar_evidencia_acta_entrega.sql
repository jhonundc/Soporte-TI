USE [SoporteTI];
GO

CREATE OR ALTER PROCEDURE dbo.sp_EliminarEvidenciaActaEntrega
(
    @IdActaEntrega INT
)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.ActasEntrega WHERE IdActaEntrega = @IdActaEntrega)
    BEGIN
        RAISERROR('El acta de entrega no existe.', 16, 1);
        RETURN;
    END;

    UPDATE dbo.ActasEntrega
    SET EvidenciaFirma = NULL
    WHERE IdActaEntrega = @IdActaEntrega;

    SELECT 'Evidencia firmada eliminada correctamente.' AS Mensaje;
END;
GO
