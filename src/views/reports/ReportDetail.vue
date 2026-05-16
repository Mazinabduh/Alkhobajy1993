<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">تفاصيل التقرير</h1>
      <router-link to="/reports" class="btn btn-outline">العودة</router-link>
    </div>

    <div class="report-card">
      <h2 class="report-title">{{ reportTitle }}</h2>
      <div class="report-stats">
        <div class="stat-item">
          <span class="stat-label">الإجمالي</span>
          <span class="stat-value">{{ totalAmount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">العدد</span>
          <span class="stat-value">{{ totalCount }}</span>
        </div>
      </div>

      <div v-if="items.length === 0" class="empty-state">
        <p>لا توجد بيانات لهذا التقرير</p>
      </div>

      <div v-else class="data-list">
        <div v-for="item in items" :key="item.id" class="data-card">
          <div class="card-row">
            <span class="card-label">{{ item.label }}</span>
            <span class="card-value">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/database/db.js'

const route = useRoute()
const reportTitle = ref('')
const items = ref([])
const totalAmount = ref(0)
const totalCount = ref(0)

const reportNames = {
  invoices: 'تقرير الفواتير',
  payments: 'تقرير التحصيلات',
  arrears: 'تقرير المتأخرات',
  expenses: 'تقرير النفقات',
  subscribers: 'تقرير المشتركين',
  readings: 'تقرير القراءات',
}

onMounted(async () => {
  const type = route.params.type
  reportTitle.value = reportNames[type] || 'تقرير'

  try {
    if (type === 'invoices') {
      const data = await db.invoices.toArray()
      totalCount.value = data.length
      totalAmount.value = data.reduce((sum, i) => sum + (parseFloat(i.total_amount) || 0), 0)
      items.value = data.map(i => ({ id: i.id, label: i.invoice_number || `فاتورة #${i.id}`, value: i.total_amount }))
    } else if (type === 'payments') {
      const data = await db.payments.toArray()
      totalCount.value = data.length
      totalAmount.value = data.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      items.value = data.map(p => ({ id: p.id, label: `دفعة #${p.id}`, value: p.amount }))
    } else if (type === 'expenses') {
      const data = await db.expenses.toArray()
      totalCount.value = data.length
      totalAmount.value = data.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
      items.value = data.map(e => ({ id: e.id, label: e.description || `نفقة #${e.id}`, value: e.amount }))
    } else if (type === 'subscribers') {
      const data = await db.subscribers.toArray()
      totalCount.value = data.length
      items.value = data.map(s => ({ id: s.id, label: s.name, value: s.status || 'نشط' }))
    }
  } catch (e) {
    console.error('Error loading report:', e)
  }
})
</script>

<style scoped>
.page-container { padding: 16px; max-width: 800px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.btn { padding: 8px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.btn-outline { background: transparent; color: var(--primary); border: 1px solid var(--primary); }
.report-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; }
.report-title { font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin: 0 0 20px; }
.report-stats { display: flex; gap: 20px; margin-bottom: 20px; }
.stat-item { display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 0.8rem; color: var(--text-muted); }
.stat-value { font-size: 1.3rem; font-weight: 700; color: var(--secondary); }
.empty-state { text-align: center; padding: 40px; color: var(--text-muted); }
.data-list { display: flex; flex-direction: column; gap: 8px; }
.data-card { padding: 10px 0; border-bottom: 1px solid var(--border-color); }
.data-card:last-child { border-bottom: none; }
.card-row { display: flex; justify-content: space-between; align-items: center; }
.card-label { color: var(--text-secondary); font-size: 0.9rem; }
.card-value { color: var(--text-primary); font-weight: 600; }
</style>
