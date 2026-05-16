export function useExpenseService() {

  async function fetchExpenses(params = {}) {
    console.warn('[ExpenseService] fetchExpenses stub', params)
    return []
  }

  async function fetchExpenseById(id) {
    console.warn('[ExpenseService] fetchExpenseById stub', id)
    return null
  }

  async function createExpense(data) {
    console.warn('[ExpenseService] createExpense stub', data)
    return null
  }

  async function updateExpense(id, data) {
    console.warn('[ExpenseService] updateExpense stub', id, data)
    return null
  }

  async function deleteExpense(id) {
    console.warn('[ExpenseService] deleteExpense stub', id)
    return null
  }

  async function fetchCategories() {
    console.warn('[ExpenseService] fetchCategories stub')
    return []
  }

  async function createCategory(name) {
    console.warn('[ExpenseService] createCategory stub', name)
    return null
  }

  return {
    fetchExpenses,
    fetchExpenseById,
    createExpense,
    updateExpense,
    deleteExpense,
    fetchCategories,
    createCategory,
  }
}
