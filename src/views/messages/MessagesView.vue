<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">الرسائل</h1>
      <router-link to="/messages/templates" class="btn btn-primary">قوالب الرسائل</router-link>
    </div>

    <div v-if="messageLogs.length === 0" class="empty-state">
      <div class="empty-icon">💬</div>
      <h3>لا توجد رسائل</h3>
      <p>سيتم عرض الرسائل المرسلة هنا</p>
    </div>

    <div v-else class="data-list">
      <div v-for="log in messageLogs" :key="log.id" class="data-card">
        <div class="card-header">
          <span class="card-id">رسالة #{{ log.id }}</span>
          <span class="card-date">{{ log.sent_at }}</span>
        </div>
        <div class="card-body">
          <p>{{ log.content || 'محتوى الرسالة' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/database/db.js'

const messageLogs = ref([])

onMounted(async () => {
  try {
    messageLogs.value = await db.message_logs.reverse().sortBy('sent_at')
  } catch (e) {
    console.error('Error loading messages:', e)
  }
})
</script>

<style scoped>
.page-container { padding: 16px; max-width: 800px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.btn { padding: 8px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.btn-primary { background: var(--primary); color: white; border: none; }
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 3rem; margin-bottom: 16px; }
.empty-state h3 { color: var(--text-secondary); margin-bottom: 8px; }
.empty-state p { color: var(--text-muted); font-size: 0.9rem; }
.data-list { display: flex; flex-direction: column; gap: 12px; }
.data-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.card-id { font-weight: 700; color: var(--primary); font-size: 0.9rem; }
.card-date { font-size: 0.8rem; color: var(--text-muted); }
.card-body { font-size: 0.9rem; color: var(--text-secondary); }
</style>
