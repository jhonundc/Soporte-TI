import { notify } from "@/lib/feedback/toast";

export function openPrintWindow(htmlContent: string, windowName: string): boolean {
  const printWindow = window.open("", windowName, "width=900,height=1200");
  if (!printWindow) {
    notify.warning(
      "No se pudo abrir la ventana de impresión. Verifique el bloqueador de ventanas emergentes."
    );
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
    setTimeout(() => printWindow.close(), 500);
  };
  return true;
}
