USE [SoporteTI];
GO

IF COL_LENGTH('dbo.SoporteTecnico', 'EvidenciaFirma') IS NULL
BEGIN
    ALTER TABLE dbo.SoporteTecnico ADD EvidenciaFirma VARCHAR(500) NULL;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_GuardarEvidenciaSoporte
(
    @IdSoporte INT,
    @EvidenciaFirma VARCHAR(500)
)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.SoporteTecnico WHERE IdSoporte = @IdSoporte)
    BEGIN
        RAISERROR('La ficha de soporte no existe.', 16, 1);
        RETURN;
    END;

    IF NULLIF(LTRIM(RTRIM(@EvidenciaFirma)), '') IS NULL
    BEGIN
        RAISERROR('Debe ingresar la ruta de la imagen de evidencia.', 16, 1);
        RETURN;
    END;

    UPDATE dbo.SoporteTecnico
    SET EvidenciaFirma = LTRIM(RTRIM(@EvidenciaFirma))
    WHERE IdSoporte = @IdSoporte;

    SELECT 'Evidencia de firma guardada correctamente.' AS Mensaje;
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_EliminarEvidenciaSoporte
(
    @IdSoporte INT
)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.SoporteTecnico WHERE IdSoporte = @IdSoporte)
    BEGIN
        RAISERROR('La ficha de soporte no existe.', 16, 1);
        RETURN;
    END;

    UPDATE dbo.SoporteTecnico
    SET EvidenciaFirma = NULL
    WHERE IdSoporte = @IdSoporte;

    SELECT 'Evidencia de firma eliminada correctamente.' AS Mensaje;
END;
GO
