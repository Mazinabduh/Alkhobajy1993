import { ref } from 'vue'

export function usePrint() {
  const isPrinting = ref(false)
  const printError = ref(null)

  function printElement(elementId) {
    const el = document.getElementById(elementId)
    if (!el) {
      printError.value = `Element #${elementId} not found`
      return
    }

    isPrinting.value = true
    printError.value = null

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>طباعة</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Cairo', sans-serif; direction: rtl; background: white; color: #1a1a1a; }
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
      isPrinting.value = false
    }, 500)
  }

  function printCurrentPage() {
    isPrinting.value = true
    window.print()
    isPrinting.value = false
  }

  return {
    isPrinting,
    printError,
    printElement,
    printCurrentPage,
  }
}
