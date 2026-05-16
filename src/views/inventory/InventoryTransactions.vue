<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">حركة المخزون</h1>
      <router-link to="/inventory" class="btn btn-outline">العودة</router-link>
    </div>

    <div v-if="transactions.length === 0" class="empty-state">
      <div class="empty-icon">📦</div>
      <h3>لا توجد حركات</h3>
      <p>لم يتم تسجيل أي حركات مخزون بعد</p>
    </div>

    <div v-else class="data-list">
      <div v-for="txn in transactions" :key="txn.id" class="data-card">
        <div class="card-header">
          <span class="badge" :class="txn.transaction_type === 'in' ? 'badge-success' : 'badge-danger'">
            {{ txn.transaction_type === 'in' ? 'وارد' : 'صادر' }}
          </span>
          <span class="card-date">{{ txn.transaction_date }}</span>
        </div>
        <div class="card-body">
          <p><strong>الكمية:</strong> {{ txn.quantity }}</p>
          <p v-if="txn.notes"><strong>ملاحظات:</strong> {{ txn.notes }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/database/db.js'

const route = useRoute()
const transactions = ref([])

onMounted(async () => {
  const itemId = parseInt(route.params.id)
  if (itemId) {
    transactions.value = await db.inventory_transactions
      .where('item_id').equals(itemId)
      .reverse().sortBy('transaction_date')
  }
})
</script>

<style scoped>
.page-container { padding: 16px; max-width: 800px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.btn { padding: 8px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.btn-outline { background: transparent; color: var(--primary); border: 1px solid var(--primary); }
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 3rem; margin-bottom: 16px; }
.empty-state h3 { color: var(--text-secondary); margin-bottom: 8px; }
.empty-state p { color: var(--text-muted); font-size: 0.9rem; }
.data-list { display: flex; flex-direction: column; gap: 12px; }
.data-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.card-date { font-size: 0.8rem; color: var(--text-muted); }
.badge { padding: 2px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }
.badge-success { background: rgba(16,185,129,0.15); color: #10B981; }
.badge-danger { background: rgba(239,68,68,0.15); color: #EF4444; }
.card-body { font-size: 0.9rem; color: var(--text-secondary); }
.card-body strong { color: var(--text-primary); }
</style>
