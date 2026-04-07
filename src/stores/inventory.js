import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/database/db.js'
import { useNotificationsStore } from '@/stores/notifications.js'

export const useInventoryStore = defineStore('inventory', () => {
  const items         = ref([])
  const categories    = ref([])
  const transactions  = ref([])
  const isLoading     = ref(false)
  const error         = ref(null)
  const searchQuery   = ref('')
  const filterCategory = ref('')

  const filtered = computed(() => {
    let list = [...items.value]
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      list = list.filter(i => i.name?.toLowerCase().includes(q))
    }
    if (filterCategory.value)
      list = list.filter(i => String(i.category_id) === String(filterCategory.value))
    return list
  })

  const lowStockItems = computed(() =>
    items.value.filter(i => i.min_quantity > 0 && i.quantity <= i.min_quantity)
  )

  const totalValue = computed(() =>
    items.value.reduce((s, i) => s + (i.quantity * i.purchase_price), 0)
  )

  async function loadAll() {
    isLoading.value = true
    try {
      const [itemList, catList] = await Promise.all([
        db.inventory_items.orderBy('name').toArray(),
        db.inventory_categories.orderBy('name').toArray(),
      ])
      const catMap = Object.fromEntries(catList.map(c => [c.id, c.name]))
      items.value      = itemList.map(i => ({ ...i, category_name: catMap[i.category_id] ?? '' }))
      categories.value = catList
    } catch (e) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  async function loadTransactions(itemId = null) {
    let query = db.inventory_transactions.orderBy('transaction_date').reverse()
    if (itemId)
      query = db.inventory_transactions.where('item_id').equals(Number(itemId)).reverse()
    transactions.value = await query.limit(100).toArray()
  }

  async function getById(id) {
    return db.inventory_items.get(Number(id))
  }

  async function create(data, userId) {
    const now = new Date().toISOString()
    const id  = await db.inventory_items.add({
      name:           data.name,
      category_id:    data.category_id ? Number(data.category_id) : null,
      unit:           data.unit ?? 'قطعة',
      purchase_price: parseFloat(data.purchase_price ?? 0),
      selling_price:  parseFloat(data.selling_price ?? 0),
      quantity:       parseFloat(data.quantity ?? 0),
      min_quantity:   parseFloat(data.min_quantity ?? 0),
      notes:          data.notes ?? '',
      created_at:     now,
      updated_at:     now,
    })

    // تسجيل حركة الوارد الأول
    if (parseFloat(data.quantity) > 0) {
      await addTransaction({
        item_id:          id,
        transaction_type: 'purchase',
        quantity:         parseFloat(data.quantity),
        unit_price:       parseFloat(data.purchase_price ?? 0),
        total_amount:     parseFloat(data.quantity) * parseFloat(data.purchase_price ?? 0),
        notes:           'رصيد أولي',
        transaction_date: now.slice(0, 10),
        created_by:       userId,
      })
    }

    await loadAll()
    return id
  }

  async function update(id, data) {
    await db.inventory_items.update(Number(id), {
      name:           data.name,
      category_id:    data.category_id ? Number(data.category_id) : null,
      unit:           data.unit,
      purchase_price: parseFloat(data.purchase_price ?? 0),
      selling_price:  parseFloat(data.selling_price ?? 0),
      min_quantity:   parseFloat(data.min_quantity ?? 0),
      notes:          data.notes ?? '',
      updated_at:     new Date().toISOString(),
    })
    await loadAll()
  }

  async function remove(id) {
    await db.inventory_transactions.where('item_id').equals(Number(id)).delete()
    await db.inventory_items.delete(Number(id))
    await loadAll()
  }

  async function addTransaction(txData) {
    const now = new Date().toISOString()
    const id  = await db.inventory_transactions.add({
      ...txData,
      created_at: now,
    })

    // تحديث الرصيد
    const item = await db.inventory_items.get(txData.item_id)
    if (item) {
      let newQty = item.quantity
      if (['purchase'].includes(txData.transaction_type))   newQty += txData.quantity
      if (['sale','consumption'].includes(txData.transaction_type)) newQty -= txData.quantity
      if (txData.transaction_type === 'adjustment') newQty = txData.quantity

      await db.inventory_items.update(txData.item_id, {
        quantity:   Math.max(0, newQty),
        updated_at: now,
      })

      // تحقق من النقص
      if (newQty <= item.min_quantity && item.min_quantity > 0) {
        await useNotificationsStore().addNotification({
          title:   'تنبيه مخزون',
          message: `الرصيد المنخفض: ${item.name} - الكمية: ${newQty} ${item.unit}`,
          type:    'warning',
        })
      }
    }

    await loadAll()
    return id
  }

  async function createCategory(name) {
    const id = await db.inventory_categories.add({ name, created_at: new Date().toISOString() })
    await loadAll()
    return id
  }

  return {
    items, categories, transactions, isLoading, error,
    searchQuery, filterCategory,
    filtered, lowStockItems, totalValue,
    loadAll, loadTransactions, getById,
    create, update, remove, addTransaction, createCategory,
  }
})