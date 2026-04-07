import { ref } from 'vue'

// مشترك عالمي
const toasts = ref([])
let nextId   = 1

export function useToast() {
  function show(message, type = 'info', duration = 3000) {
    const id = nextId++
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, duration)
  }

  return {
    toasts,
    success: (msg) => show(msg, 'success'),
    error:   (msg) => show(msg, 'error', 4000),
    warning: (msg) => show(msg, 'warning'),
    info:    (msg) => show(msg, 'info'),
  }
}

export { toasts }