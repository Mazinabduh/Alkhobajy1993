<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">التحصيلات</h1>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-label">إجمالي التحصيلات</span>
        <span class="stat-value">{{ totalPayments }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">عدد العمليات</span>
        <span class="stat-value">{{ payments.length }}</span>
      </div>
    </div>

    <div v-if="payments.length === 0" class="empty-state">
      <div class="empty-icon">💰</div>
      <h3>لا توجد تحصيلات</h3>
      <p>سيتم عرض التحصيلات هنا بعد تسجيلها</p>
    </div>

    <div v-else class="data-list">
      <div v-for="payment in payments" :key="payment.id" class="data-card">
        <div class="card-header">
          <span class="card-id">دفعة #{{ payment.id }}</span>
          <span class="card-date">{{ payment.payment_date }}</span>
        </div>
        <div class="card-body">
          <p><strong>المبلغ:</strong> {{ payment.amount }}</p>
          <p v-if="payment.method"><strong>طريقة الدفع:</strong> {{ payment.method }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '@/database/db.js'

const payments = ref([])
const totalPayments = computed(() => payments.value.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toFixed(2))

onMounted(async () => {
  try {
    payments.value = await db.payments.reverse().sortBy('payment_date')
  } catch (e) {
    console.error('Error loading payments:', e)
  }
})
</script>

<style scoped>
.page-container { padding: 16px; max-width: 800px; margin: 0 auto; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }
.stat-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; text-align: center; }
.stat-label { display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px; }
.stat-value { display: block; font-size: 1.3rem; font-weight: 700; color: var(--secondary); }
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 3rem; margin-bottom: 16px; }
.empty-state h3 { color: var(--text-secondary); margin-bottom: 8px; }
.empty-state p { color: var(--text-muted); font-size: 0.9rem; }
.data-list { display: flex; flex-direction: column; gap: 12px; }
.data-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.card-id { font-weight: 700; color: var(--primary); }
.card-date { font-size: 0.8rem; color: var(--text-muted); }
.card-body { font-size: 0.9rem; color: var(--text-secondary); }
.card-body strong { color: var(--text-primary); }
</style>
