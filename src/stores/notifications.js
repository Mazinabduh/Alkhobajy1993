import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/database/db.js'

export const useNotificationsStore = defineStore('notifications', () => {
  const items      = ref([])
  const isLoading  = ref(false)

  const unreadCount = computed(() => items.value.filter(n => !n.is_read).length)

  async function loadNotifications() {
    items.value = await db.notifications
      .orderBy('created_at')
      .reverse()
      .limit(50)
      .toArray()
  }

  async function addNotification({ title, message, type = 'info', related_id = null, related_type = null }) {
    const notif = {
      title, message, type,
      is_read: 0,
      related_id, related_type,
      created_at: new Date().toISOString()
    }
    const id = await db.notifications.add(notif)
    items.value.unshift({ ...notif, id })
  }

  async function markAsRead(id) {
    await db.notifications.update(id, { is_read: 1 })
    const item = items.value.find(n => n.id === id)
    if (item) item.is_read = 1
  }

  async function markAllAsRead() {
    await db.notifications.where('is_read').equals(0).modify({ is_read: 1 })
    items.value.forEach(n => { n.is_read = 1 })
  }

  async function removeNotification(id) {
    await db.notifications.delete(id)
    items.value = items.value.filter(n => n.id !== id)
  }

  async function clearAll() {
    await db.notifications.clear()
    items.value = []
  }

  return {
    items, isLoading, unreadCount,
    loadNotifications, addNotification,
    markAsRead, markAllAsRead, removeNotification, clearAll
  }
})