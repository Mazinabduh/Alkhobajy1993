<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">العدادات</h1>
      <router-link to="/meters/new" class="btn btn-primary">
        <span>+</span> عداد جديد
      </router-link>
    </div>

    <div v-if="meters.length === 0" class="empty-state">
      <div class="empty-icon">⚡</div>
      <h3>لا توجد عدادات</h3>
      <p>أضف عداد جديد لبدء تسجيل القراءات</p>
    </div>

    <div v-else class="data-list">
      <div v-for="meter in meters" :key="meter.id" class="data-card">
        <div class="card-header">
          <span class="card-id">{{ meter.serial_number }}</span>
          <span class="badge" :class="meter.status === 'active' ? 'badge-success' : 'badge-danger'">
            {{ meter.status === 'active' ? 'نشط' : 'معطل' }}
          </span>
        </div>
        <div class="card-body">
          <p v-if="meter.subscriber_name"><strong>المشترك:</strong> {{ meter.subscriber_name }}</p>
        </div>
        <div class="card-actions">
          <router-link :to="`/meters/${meter.id}/edit`" class="btn btn-sm btn-outline">تعديل</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/database/db.js'

const meters = ref([])

onMounted(async () => {
  try {
    const data = await db.meters.toArray()
    for (const m of data) {
      if (m.subscriber_id) {
        const sub = await db.subscribers.get(m.subscriber_id)
        m.subscriber_name = sub?.name || 'غير معروف'
      }
    }
    meters.value = data
  } catch (e) {
    console.error('Error loading meters:', e)
  }
})
</script>

<style scoped>
.page-container { padding: 16px; max-width: 800px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.btn { padding: 8px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.btn-primary { background: var(--primary); color: white; border: none; }
.btn-outline { background: transparent; color: var(--primary); border: 1px solid var(--primary); }
.btn-sm { padding: 4px 10px; font-size: 0.8rem; }
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 3rem; margin-bottom: 16px; }
.empty-state h3 { color: var(--text-secondary); margin-bottom: 8px; }
.empty-state p { color: var(--text-muted); font-size: 0.9rem; }
.data-list { display: flex; flex-direction: column; gap: 12px; }
.data-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.card-id { font-weight: 700; color: var(--primary); }
.badge { padding: 2px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }
.badge-success { background: rgba(16,185,129,0.15); color: #10B981; }
.badge-danger { background: rgba(239,68,68,0.15); color: #EF4444; }
.card-body { font-size: 0.9rem; color: var(--text-secondary); }
.card-body strong { color: var(--text-primary); }
.card-actions { margin-top: 8px; }
</style>
