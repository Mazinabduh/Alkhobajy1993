import { defineStore } from 'pinia'
import { ref }         from 'vue'
import { db }          from '@/database/db.js'
import { useInvoicesStore }     from '@/stores/invoices.js'
import { useNotificationsStore } from '@/stores/notifications.js'

export const useReadingsStore = defineStore('readings', () => {
  const items     = ref([])
  const isLoading = ref(false)
  const error     = ref(null)

  async function loadAll(subscriberId = null) {
    isLoading.value = true
    try {
      let query = db.readings.orderBy('reading_date').reverse()
      if (subscriberId)
        query = db.readings.where('subscriber_id').equals(Number(subscriberId)).reverse()

      const list = await query.limit(100).toArray()

      // إضافة اسم المشترك
      const withNames = await Promise.all(list.map(async r => {
        const sub = await db.subscribers.get(r.subscriber_id)
        return { ...r, subscriber_name: sub?.name ?? '' }
      }))

      items.value = withNames
    } catch (e) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  async function getLastReading(subscriberId) {
    return db.readings
      .where('subscriber_id').equals(Number(subscriberId))
      .and(r => r.status !== 'cancelled')
      .reverse()
      .first()
  }

  async function create(data, userId) {
    const now = new Date().toISOString()

    // احتساب الاستهلاك
    const consumption = parseFloat(data.current_reading) - parseFloat(data.previous_reading ?? 0)

    if (consumption < 0) {
      throw new Error('القراءة الجديدة لا يمكن أن تكون أقل من القراءة السابقة')
    }

    const readingId = await db.readings.add({
      subscriber_id:    Number(data.subscriber_id),
      meter_id:         data.meter_id ? Number(data.meter_id) : null,
      previous_reading: parseFloat(data.previous_reading ?? 0),
      current_reading:  parseFloat(data.current_reading),
      consumption,
      reading_date:     data.reading_date ?? now.slice(0, 10),
      period_month:     data.period_month ?? now.slice(0, 7),
      status:          'pending',
      notes:            data.notes ?? '',
      created_by:      userId,
      created_at:      now,
      updated_at:      now,
    })

    return readingId
  }

  async function update(id, data, userId) {
    const old = await db.readings.get(Number(id))
    if (!old) throw new Error('القراءة غير موجودة')

    const consumption = parseFloat(data.current_reading) - parseFloat(data.previous_reading ?? 0)
    if (consumption < 0) throw new Error('القراءة الجديدة لا يمكن أن تكون أقل من القراءة السابقة')

    await db.readings.update(Number(id), {
      previous_reading: parseFloat(data.previous_reading ?? 0),
      current_reading:  parseFloat(data.current_reading),
      consumption,
      reading_date:     data.reading_date,
      period_month:     data.period_month,
      notes:            data.notes ?? '',
      updated_at:       new Date().toISOString(),
    })

    // تحديث الفاتورة المرتبطة إن وجدت
    const invoice = await db.invoices.where('reading_id').equals(Number(id)).first()
    if (invoice) {
      const invoiceStore = useInvoicesStore()
      await invoiceStore.recalculate(invoice.id, consumption)
    }
  }

  async function remove(id) {
    // التحقق أنه لا توجد فاتورة مدفوعة مرتبطة
    const invoice = await db.invoices.where('reading_id').equals(Number(id)).first()
    if (invoice && invoice.status === 'paid') {
      throw new Error('لا يمكن حذف قراءة مرتبطة بفاتورة مدفوعة')
    }

    // حذف الفاتورة المرتبطة إن وجدت (غير مدفوعة)
    if (invoice) await db.invoices.delete(invoice.id)

    await db.readings.delete(Number(id))
    await loadAll()
  }

  return {
    items, isLoading, error,
    loadAll, getLastReading, create, update, remove
  }
})