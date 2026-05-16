import { ref } from 'vue'

export function useExport() {
  const isExporting = ref(false)
  const exportError = ref(null)

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob(['\uFEFF' + content], { type: mimeType })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportJSON(data, filename = 'export') {
    isExporting.value = true
    exportError.value = null
    try {
      const json = JSON.stringify(data, null, 2)
      downloadFile(json, `${filename}.json`, 'application/json')
    } catch (e) {
      exportError.value = e.message
    } finally {
      isExporting.value = false
    }
  }

  function exportCSV(data, filename = 'export', headers = null) {
    isExporting.value = true
    exportError.value = null
    try {
      const keys = headers ? headers.map(h => h.key) : (data[0] ? Object.keys(data[0]) : [])
      const headerRow = headers ? headers.map(h => h.label).join(',') : keys.join(',')
      const rows = data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))
      const csv = [headerRow, ...rows].join('\n')
      downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8')
    } catch (e) {
      exportError.value = e.message
    } finally {
      isExporting.value = false
    }
  }

  function exportExcel(data, filename, headers, sheetName = 'Sheet1') {
    console.warn('[useExport] exportExcel stub — install xlsx for full support', filename)
    exportCSV(data, filename, headers)
  }

  return {
    isExporting,
    exportError,
    downloadFile,
    exportJSON,
    exportCSV,
    exportExcel,
  }
}
