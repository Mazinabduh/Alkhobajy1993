import { createApp }   from 'vue'
import { createPinia } from 'pinia'
import router          from '@/router/index.js'
import App             from '@/App.vue'

// الأنماط العامة
import '@/assets/css/main.css'

// تسجيل Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch(err => console.warn('SW registration failed:', err))
  })
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')