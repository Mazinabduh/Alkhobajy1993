<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">المتأخرات</h1>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-label">إجمالي المتأخرات</span>
        <span class="stat-value danger">{{ totalArrears }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">عدد المشتركين</span>
        <span class="stat-value">{{ arrearsList.length }}</span>
      </div>
    </div>

    <div v-if="arrearsList.length === 0" class="empty-state">
      <div class="empty-icon">✅</div>
      <h3>لا توجد متأخرات</h3>
      <p>جميع الفواتير مدفوعة</p>
    </div>

    <div v-else class="data-list">
      <div v-for="item in arrearsList" :key="item.subscriber_id" class="data-card">
        <div class="card-header">
          <span class="card-name">{{ item.name }}</span>
          <span class="card-amount">{{ item.arrears }}</span>
        </div>
        <div class="card-body">
          <p>رقم العداد: {{ item.meter_number || '-' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { db } from '@/database/db.js'

const arrearsList = ref([])
const totalArrears = computed(() => arrearsList.value.reduce((sum, a) => sum + (parseFloat(a.arrears) || 0), 0).toFixed(2))

onMounted(async () => {
  try {
    const invoices = await db.invoices.where('status').equals('unpaid').toArray()
    const grouped = {}
    for (const inv of invoices) {
      if (!grouped[inv.subscriber_id]) {
        const sub = await db.subscribers.get(inv.subscriber_id)
        grouped[inv.subscriber_id] = { subscriber_id: inv.subscriber_id, name: sub?.name || 'غير معروف', meter_number: sub?.meter_number || '', arrears: 0 }
      }
      grouped[inv.subscriber_id].arrears += parseFloat(inv.total_amount) || 0
    }
    arrearsList.value = Object.values(grouped)
  } catch (e) {
    console.error('Error loading arrears:', e)
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
.danger { color: #EF4444; }
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 3rem; margin-bottom: 16px; }
.empty-state h3 { color: var(--text-secondary); margin-bottom: 8px; }
.empty-state p { color: var(--text-muted); font-size: 0.9rem; }
.data-list { display: flex; flex-direction: column; gap: 12px; }
.data-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.card-name { font-weight: 700; color: var(--text-primary); }
.card-amount { font-weight: 700; color: #EF4444; font-size: 1.1rem; }
.card-body { font-size: 0.85rem; color: var(--text-secondary); }
</style>
