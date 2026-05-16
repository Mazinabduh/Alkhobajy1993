<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">القراءات</h1>
      <router-link to="/readings/new" class="btn btn-primary">
        <span>+</span> قراءة جديدة
      </router-link>
    </div>

    <div v-if="readings.length === 0" class="empty-state">
      <div class="empty-icon">📊</div>
      <h3>لا توجد قراءات</h3>
      <p>أضف قراءة جديدة لبدء تسجيل قراءات العدادات</p>
    </div>

    <div v-else class="data-list">
      <div v-for="reading in readings" :key="reading.id" class="data-card">
        <div class="card-header">
          <span class="card-id">#{{ reading.id }}</span>
          <span class="badge" :class="reading.status === 'billed' ? 'badge-success' : 'badge-warning'">
            {{ reading.status === 'billed' ? 'مفوتر' : 'جديد' }}
          </span>
        </div>
        <div class="card-body">
          <p><strong>المشترك:</strong> {{ reading.subscriber_name || '-' }}</p>
          <p><strong>القراءة:</strong> {{ reading.current_reading }}</p>
          <p><strong>التاريخ:</strong> {{ reading.reading_date }}</p>
        </div>
        <div class="card-actions">
          <router-link :to="`/readings/${reading.id}/edit`" class="btn btn-sm btn-outline">تعديل</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/database/db.js'

const readings = ref([])

onMounted(async () => {
  try {
    const data = await db.readings.toArray()
    for (const r of data) {
      if (r.subscriber_id) {
        const sub = await db.subscribers.get(r.subscriber_id)
        r.subscriber_name = sub?.name || 'غير معروف'
      }
    }
    readings.value = data
  } catch (e) {
    console.error('Error loading readings:', e)
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
.btn-sm { padding: 4px 10px; font-size: 0.8rem; }
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 3rem; margin-bottom: 16px; }
.empty-state h3 { color: var(--text-secondary); margin-bottom: 8px; }
.empty-state p { color: var(--text-muted); font-size: 0.9rem; }
.data-list { display: flex; flex-direction: column; gap: 12px; }
.data-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.card-id { font-weight: 700; color: var(--primary); }
.badge { padding: 2px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }
.badge-success { background: rgba(16,185,129,0.15); color: #10B981; }
.badge-warning { background: rgba(245,158,11,0.15); color: #F59E0B; }
.card-body { display: flex; flex-direction: column; gap: 4px; font-size: 0.9rem; color: var(--text-secondary); }
.card-body strong { color: var(--text-primary); }
.card-actions { margin-top: 12px; display: flex; gap: 8px; }
</style>
