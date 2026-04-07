<template>
  <div class="app-layout" :class="themeClass" dir="rtl">

    <!-- الشريط العلوي -->
    <AppHeader
      @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
    />

    <!-- القائمة الجانبية + overlay -->
    <Transition name="sidebar">
      <div v-if="isSidebarOpen" class="sidebar-overlay" @click="isSidebarOpen = false">
        <div class="sidebar-wrapper" @click.stop>
          <AppSidebar @close="isSidebarOpen = false" />
        </div>
      </div>
    </Transition>

    <!-- المحتوى الرئيسي -->
    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="$route.fullPath" />
        </Transition>
      </RouterView>
    </main>

    <!-- الشريط السفلي -->
    <AppBottomNav />

    <!-- Toast Notifications -->
    <AppToast />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore }   from '@/stores/settings.js'
import AppHeader    from '@/components/layout/AppHeader.vue'
import AppSidebar   from '@/components/layout/AppSidebar.vue'
import AppBottomNav from '@/components/layout/AppBottomNav.vue'
import AppToast     from '@/components/common/AppToast.vue'

const settings      = useSettingsStore()
const isSidebarOpen = ref(false)

const themeClass = computed(() =>
  settings.themeMode === 'dark' ? 'theme-dark' : 'theme-light'
)

onMounted(() => {
  settings.loadSettings()
})
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Cairo', sans-serif;
  overflow: hidden;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 60px;    /* ارتفاع الهيدر */
  padding-bottom: 70px; /* ارتفاع الشريط السفلي */
  scroll-behavior: smooth;
}

/* ─── overlay القائمة ────────────────────────── */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
}

.sidebar-wrapper {
  width: 280px;
  height: 100%;
}

/* ─── انتقالات الصفحة ────────────────────────── */
.page-enter-active,
.page-leave-active {
  transition: all 0.2s ease;
}
.page-enter-from { opacity: 0; transform: translateX(16px); }
.page-leave-to   { opacity: 0; transform: translateX(-16px); }

/* ─── انتقال الشريط الجانبي ──────────────────── */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: opacity 0.25s ease;
}
.sidebar-enter-active .sidebar-wrapper,
.sidebar-leave-active .sidebar-wrapper {
  transition: transform 0.25s ease;
}
.sidebar-enter-from { opacity: 0; }
.sidebar-leave-to   { opacity: 0; }
.sidebar-enter-from .sidebar-wrapper { transform: translateX(280px); }
.sidebar-leave-to   .sidebar-wrapper { transform: translateX(280px); }
</style>