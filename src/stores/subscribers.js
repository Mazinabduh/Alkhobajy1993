import { defineStore }  from 'pinia'
import { ref, computed } from 'vue'
import { db }           from '@/database/db.js'
import { useNotificationsStore } from '@/stores/notifications.js'

export const useSubscribersStore = defineStore('subscribers', () => {
  // ─── State ───────────────────────────────────
  const items      = ref([])
  const zones      = ref([])
  const isLoading  = ref(false)
  const error      = ref(null)
  const searchQuery  = ref('')
  const filterZone   = ref('')
  const filterStatus = ref('')
  const currentPage  = ref(1)
  const perPage      = ref(20)

  // ─── Getters ──────────────────────────────────
  const filtered = computed(() => {
    let list = [...items.value]

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      list = list.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.meter_number?.toLowerCase().includes(q)
      )
    }

    if (filterZone.value)
      list = list.filter(s => String(s.zone_id) === String(filterZone.value))

    if (filterStatus.value)
      list = list.filter(s => s.status === filterStatus.value)

    return list
  })

  const paginated = computed(() => {
    const start = (currentPage.value - 1) * perPage.value
    return filtered.value.slice(start, start + perPage.value)
  })

  const totalPages = computed(() =>
    Math.ceil(filtered.value.length / perPage.value)
  )

  const activeCount      = computed(() => items.value.filter(s => s.status === 'active').length)
  const disconnectedCount = computed(() => items.value.filter(s => s.status === 'disconnected').length)

  // ─── Actions ──────────────────────────────────

  async function loadAll() {
    isLoading.value = true
    error.value     = null
    try {
      const [subs, zoneList] = await Promise.all([
        db.subscribers.orderBy('name').toArray(),
        db.zones.orderBy('name').toArray(),
      ])
      // إضافة اسم المنطقة
      const zoneMap = Object.fromEntries(zoneList.map(z => [z.id, z.name]))
      items.value = subs.map(s => ({ ...s, zone_name: zoneMap[s.zone_id] ?? '' }))
      zones.value = zoneList
    } catch (e) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  async function getById(id) {
    const sub = await db.subscribers.get(Number(id))
    if (!sub) return null
    const zone = sub.zone_id ? await db.zones.get(sub.zone_id) : null
    const meter = await db.meters.where('subscriber_id').equals(sub.id).first()
    return { ...sub, zone_name: zone?.name ?? '', meter }
  }

  async function create(data, userId) {
    const now = new Date().toISOString()
    const id  = await db.subscribers.add({
      ...data,
      status:     data.status ?? 'active',
      balance:    parseFloat(data.balance ?? 0),
      deposit:    parseFloat(data.deposit ?? 0),
      created_by: userId,
      created_at: now,
      updated_at: now,
    })

    await useNotificationsStore().addNotification({
      title:   'مشترك جديد',
      message: `تم إضافة المشترك: ${data.name}`,
      type:    'success',
    })

    await loadAll()
    return id
  }

  async function update(id, data) {
    await db.subscribers.update(Number(id), {
      ...data,
      balance: parseFloat(data.balance ?? 0),
      deposit: parseFloat(data.deposit ?? 0),
      updated_at: new Date().toISOString(),
    })
    await loadAll()
  }

  async function remove(id) {
    // حذف متتالي: قراءات، فواتير، مدفوعات
    const readings = await db.readings.where('subscriber_id').equals(Number(id)).toArray()
    const invoices = await db.invoices.where('subscriber_id').equals(Number(id)).toArray()

    await db.payments.where('subscriber_id').equals(Number(id)).delete()
    await Promise.all(invoices.map(inv => db.invoices.delete(inv.id)))
    await Promise.all(readings.map(r  => db.readings.delete(r.id)))
    await db.subscribers.delete(Number(id))
    await loadAll()
  }

  async function setStatus(id, status) {
    await db.subscribers.update(Number(id), {
      status,
      updated_at: new Date().toISOString()
    })
    const sub = items.value.find(s => s.id === Number(id))
    if (sub) sub.status = status

    const label = status === 'active' ? 'تم تشغيل' : 'تم فصل'
    await useNotificationsStore().addNotification({
      title:   `${label} المشترك`,
      message: `${label}: ${sub?.name ?? ''}`,
      type:    status === 'active' ? 'success' : 'warning',
    })
  }

  async function updateBalance(id, amount) {
    const sub = await db.subscribers.get(Number(id))
    if (!sub) return
    const newBalance = (sub.balance ?? 0) + amount
    await db.subscribers.update(Number(id), {
      balance:    newBalance,
      updated_at: new Date().toISOString()
    })
    const item = items.value.find(s => s.id === Number(id))
    if (item) item.balance = newBalance
  }

  async function loadZones() {
    zones.value = await db.zones.orderBy('name').toArray()
  }

  async function createZone(name) {
    const id = await db.zones.add({ name, created_at: new Date().toISOString() })
    await loadZones()
    return id
  }

  async function deleteZone(id) {
    await db.zones.delete(id)
    await loadZones()
  }

  // الحساب التاريخي للمشترك
  async function getStatement(subscriberId) {
    const [invoices, payments] = await Promise.all([
      db.invoices
        .where('subscriber_id').equals(Number(subscriberId))
        .sortBy('created_at'),
      db.payments
        .where('subscriber_id').equals(Number(subscriberId))
        .sortBy('payment_date'),
    ])

    // دمج وترتيب زمني
    const merged = [
      ...invoices.map(inv => ({
        type:    'invoice',
        date:    inv.created_at,
        label:   `فاتورة ${inv.period_month ?? ''}`,
        amount:  inv.total_amount,
        status:  inv.status,
        id:      inv.id,
        data:    inv,
      })),
      ...payments.map(pay => ({
        type:   'payment',
        date:   pay.payment_date,
        label:  'سداد',
        amount: pay.amount,
        id:     pay.id,
        data:   pay,
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date))

    // حساب الرصيد المتراكم
    let runningBalance = 0
    return merged.map(item => {
      if (item.type === 'invoice') runningBalance += item.amount
      else                        runningBalance -= item.amount
      return { ...item, running_balance: runningBalance }
    })
  }

  function resetFilters() {
    searchQuery.value  = ''
    filterZone.value   = ''
    filterStatus.value = ''
    currentPage.value  = 1
  }

  return {
    items, zones, isLoading, error,
    searchQuery, filterZone, filterStatus, currentPage, perPage,
    filtered, paginated, totalPages, activeCount, disconnectedCount,
    loadAll, getById, create, update, remove, setStatus,
    updateBalance, loadZones, createZone, deleteZone,
    getStatement, resetFilters
  }
})