export function useInventoryService() {

  async function fetchItems(params = {}) {
    console.warn('[InventoryService] fetchItems stub', params)
    return []
  }

  async function fetchItemById(id) {
    console.warn('[InventoryService] fetchItemById stub', id)
    return null
  }

  async function createItem(data) {
    console.warn('[InventoryService] createItem stub', data)
    return null
  }

  async function updateItem(id, data) {
    console.warn('[InventoryService] updateItem stub', id, data)
    return null
  }

  async function deleteItem(id) {
    console.warn('[InventoryService] deleteItem stub', id)
    return null
  }

  async function addTransaction(txData) {
    console.warn('[InventoryService] addTransaction stub', txData)
    return null
  }

  async function fetchTransactions(itemId = null) {
    console.warn('[InventoryService] fetchTransactions stub', itemId)
    return []
  }

  async function fetchCategories() {
    console.warn('[InventoryService] fetchCategories stub')
    return []
  }

  async function createCategory(name) {
    console.warn('[InventoryService] createCategory stub', name)
    return null
  }

  return {
    fetchItems,
    fetchItemById,
    createItem,
    updateItem,
    deleteItem,
    addTransaction,
    fetchTransactions,
    fetchCategories,
    createCategory,
  }
}
