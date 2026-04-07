import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/database/db.js'

export const useExpensesStore = defineStore('expenses', () => {
  const items      = ref([])
  const categories = ref([])
  const isLoading  = ref(false)
  const error      = ref(null)
  const filterCategory = ref('')
  const filterMonth    = ref('')

  const filtered = computed(() => {
    let list = [...items.value]
    if (filterCategory.value)
      list = list.filter(e => String(e.category_id) === String(filterCategory.value))
    if (filterMonth.value)
      list = list.filter(e => e.expense_date?.startsWith(filterMonth.value))
    return list
  })

  const totalAmount = computed(() =>
    filtered.value.reduce((s, e) => s + (e.amount ?? 0), 0)
  )

  const byCategory = computed(() => {
    const map = {}
    for (const e of filtered.value) {
      const key = e.category_name ?? 'أخرى'
      map[key] = (map[key] ?? 0) + (e.amount ?? 0)
    }
    return map
  })

  async function loadAll() {
    isLoading.value = true
    try {
      const [expList, catList] = await Promise.all([
        db.expenses.orderBy('expense_date').reverse().toArray(),
        db.expense_categories.orderBy('name').toArray(),
      ])
      const catMap   = Object.fromEntries(catList.map(c => [c.id, c.name]))
      items.value      = expList.map(e => ({ ...e, category_name: catMap[e.category_id] ?? '' }))
      categories.value = catList
    } catch (e) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  async function getById(id) {
    return db.expenses.get(Number(id))
  }

  async function create(data, userId) {
    const now = new Date().toISOString()
    const id  = await db.expenses.add({
      category_id:      data.category_id ? Number(data.category_id) : null,
      description:      data.description,
      amount:           parseFloat(data.amount),
      expense_date:     data.expense_date ?? now.slice(0, 10),
      reference_number: data.reference_number ?? '',
      notes:            data.notes ?? '',
      created_by:       userId,
      created_at:       now,
      updated_at:       now,
    })
    await loadAll()
    return id
  }

  async function update(id, data) {
    await db.expenses.update(Number(id), {
      category_id:      data.category_id ? Number(data.category_id) : null,
      description:      data.description,
      amount:           parseFloat(data.amount),
      expense_date:     data.expense_date,
      reference_number: data.reference_number ?? '',
      notes:            data.notes ?? '',
      updated_at:       new Date().toISOString(),
    })
    await loadAll()
  }

  async function remove(id) {
    await db.expenses.delete(Number(id))
    await loadAll()
  }

  async function createCategory(name) {
    const id = await db.expense_categories.add({ name, created_at: new Date().toISOString() })
    await loadAll()
    return id
  }

  return {
    items, categories, isLoading, error,
    filterCategory, filterMonth,
    filtered, totalAmount, byCategory,
    loadAll, getById, create, update, remove, createCategory,
  }
})