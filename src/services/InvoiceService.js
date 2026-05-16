export function useInvoiceService() {

  async function fetchInvoices(params = {}) {
    console.warn('[InvoiceService] fetchInvoices stub', params)
    return []
  }

  async function fetchInvoiceById(id) {
    console.warn('[InvoiceService] fetchInvoiceById stub', id)
    return null
  }

  async function createFromReading(readingId, userId) {
    console.warn('[InvoiceService] createFromReading stub', readingId, userId)
    return null
  }

  async function applyPayment(invoiceId, amount, userId, paymentData = {}) {
    console.warn('[InvoiceService] applyPayment stub', invoiceId, amount, userId)
    return null
  }

  async function cancelInvoice(invoiceId) {
    console.warn('[InvoiceService] cancelInvoice stub', invoiceId)
    return null
  }

  async function recalculate(invoiceId, newConsumption) {
    console.warn('[InvoiceService] recalculate stub', invoiceId, newConsumption)
    return null
  }

  return {
    fetchInvoices,
    fetchInvoiceById,
    createFromReading,
    applyPayment,
    cancelInvoice,
    recalculate,
  }
}
