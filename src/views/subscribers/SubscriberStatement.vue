<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">كشف حساب المشترك</h1>
      <router-link to="/subscribers" class="btn btn-outline">العودة</router-link>
    </div>

    <div v-if="subscriber" class="statement-card">
      <div class="subscriber-info">
        <h2>{{ subscriber.name }}</h2>
        <p v-if="subscriber.phone">هاتف: {{ subscriber.phone }}</p>
        <p v-if="subscriber.meter_number">رقم العداد: {{ subscriber.meter_number }}</p>
      </div>

      <div v-if="transactions.length === 0" class="empty-state">
        <p>لا توجد حركات</p>
      </div>

      <div v-else class="data-list">
        <div v-for="txn in transactions" :key="txn.id" class="data-card">
          <div class="card-row">
            <span class="card-date">{{ txn.date }}</span>
            <span class="card-desc">{{ txn.description }}</span>
            <span class="card-amount" :class="txn.type === 'credit' ? 'text-success' : 'text-danger'">
              {{ txn.type === 'credit' ? '+' : '-' }}{{ txn.amount }}
            </span>
          </div>
        </div>
      </div>

      <div class="statement-total">
        <span>الرصيد:</span>
        <span class="total-amount">{{ balance }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/database/db.js'

const route = useRoute()
const subscriber = ref(null)
const transactions = ref([])

const balance = computed(() => {
  return transactions.value.reduce((sum, t) => {
    return t.type === 'credit' ? sum + parseFloat(t.amount || 0) : sum - parseFloat(t.amount || 0)
  }, 0).toFixed(2)
})

onMounted(async () => {
  const id = parseInt(route.params.id)
  if (id) {
    subscriber.value = await db.subscribers.get(id)

    // جلب الفواتير
    const invoices = await db.invoices.where('subscriber_id').equals(id).toArray()
    for (const inv of invoices) {
      transactions.value.push({ id: `inv-${inv.id}`, date: inv.created_at?.slice(0, 10), description: `فاتورة ${inv.invoice_number || inv.id}`, amount: inv.total_amount, type: 'debit' })
    }

    // جلب المدفوعات
    const payments = await db.payments.where('subscriber_id').equals(id).toArray()
    for (const pay of payments) {
      transactions.value.push({ id: `pay-${pay.id}`, date: pay.payment_date?.slice(0, 10), description: `دفعة #${pay.id}`, amount: pay.amount, type: 'credit' })
    }

    transactions.value.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }
})
</script>

<style scoped>
.page-container { padding: 16px; max-width: 800px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.btn { padding: 8px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.btn-outline { background: transparent; color: var(--primary); border: 1px solid var(--primary); }
.statement-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; }
.subscriber-info { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color); }
.subscriber-info h2 { font-size: 1.2rem; color: var(--text-primary); margin: 0 0 8px; }
.subscriber-info p { font-size: 0.85rem; color: var(--text-secondary); margin: 2px 0; }
.empty-state { text-align: center; padding: 40px; color: var(--text-muted); }
.data-list { display: flex; flex-direction: column; gap: 4px; }
.data-card { padding: 10px 0; border-bottom: 1px solid var(--border-color); }
.data-card:last-child { border-bottom: none; }
.card-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.card-date { font-size: 0.8rem; color: var(--text-muted); min-width: 80px; }
.card-desc { flex: 1; color: var(--text-secondary); font-size: 0.9rem; }
.card-amount { font-weight: 700; font-size: 0.95rem; }
.text-success { color: #10B981; }
.text-danger { color: #EF4444; }
.statement-total { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 16px; border-top: 2px solid var(--border-color); font-weight: 700; }
.total-amount { font-size: 1.3rem; color: var(--secondary); }
</style>
