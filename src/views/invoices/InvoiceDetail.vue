<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">تفاصيل الفاتورة</h1>
      <router-link to="/invoices" class="btn btn-outline">العودة</router-link>
    </div>

    <div v-if="invoice" class="detail-card">
      <div class="detail-row">
        <span class="label">رقم الفاتورة:</span>
        <span class="value">{{ invoice.invoice_number }}</span>
      </div>
      <div class="detail-row">
        <span class="label">الحالة:</span>
        <span class="badge" :class="statusClass">{{ statusText }}</span>
      </div>
      <div class="detail-row">
        <span class="label">الفترة:</span>
        <span class="value">{{ invoice.period_month }}</span>
      </div>
      <div class="detail-row">
        <span class="label">الإجمالي:</span>
        <span class="value amount">{{ invoice.total_amount }}</span>
      </div>
      <div class="detail-row">
        <span class="label">تاريخ الإنشاء:</span>
        <span class="value">{{ invoice.created_at }}</span>
      </div>

      <div class="detail-actions">
        <router-link :to="`/invoices/${invoice.id}/print`" class="btn btn-primary">طباعة</router-link>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>جاري التحميل...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/database/db.js'

const route = useRoute()
const invoice = ref(null)

const statusText = computed(() => {
  if (!invoice.value) return ''
  const map = { paid: 'مدفوعة', partial: 'مدفوعة جزئياً', unpaid: 'غير مدفوعة' }
  return map[invoice.value.status] || invoice.value.status
})

const statusClass = computed(() => {
  if (!invoice.value) return ''
  const map = { paid: 'badge-success', partial: 'badge-warning', unpaid: 'badge-danger' }
  return map[invoice.value.status] || 'badge-warning'
})

onMounted(async () => {
  const id = parseInt(route.params.id)
  if (id) {
    invoice.value = await db.invoices.get(id)
  }
})
</script>

<style scoped>
.page-container { padding: 16px; max-width: 800px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.btn { padding: 8px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.btn-primary { background: var(--primary); color: white; border: none; }
.btn-outline { background: transparent; color: var(--primary); border: 1px solid var(--primary); }
.detail-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; }
.detail-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color); }
.detail-row:last-of-type { border-bottom: none; }
.label { color: var(--text-secondary); font-size: 0.9rem; }
.value { color: var(--text-primary); font-weight: 600; }
.amount { color: var(--secondary); font-size: 1.2rem; }
.badge { padding: 2px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }
.badge-success { background: rgba(16,185,129,0.15); color: #10B981; }
.badge-warning { background: rgba(245,158,11,0.15); color: #F59E0B; }
.badge-danger { background: rgba(239,68,68,0.15); color: #EF4444; }
.detail-actions { margin-top: 20px; display: flex; gap: 8px; }
.empty-state { text-align: center; padding: 40px; color: var(--text-muted); }
</style>
