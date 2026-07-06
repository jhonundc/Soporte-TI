/** Estilos globales para imprimir contenido desde un Dialog (oculta shell de la app). */
export function DialogPrintStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page { size: A4 portrait; margin: 1cm; }
          body > * { display: none !important; }
          body > [data-radix-portal],
          body > div:has([role="dialog"]) { display: block !important; }
          html, body {
            background: white !important;
            height: auto !important;
            width: 100% !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .bg-black\\/80,
          .bg-background\\/80,
          [data-state="open"] > .fixed.inset-0,
          div[class*="fixed inset-0 z-50"] { display: none !important; }
          [role="dialog"] {
            display: block !important;
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            transform: none !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .print\\:hidden, button { display: none !important; }
        }
      `,
      }}
    />
  );
}
