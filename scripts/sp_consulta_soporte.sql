USE [SoporteTI];
GO

CREATE OR ALTER PROCEDURE dbo.sp_ConsultaSoporte
(
    @Accion CHAR(1),
    @IdSoporte INT = NULL,
    @NumeroFicha VARCHAR(50) = NULL,
    @IdBien INT = NULL,
    @Responsable VARCHAR(150) = NULL,
    @Dependencia VARCHAR(150) = NULL,
    @Ambiente VARCHAR(150) = NULL,
    @IdPrioridad INT = NULL,
    @EstadoTicket VARCHAR(50) = NULL,
    @IdUsuarioSoporte INT = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    IF @Accion = 'L'
    BEGIN
        SELECT * FROM dbo.SoporteTecnico ORDER BY FechaRegistro DESC;
        RETURN;
    END;

    IF @Accion = 'I'
    BEGIN
        SELECT * FROM dbo.SoporteTecnico WHERE IdSoporte = @IdSoporte;
        RETURN;
    END;

    IF @Accion = 'F'
    BEGIN
        SELECT * FROM dbo.SoporteTecnico
        WHERE NumeroFicha LIKE '%' + ISNULL(@NumeroFicha, '') + '%'
        ORDER BY FechaRegistro DESC;
        RETURN;
    END;

    IF @Accion = 'B'
    BEGIN
        SELECT * FROM dbo.SoporteTecnico WHERE IdBien = @IdBien ORDER BY FechaRegistro DESC;
        RETURN;
    END;

    IF @Accion = 'R'
    BEGIN
        SELECT * FROM dbo.SoporteTecnico
        WHERE Responsable LIKE '%' + ISNULL(@Responsable, '') + '%'
        ORDER BY FechaRegistro DESC;
        RETURN;
    END;

    IF @Accion = 'D'
    BEGIN
        SELECT * FROM dbo.SoporteTecnico
        WHERE Dependencia LIKE '%' + ISNULL(@Dependencia, '') + '%'
        ORDER BY FechaRegistro DESC;
        RETURN;
    END;

    IF @Accion = 'A'
    BEGIN
        SELECT * FROM dbo.SoporteTecnico
        WHERE Ambiente LIKE '%' + ISNULL(@Ambiente, '') + '%'
        ORDER BY FechaRegistro DESC;
        RETURN;
    END;

    IF @Accion = 'P'
    BEGIN
        SELECT * FROM dbo.SoporteTecnico WHERE IdPrioridad = @IdPrioridad ORDER BY FechaRegistro DESC;
        RETURN;
    END;

    IF @Accion = 'E'
    BEGIN
        SELECT * FROM dbo.SoporteTecnico
        WHERE EstadoTicket LIKE '%' + ISNULL(@EstadoTicket, '') + '%'
        ORDER BY FechaRegistro DESC;
        RETURN;
    END;

    IF @Accion = 'U'
    BEGIN
        SELECT * FROM dbo.SoporteTecnico WHERE IdUsuarioSoporte = @IdUsuarioSoporte ORDER BY FechaRegistro DESC;
        RETURN;
    END;

    IF @Accion = 'O'
    BEGIN
        SELECT * FROM dbo.SoporteTecnico WHERE EstadoTicket <> 'Cerrado' ORDER BY FechaRegistro DESC;
        RETURN;
    END;

    IF @Accion = 'C'
    BEGIN
        SELECT * FROM dbo.SoporteTecnico WHERE EstadoTicket = 'Cerrado' ORDER BY FechaRegistro DESC;
        RETURN;
    END;

    IF @Accion = 'V'
    BEGIN
        SELECT * FROM dbo.SoporteTecnico
        WHERE NULLIF(LTRIM(RTRIM(EvidenciaFirma)), '') IS NOT NULL
        ORDER BY FechaRegistro DESC;
        RETURN;
    END;

    IF @Accion = 'S'
    BEGIN
        SELECT * FROM dbo.SoporteTecnico
        WHERE NULLIF(LTRIM(RTRIM(EvidenciaFirma)), '') IS NULL
        ORDER BY FechaRegistro DESC;
        RETURN;
    END;

    RAISERROR('La acción indicada no es válida.', 16, 1);
END;
GO
