import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export function useExportService() {

  // ─── TXT ──────────────────────────────────────
  function exportTxtInvoice(invoice, settings) {
    const lines = [
      '═'.repeat(40),
      centerText(settings.stationName, 40),
      centerText('فاتورة كهرباء', 40),
      '═'.repeat(40),
      '',
      `رقم الفاتورة : ${invoice.invoice_number}`,
      `التاريخ      : ${formatDate(invoice.created_at)}`,
      `الفترة       : ${invoice.period_month}`,
      '',
      '─'.repeat(40),
      'بيانات المشترك:',
      `الاسم        : ${invoice.subscriber?.name}`,
      `رقم الهاتف   : ${invoice.subscriber?.phone || '—'}`,
      `رقم العداد   : ${invoice.subscriber?.meter_number}`,
      '',
      '─'.repeat(40),
      'تفاصيل الاستهلاك:',
      `القراءة السابقة : ${invoice.reading?.previous_reading ?? 0}`,
      `القراءة الجديدة : ${invoice.reading?.current_reading ?? 0}`,
      `الاستهلاك       : ${invoice.consumption} كيلوواط`,
      `سعر الوحدة      : ${settings.unitPrice} ${settings.currency}`,
      '',
      '─'.repeat(40),
      'الملخص المالي:',
    ]

    if (invoice.previous_balance > 0)
      lines.push(`متأخرات سابقة   : ${invoice.previous_balance} ${settings.currency}`)

    lines.push(
      `استهلاك الشهر  : ${invoice.consumption_amount} ${settings.currency}`,
    )

    if (invoice.tax > 0)
      lines.push(`الضريبة         : ${invoice.tax} ${settings.currency}`)

    lines.push(
      `─`.repeat(40),
      `الإجمالي        : ${invoice.total_amount} ${settings.currency}`,
    )

    if (invoice.paid_amount > 0)
      lines.push(`المدفوع         : ${invoice.paid_amount} ${settings.currency}`)

    if (invoice.remaining_amount > 0)
      lines.push(`المتبقي         : ${invoice.remaining_amount} ${settings.currency}`)

    lines.push(
      '',
      '═'.repeat(40),
      centerText(settings.footerMessage, 40),
      centerText(settings.stationName, 40),
      '═'.repeat(40),
    )

    const content = lines.join('\n')
    downloadFile(content, `فاتورة-${invoice.invoice_number}.txt`, 'text/plain;charset=utf-8')
  }

  // ─── PDF ──────────────────────────────────────
  function exportPdfInvoice(invoice, settings) {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })

    // إعداد الاتجاه RTL
    doc.setR2L(true)
    doc.setFont('helvetica')

    // رأس
    doc.setFontSize(18)
    doc.setTextColor(30, 64, 175)
    doc.text(settings.stationName, 105, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.setTextColor(100, 116, 139)
    doc.text('فاتورة كهرباء', 105, 28, { align: 'center' })

    // خط فاصل
    doc.setDrawColor(30, 64, 175)
    doc.setLineWidth(0.5)
    doc.line(15, 32, 195, 32)

    // معلومات الفاتورة
    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    doc.text(`رقم الفاتورة: ${invoice.invoice_number}`, 195, 40, { align: 'right' })
    doc.text(`التاريخ: ${formatDate(invoice.created_at)}`, 195, 46, { align: 'right' })
    doc.text(`الفترة: ${invoice.period_month}`, 195, 52, { align: 'right' })

    // بيانات المشترك
    doc.setFontSize(11)
    doc.setTextColor(30, 64, 175)
    doc.text('بيانات المشترك', 15, 62)

    doc.setFontSize(10)
    doc.setTextColor(71, 85, 105)
    doc.text(`الاسم: ${invoice.subscriber?.name}`,         15, 70)
    doc.text(`الهاتف: ${invoice.subscriber?.phone || '—'}`, 15, 76)
    doc.text(`العداد: ${invoice.subscriber?.meter_number}`, 15, 82)

    // جدول الاستهلاك
    autoTable(doc, {
      startY: 90,
      head:  [['البيان', 'القراءة السابقة', 'القراءة الجديدة', 'الاستهلاك', 'السعر', 'المبلغ']],
      body:  [[
        'استهلاك الكهرباء',
        String(invoice.reading?.previous_reading ?? 0),
        String(invoice.reading?.current_reading ?? 0),
        `${invoice.consumption} كيلوواط`,
        `${settings.unitPrice} ${settings.currency}`,
        `${invoice.consumption_amount} ${settings.currency}`,
      ]],
      styles:       { font: 'helvetica', fontSize: 9, halign: 'right' },
      headStyles:   { fillColor: [30, 64, 175], textColor: 255 },
      alternateRowStyles: { fillColor: [241, 245, 249] },
    })

    const finalY = doc.lastAutoTable.finalY + 10

    // الملخص المالي
    const summaryRows = [
      [`الاستهلاك ${invoice.period_month}`, `${invoice.consumption_amount} ${settings.currency}`],
    ]

    if (invoice.previous_balance > 0)
      summaryRows.push(['متأخرات سابقة', `${invoice.previous_balance} ${settings.currency}`])

    if (invoice.tax > 0)
      summaryRows.push(['الضريبة', `${invoice.tax} ${settings.currency}`])

    summaryRows.push(['الإجمالي المستحق', `${invoice.total_amount} ${settings.currency}`])

    if (invoice.paid_amount > 0)
      summaryRows.push(['المدفوع', `${invoice.paid_amount} ${settings.currency}`])

    if (invoice.remaining_amount > 0)
      summaryRows.push(['المتبقي', `${invoice.remaining_amount} ${settings.currency}`])

    autoTable(doc, {
      startY: finalY,
      body:   summaryRows,
      styles: { font: 'helvetica', fontSize: 10, halign: 'right' },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [71, 85, 105] },
        1: { fontStyle: 'bold', textColor: [30, 41, 59] },
      },
      tableWidth: 100,
      margin:     { right: 15 },
    })

    // تذييل
    const pageH = doc.internal.pageSize.height
    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184)
    doc.text(settings.footerMessage, 105, pageH - 20, { align: 'center' })
    doc.text(settings.stationName,   105, pageH - 14, { align: 'center' })

    doc.save(`فاتورة-${invoice.invoice_number}.pdf`)
  }

  // ─── Excel ────────────────────────────────────
  function exportExcel(data, filename, headers, sheetName = 'البيانات') {
    const ws = XLSX.utils.json_to_sheet(
      data.map(row => {
        const mapped = {}
        headers.forEach(h => { mapped[h.label] = row[h.key] ?? '' })
        return mapped
      })
    )

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, `${filename}.xlsx`)
  }

  // ─── JSON ─────────────────────────────────────
  function exportJson(data, filename) {
    const json = JSON.stringify(data, null, 2)
    downloadFile(json, `${filename}.json`, 'application/json')
  }

  // ─── Helpers ──────────────────────────────────
  function downloadFile(content, filename, mimeType) {
    const blob = new Blob(['\uFEFF' + content], { type: mimeType })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('ar-SA', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    })
  }

  function centerText(text, width) {
    const pad = Math.max(0, Math.floor((width - text.length) / 2))
    return ' '.repeat(pad) + text
  }

  return {
    exportTxtInvoice,
    exportPdfInvoice,
    exportExcel,
    exportJson,
    downloadFile,
  }
}