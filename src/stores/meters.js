import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/database/db.js'

export const useMetersStore = defineStore('meters', () => {
  const items     = ref([])
  const isLoading = ref(false)
  const error     = ref(null)
  const filterStatus = ref('')

  const filtered = computed(() => {
    if (!filterStatus.value) return items.value
    return items.value.filter(m => m.status === filterStatus.value)
  })

  const availableCount = computed(() => items.value.filter(m => m.status === 'available').length)
  const installedCount = computed(() => items.value.filter(m => m.status === 'installed').length)
  const damagedCount   = computed(() => items.value.filter(m => m.status === 'damaged').length)

  async function loadAll() {
    isLoading.value = true
    try {
      const list = await db.meters.orderBy('serial_number').toArray()
      const withSubs = await Promise.all(list.map(async m => {
        const sub = m.subscriber_id ? await db.subscribers.get(m.subscriber_id) : null
        return { ...m, subscriber_name: sub?.name ?? '' }
      }))
      items.value = withSubs
    } catch (e) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  async function getById(id) {
    return db.meters.get(Number(id))
  }

  async function create(data, userId) {
    const now = new Date().toISOString()
    const id  = await db.meters.add({
      serial_number:  data.serial_number,
      brand:          data.brand ?? '',
      model:          data.model ?? '',
      meter_type:     data.meter_type ?? 'single',
      capacity:       parseFloat(data.capacity ?? 0),
      status:         data.status ?? 'available',
      subscriber_id:  data.subscriber_id ? Number(data.subscriber_id) : null,
      install_date:   data.install_date ?? null,
      price:          parseFloat(data.price ?? 0),
      is_paid:        data.is_paid ? 1 : 0,
      notes:          data.notes ?? '',
      created_at:     now,
      updated_at:     now,
    })
    await loadAll()
    return id
  }

  async function update(id, data) {
    await db.meters.update(Number(id), {
      serial_number:  data.serial_number,
      brand:          data.brand ?? '',
      model:          data.model ?? '',
      meter_type:     data.meter_type ?? 'single',
      capacity:       parseFloat(data.capacity ?? 0),
      status:         data.status,
      subscriber_id:  data.subscriber_id ? Number(data.subscriber_id) : null,
      install_date:   data.install_date ?? null,
      price:          parseFloat(data.price ?? 0),
      is_paid:        data.is_paid ? 1 : 0,
      notes:          data.notes ?? '',
      updated_at:     new Date().toISOString(),
    })
    await loadAll()
  }

  async function remove(id) {
    await db.meters.delete(Number(id))
    await loadAll()
  }

  async function assignToSubscriber(meterId, subscriberId, installDate) {
    await db.meters.update(Number(meterId), {
      subscriber_id: Number(subscriberId),
      status:        'installed',
      install_date:  installDate ?? new Date().toISOString().slice(0, 10),
      updated_at:    new Date().toISOString(),
    })
    await loadAll()
  }

  async function unassign(meterId) {
    await db.meters.update(Number(meterId), {
      subscriber_id: null,
      status:       'available',
      install_date:  null,
      updated_at:   new Date().toISOString(),
    })
    await loadAll()
  }

  return {
    items, isLoading, error, filterStatus,
    filtered, availableCount, installedCount, damagedCount,
    loadAll, getById, create, update, remove,
    assignToSubscriber, unassign,
  }
})