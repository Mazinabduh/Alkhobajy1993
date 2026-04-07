export function usePrintService() {

  function printElement(elementId) {
    const el = document.getElementById(elementId)
    if (!el) return

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>طباعة</title>
        <style>
          @font-face {
            font-family: 'Cairo';
            src: url('/fonts/Cairo-Regular.woff2') format('woff2');
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Cairo', sans-serif;
            direction: rtl;
            background: white;
            color: #1a1a1a;
          }
          @page { size: A4; margin: 15mm; }
        </style>
      </head>
      <body>${el.innerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  return { printElement }
}