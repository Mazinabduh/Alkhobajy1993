export function useReportService() {

  async function generateReport(type, params = {}) {
    console.warn('[ReportService] generateReport stub', type, params)
    return { data: [], summary: {} }
  }

  async function fetchMonthlySummary(month) {
    console.warn('[ReportService] fetchMonthlySummary stub', month)
    return { totalRevenue: 0, totalExpenses: 0, totalConsumption: 0, invoiceCount: 0 }
  }

  async function fetchSubscriberReport(subscriberId) {
    console.warn('[ReportService] fetchSubscriberReport stub', subscriberId)
    return { invoices: [], payments: [], readings: [] }
  }

  async function fetchFinancialReport(params = {}) {
    console.warn('[ReportService] fetchFinancialReport stub', params)
    return { income: 0, expenses: 0, net: 0, details: [] }
  }

  async function fetchConsumptionReport(params = {}) {
    console.warn('[ReportService] fetchConsumptionReport stub', params)
    return { totalConsumption: 0, averageConsumption: 0, details: [] }
  }

  return {
    generateReport,
    fetchMonthlySummary,
    fetchSubscriberReport,
    fetchFinancialReport,
    fetchConsumptionReport,
  }
}
