import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db }           from '@/database/db.js'
import { useSettingsStore }      from '@/stores/settings.js'
import { useNotificationsStore } from '@/stores/notifications.js'

export const useInvoicesStore = defineStore('invoices', () => {
  const items     = ref([])
  const isLoading = ref(false)
  const error     = ref(null)
  const filterStatus = ref('')
  const filterMonth  = ref('')

  const filtered = computed(() => {
    let list = [...items.value]
    if (filterStatus.value) list = list.filter(i => i.status === filterStatus.value)
    if (filterMonth.value)  list = list.filter(i => i.period_month === filterMonth.value)
    return list
  })

  const totalUnpaid = computed(() =>
    items.value
      .filter(i => ['unpaid', 'partial'].includes(i.status))
      .reduce((s, i) => s + (i.remaining_amount ?? 0), 0)
  )

  async function loadAll(subscriberId = null) {
    isLoading.value = true
    try {
      let list
      if (subscriberId)
        list = await db.invoices.where('subscriber_id').equals(Number(subscriberId)).reverse().toArray()
      else
        list = await db.invoices.orderBy('created_at').reverse().limit(200).toArray()

      // إضافة أسماء المشتركين
      const withNames = await Promise.all(list.map(async inv => {
        const sub = await db.subscribers.get(inv.subscriber_id)
        return { ...inv, subscriber_name: sub?.name ?? '', subscriber_phone: sub?.phone ?? '' }
      }))

      items.value = withNames
    } catch (e) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  async function createFromReading(readingId, userId) {
    const settings = useSettingsStore()
    const reading  = await db.readings.get(Number(readingId))
    if (!reading) throw new Error('القراءة غير موجودة')

    const sub = await db.subscribers.get(reading.subscriber_id)
    if (!sub)  throw new Error('المشترك غير موجود')

    // التحقق من وجود فاتورة سابقة للقراءة
    const existing = await db.invoices.where('reading_id').equals(Number(readingId)).first()
    if (existing) throw new Error('توجد فاتورة مرتبطة بهذه القراءة بالفعل')

    // احتساب المتأخرات (فواتير غير مدفوعة سابقة)
    const unpaidInvoices = await db.invoices
      .where('subscriber_id').equals(reading.subscriber_id)
      .and(inv => ['unpaid', 'partial'].includes(inv.status))
      .toArray()

    const previousBalance = unpaidInvoices.reduce((s, inv) => s + (inv.remaining_amount ?? 0), 0)

    // المبلغ الحالي
    const unitPrice          = settings.unitPrice
    const consumption        = reading.consumption ?? 0
    const consumptionAmount  = consumption * unitPrice
    const taxAmount          = consumptionAmount * (settings.taxRate / 100)
    const totalAmount        = consumptionAmount + taxAmount + previousBalance
    const remainingAmount    = totalAmount

    const invNumber = await settings.generateInvoiceNumber()
    const now       = new Date().toISOString()

    const id = await db.invoices.add({
      invoice_number:     invNumber,
      subscriber_id:      reading.subscriber_id,
      reading_id:         Number(readingId),
      period_month:       reading.period_month,
      consumption,
      unit_price:         unitPrice,
      consumption_amount: consumptionAmount,
      previous_balance:   previousBalance,
      discount:           0,
      tax:                taxAmount,
      total_amount:       totalAmount,
      paid_amount:        0,
      remaining_amount:   remainingAmount,
      status:            'unpaid',
      due_date:           getDueDate(),
      notes:              '',
      created_by:         userId,
      created_at:         now,
      updated_at:         now,
    })

    // تحديث حالة القراءة
    await db.readings.update(Number(readingId), { status: 'billed', updated_at: now })

    await useNotificationsStore().addNotification({
      title:   'فاتورة جديدة',
      message: `تم إصدار الفاتورة رقم ${invNumber} للمشترك ${sub.name}`,
      type:    'info',
    })

    await loadAll()
    return id
  }

  async function recalculate(invoiceId, newConsumption) {
    const settings = useSettingsStore()
    const invoice  = await db.invoices.get(Number(invoiceId))
    if (!invoice) return

    const consumptionAmount = newConsumption * settings.unitPrice
    const taxAmount         = consumptionAmount * (settings.taxRate / 100)
    const totalAmount       = consumptionAmount + taxAmount + invoice.previous_balance
    const remainingAmount   = totalAmount - invoice.paid_amount

    await db.invoices.update(Number(invoiceId), {
      consumption:        newConsumption,
      consumption_amount: consumptionAmount,
      tax:                taxAmount,
      total_amount:       totalAmount,
      remaining_amount:   Math.max(0, remainingAmount),
      status:             remainingAmount <= 0 ? 'paid' : invoice.paid_amount > 0 ? 'partial' : 'unpaid',
      updated_at:         new Date().toISOString(),
    })
  }

  async function applyPayment(invoiceId, amount, userId, paymentData = {}) {
    const invoice = await db.invoices.get(Number(invoiceId))
    if (!invoice) throw new Error('الفاتورة غير موجودة')

    const paid        = (invoice.paid_amount ?? 0) + amount
    const remaining   = invoice.total_amount - paid
    const status      = remaining <= 0 ? 'paid' : 'partial'
    const now         = new Date().toISOString()

    // تسجيل الدفعة
    await db.payments.add({
      invoice_id:       Number(invoiceId),
      subscriber_id:    invoice.subscriber_id,
      amount,
      payment_date:     paymentData.date ?? now.slice(0, 10),
      payment_method:   paymentData.method ?? 'cash',
      reference_number: paymentData.reference ?? '',
      notes:            paymentData.notes ?? '',
      created_by:       userId,
      created_at:       now,
    })

    // تحديث الفاتورة
    await db.invoices.update(Number(invoiceId), {
      paid_amount:      paid,
      remaining_amount: Math.max(0, remaining),
      status,
      updated_at:       now,
    })

    const sub = await db.subscribers.get(invoice.subscriber_id)

    await useNotificationsStore().addNotification({
      title:   'سداد فاتورة',
      message: `تم استلام ${amount} ${useSettingsStore().currency} من ${sub?.name ?? ''}`,
      type:    'success',
    })

    await loadAll()
  }

  async function cancelInvoice(invoiceId) {
    await db.invoices.update(Number(invoiceId), {
      status:     'cancelled',
      updated_at: new Date().toISOString(),
    })
    // إعادة حالة القراءة
    const invoice = await db.invoices.get(Number(invoiceId))
    if (invoice?.reading_id) {
      await db.readings.update(invoice.reading_id, { status: 'pending' })
    }
    await loadAll()
  }

  async function getById(id) {
    const inv = await db.invoices.get(Number(id))
    if (!inv) return null
    const sub     = await db.subscribers.get(inv.subscriber_id)
    const reading = inv.reading_id ? await db.readings.get(inv.reading_id) : null
    const payments = await db.payments.where('invoice_id').equals(Number(id)).toArray()
    return { ...inv, subscriber: sub, reading, payments }
  }

  function getDueDate() {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  }

  return {
    items, isLoading, error, filterStatus, filterMonth,
    filtered, totalUnpaid,
    loadAll, createFromReading, recalculate,
    applyPayment, cancelInvoice, getById
  }
})