export function useNotificationService() {

  async function fetchNotifications(params = {}) {
    console.warn('[NotificationService] fetchNotifications stub', params)
    return []
  }

  async function addNotification({ title, message, type = 'info', related_id = null, related_type = null }) {
    console.warn('[NotificationService] addNotification stub', { title, message, type })
    return null
  }

  async function markAsRead(id) {
    console.warn('[NotificationService] markAsRead stub', id)
  }

  async function markAllAsRead() {
    console.warn('[NotificationService] markAllAsRead stub')
  }

  async function removeNotification(id) {
    console.warn('[NotificationService] removeNotification stub', id)
  }

  async function clearAll() {
    console.warn('[NotificationService] clearAll stub')
  }

  return {
    fetchNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  }
}
