import { openPrintWindow } from "@/lib/print/open-print-window";
import type { FichaSoporteRecord } from "@/features/soporte/ficha/types";

export function printFichaSoporte(ficha: FichaSoporteRecord) {
    const checkedBox = `<span style="display:inline-block;width:14px;height:14px;border:2px solid #2563eb;background:#2563eb;border-radius:3px;text-align:center;line-height:14px;color:white;font-size:10px;vertical-align:middle;">✔</span>`;
    const uncheckedBox = `<span style="display:inline-block;width:14px;height:14px;border:2px solid #94a3b8;background:white;border-radius:3px;vertical-align:middle;"></span>`;

    const tipoBien = (ficha.TipoBien || "").toLowerCase();
    const condicion = (ficha.Condicion?.Condicion || "").toLowerCase();
    const estado = (ficha.Estado?.EstadoBien || "").toLowerCase();

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Ficha de Soporte Técnico</title>

<style>

@page{
    size: A4 portrait;
    margin: 12mm;
}

*{
    box-sizing: border-box;
}

html, body {
    width: 100%;
    margin: 0;
    padding: 0;
}

body{
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10px;
    color:#000;
    margin:0;
    padding:0;
}

.container{
    width:100%;
    max-width:792px;
    margin:0 auto;
    padding:0 6px;
}

.page-header{
    position:relative;
    padding-top:8px;
    margin-bottom:10px;
    display:grid;
    grid-template-columns:70px 1fr 140px;
    gap:12px;
    align-items:start;
}

.logo-left,
.logo-right{
    width:70px;
    height:70px;
}

.logo-left img,
.logo-right img{
    width:100%;
    height:100%;
    object-fit:contain;
}

.header-center{
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    gap:4px;
    text-align:center;
}

.right-column{
    display:flex;
    flex-direction:column;
    align-items:flex-end;
    gap:8px;
}

.date-box{
    border:2px solid #000;
    padding:8px 10px;
    width:140px;
    text-align:center;
    line-height:1.2;
}

.date-box .label{
    font-size:9px;
    font-weight:bold;
    margin-bottom:4px;
}

.date-box .value{
    font-size:12px;
}

.subtitle{
    font-size:10px;
    font-weight:bold;
    text-transform:uppercase;
    letter-spacing:0.02em;
}

.titulo{
    text-align:center;
    font-weight:bold;
    font-size:18px;
    margin-bottom:4px;
    line-height:1.1;
}

.corner-icon{
    position:absolute;
    display:flex;
    align-items:center;
    justify-content:center;
}

.top-left{
    width:70px;
    height:70px;
    top:0;
    left:0;
}

.top-right{
    width:70px;
    height:70px;
    top:0;
    right:0;
}

.corner-icon img{
    width:100%;
    height:100%;
    object-fit:contain;
}

.info-table{
    width:100%;
    border-collapse:collapse;
    margin-top:4px;
}

.info-table td{
    border:1px solid #000;
    padding:6px;
}

.info-table .label-cell{
    width:24%;
    font-weight:bold;
    background:#f3f4f6;
}

.info-table .value-cell{
    width:76%;
}

table{
    width:100%;
    border-collapse:collapse;
    line-height:1.2;
    page-break-inside:avoid;
}

td,
th{
    border:1px solid #000;
    padding:5px;
    vertical-align:middle;
}

.seccion{
    margin-top:10px;
    margin-bottom:4px;
    font-weight:bold;
    line-height:1.2;
}

.recuadro{
    border:2px solid #000;
    min-height:50px;
    padding:10px;
    line-height:1.2;
    page-break-inside:avoid;
}

.firmas{
    margin-top:56px;
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:12px;
    page-break-inside:avoid;
}

.firma{
    width:32%;
    text-align:center;
    display:flex;
    flex-direction:column;
    justify-content:flex-end;
}

.firma-line{
    border-top:1px solid #000;
    margin-top:22px;
    padding-top:6px;
    min-height:50px;
    display:flex;
    flex-direction:column;
    justify-content:flex-end;
    gap:4px;
}

.firma-text{
    font-weight:bold;
    font-size:9px;
    line-height:1.2;
}

.fecha{
    width:100px;
    text-align:center;
    font-weight:bold;
    line-height:1.2;
}

.sin-borde{
    border:none !important;
}

.caja{
    width:14px;
    height:14px;
    border:2px solid #000;
    display:inline-block;
    vertical-align:middle;
    margin-left:6px;
}

.texto-centro{
    text-align:center;
}

.linea{
    border-top:1px solid #000;
    padding-top:5px;
    min-height:60px;
}

.footer{
    margin-top:24px;
}

@media print{

    @page{
        size: A4 portrait;
        margin: 12mm;
    }

    .no-print{
        display:none !important;
    }

    body{
        margin:0;
        padding:0;
    }

    .container{
        width:100%;
        max-width:792px;
    }
}

</style>
</head>

<body>

<div class="container">

    <div class="page-header">
      <div class="logo-left"><img src="/logo1.png" alt="Logo 1" /></div>
      <div class="header-center">
        <div class="titulo">FICHA DE SOPORTE TECNICO</div>
      </div>
      <div class="right-column">
        <div class="logo-right"><img src="/logo2.png" alt="Logo 2" /></div>
        <div class="date-box">
          <div class="label">FECHA</div>
          <div class="value">${ficha.FechaRegistro ? new Date(ficha.FechaRegistro).toLocaleDateString() : ''}</div>
        </div>
      </div>
    </div>

    <table class="info-table">
        <tr>
            <td class="label-cell">Unidad Organica :</td>
            <td class="value-cell">${ficha.UnidadOrganica || ''}</td>
        </tr>
    </table>

    <!-- RESPONSABLE -->

    <div class="seccion">
        USUARIO RESPONSABLE DEL BIEN:
    </div>

    <table>

        <tr>
            <td style="width:15%;">
                <b>Responsable:</b>
            </td>
            <td>${ficha.Responsable || ''}</td>
        </tr>

        <tr>
            <td>
                <b>Dependencia:</b>
            </td>
            <td>${ficha.Dependencia || ''}</td>
        </tr>

        <tr>
            <td>
                <b>Ambiente:</b>
            </td>
            <td>${ficha.Ambiente || ''}</td>
        </tr>

    </table>

    <!-- TIPO DE BIEN -->

    <div class="seccion">
        I. TIPO DEL BIEN
    </div>

    <table>
        <tr>

            <td class="sin-borde">
                a) Informático
                <span class="caja">${tipoBien === 'informático' || tipoBien === 'informatico' ? '✔' : ''}</span>
            </td>

            <td class="sin-borde">
                b) Comunicación
                <span class="caja">${tipoBien === 'comunicación' || tipoBien === 'comunicacion' ? '✔' : ''}</span>
            </td>

            <td class="sin-borde">
                c) Eléctrico
                <span class="caja">${tipoBien === 'eléctrico' || tipoBien === 'electrico' ? '✔' : ''}</span>
            </td>

        </tr>
    </table>

    <!-- DETALLE TECNICO -->

    <div class="seccion">
        II. DETALLE TECNICO
    </div>

    <table>

        <tr>

            <th rowspan="2" style="width:16%;">
                CODIGO DE INVENTARIO
            </th>

            <th rowspan="2" style="width:16%;">
                CODIGO PATRIMONIAL
            </th>

            <th rowspan="2" style="width:22%;">
                DESCRIPCION
            </th>

            <th colspan="3">
                DETALLE TECNICO
            </th>

        </tr>

        <tr>

            <th>MARCA</th>
            <th>MODELO</th>
            <th>SERIE</th>

        </tr>

        <tr>

            <td style="height:50px;">${ficha.Bien?.CodigoInventario || ''}</td>
            <td>${ficha.Bien?.CodigoPatrimonial || ''}</td>
            <td>${ficha.Bien?.Descripcion || ''}</td>
            <td>${ficha.Bien?.Marca?.Marca || ''}</td>
            <td>${ficha.Bien?.Modelo?.Modelo || ''}</td>
            <td>${ficha.Bien?.NumeroSerie || ''}</td>

        </tr>

    </table>

    <!-- CONDICION -->

    <div class="seccion">
        III. CONDICION DEL BIEN
    </div>

    <table>

        <tr>
            <td class="sin-borde">
                Operativo
                <span class="caja">${condicion === 'operativo' ? '✔' : ''}</span>
            </td>
        </tr>

        <tr>
            <td class="sin-borde">
                Inoperativo
                <span class="caja">${condicion === 'inoperativo' ? '✔' : ''}</span>
            </td>
        </tr>

    </table>

    <!-- ESTADO -->

    <div class="seccion">
        IV. ESTADO DEL BIEN
    </div>

    <table>

        <tr>

            <td class="sin-borde">
                Bueno
                <span class="caja">${estado === 'bueno' ? '✔' : ''}</span>
            </td>

            <td class="sin-borde">
                Regular
                <span class="caja">${estado === 'regular' ? '✔' : ''}</span>
            </td>

            <td class="sin-borde">
                Malo por reparar
                <span class="caja">${estado === 'reparar' ? '✔' : ''}</span>
            </td>

            <td class="sin-borde">
                Malo para baja
                <span class="caja">${estado === 'baja' ? '✔' : ''}</span>
            </td>

        </tr>

    </table>

    <!-- TRABAJOS -->

    <div class="seccion">
        V. TRABAJOS REALIZADOS
    </div>

    <div class="recuadro">

        ${ficha.TrabajosRealizados || ''}

    </div>

    <!-- DIAGNOSTICO -->

    <div class="seccion">
        VI. DIAGNOSTICO
    </div>

    <div class="recuadro">

        ${ficha.Diagnostico || ''}

    </div>

    <!-- RECOMENDACION -->

    <div class="seccion">
        VII. RECOMENDACIÓN
    </div>

    <div class="recuadro">

        ${ficha.Recomendacion || ''}

    </div>

    <!-- FIRMAS -->

    <div class="firmas">

        <div class="firma">
            <div class="firma-line">
                <span class="firma-text">RESPONSABLE DE SOPORTE TECNICO</span>
            </div>
        </div>

        <div class="firma">
            <div class="firma-line">
                <span class="firma-text">JEFE UNIDAD DE ESTADISTICA E INFORMATICA</span>
            </div>
        </div>

        <div class="firma">
            <div class="firma-line">
                <span class="firma-text">AREA USUARIA</span>
            </div>
        </div>

    </div>

    <div class="footer">
        &nbsp;
    </div>

</div>

</body>
</html>`;

    openPrintWindow(htmlContent, "FichaDeSoporte");
  };
