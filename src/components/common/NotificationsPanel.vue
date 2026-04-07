<template>
  <div class="notif-panel" dir="rtl">
    <div class="notif-header">
      <h3>الإشعارات</h3>
      <div class="notif-actions">
        <button v-if="notifs.unreadCount > 0" class="mark-all-btn" @click="notifs.markAllAsRead()">
          تحديد كمقروء
        </button>
        <button v-if="notifs.items.length > 0" class="clear-btn" @click="notifs.clearAll()">
          مسح الكل
        </button>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
    </div>

    <div class="notif-list">
      <div v-if="notifs.items.length === 0" class="notif-empty">
        <span>🔔</span>
        <p>لا توجد إشعارات</p>
      </div>

      <TransitionGroup name="notif">
        <div
          v-for="item in notifs.items"
          :key="item.id"
          class="notif-item"
          :class="{ unread: !item.is_read, [item.type]: true }"
          @click="notifs.markAsRead(item.id)"
        >
          <span class="notif-icon">{{ getIcon(item.type) }}</span>
          <div class="notif-content">
            <strong>{{ item.title }}</strong>
            <span v-if="item.message">{{ item.message }}</span>
            <time>{{ formatTime(item.created_at) }}</time>
          </div>
          <button class="notif-delete" @click.stop="notifs.removeNotification(item.id)">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { useNotificationsStore } from '@/stores/notifications.js'

defineEmits(['close'])
const notifs = useNotificationsStore()

function getIcon(type) {
  return { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' }[type] ?? '🔔'
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  if (diff < 60000)   return 'منذ لحظة'
  if (diff < 3600000) return `منذ ${Math.floor(diff / 60000)} دقيقة`
  if (diff < 86400000) return `منذ ${Math.floor(diff / 3600000)} ساعة`
  return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.notif-panel {
  background: var(--bg-secondary, #1E293B);
  border: 1px solid var(--border-color);
  border-radius: 0 0 20px 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.4);
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.notif-header h3 { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }

.notif-actions { display: flex; align-items: center; gap: 8px; }

.mark-all-btn, .clear-btn {
  font-size: 0.75rem;
  color: var(--primary, #3B82F6);
  background: none; border: none; cursor: pointer;
  font-family: 'Cairo', sans-serif;
}

.close-btn {
  width: 28px; height: 28px;
  border-radius: 8px;
  border: none;
  background: rgba(255,255,255,0.05);
  color: var(--text-muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem;
}

.notif-list {
  overflow-y: auto;
  flex: 1;
}

.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: var(--text-muted);
  font-size: 0.85rem;
}
.notif-empty span { font-size: 2rem; }

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}
.notif-item:hover { background: rgba(255,255,255,0.03); }
.notif-item.unread { background: rgba(59,130,246,0.05); }
.notif-item.unread::before {
  content: '';
  position: absolute;
  right: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--primary, #3B82F6);
  border-radius: 0 3px 3px 0;
}

.notif-icon { font-size: 1.2rem; flex-shrink: 0; }

.notif-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.notif-content strong {
  font-size: 0.85rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-content span {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.notif-content time {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.notif-delete {
  width: 24px; height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.7rem;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.notif-delete:hover { background: rgba(239,68,68,0.15); color: #FCA5A5; }

/* Transition */
.notif-enter-active, .notif-leave-active { transition: all 0.2s ease; }
.notif-enter-from { opacity: 0; transform: translateX(-10px); }
.notif-leave-to   { opacity: 0; transform: translateX(10px); }
</style>