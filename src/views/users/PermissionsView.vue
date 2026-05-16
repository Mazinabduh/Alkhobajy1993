<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">الصلاحيات</h1>
    </div>

    <div v-if="users.length === 0" class="empty-state">
      <p>لا يوجد مستخدمون</p>
    </div>

    <div v-else class="data-list">
      <div v-for="user in users" :key="user.id" class="data-card">
        <div class="card-header">
          <span class="card-name">{{ user.name }}</span>
          <span class="badge" :class="user.role === 'admin' ? 'badge-primary' : 'badge-warning'">
            {{ user.role === 'admin' ? 'مدير' : 'مستخدم' }}
          </span>
        </div>
        <div class="card-body">
          <p>اسم المستخدم: {{ user.username }}</p>
        </div>
        <div class="card-actions">
          <router-link :to="`/users/${user.id}/edit`" class="btn btn-sm btn-outline">تعديل الصلاحيات</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/database/db.js'

const users = ref([])

onMounted(async () => {
  try {
    users.value = await db.users.toArray()
  } catch (e) {
    console.error('Error loading users:', e)
  }
})
</script>

<style scoped>
.page-container { padding: 16px; max-width: 800px; margin: 0 auto; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.empty-state { text-align: center; padding: 40px; color: var(--text-muted); }
.data-list { display: flex; flex-direction: column; gap: 12px; }
.data-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.card-name { font-weight: 700; color: var(--text-primary); }
.badge { padding: 2px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }
.badge-primary { background: rgba(59,130,246,0.15); color: #3B82F6; }
.badge-warning { background: rgba(245,158,11,0.15); color: #F59E0B; }
.card-body { font-size: 0.85rem; color: var(--text-secondary); }
.card-actions { margin-top: 8px; }
.btn { padding: 8px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.btn-outline { background: transparent; color: var(--primary); border: 1px solid var(--primary); }
.btn-sm { padding: 4px 10px; font-size: 0.8rem; }
</style>
