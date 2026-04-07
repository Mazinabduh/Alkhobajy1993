<template>
  <header class="app-header" dir="rtl">

    <!-- الجانب الأيمن: زر القائمة + اسم المحطة -->
    <div class="header-right">
      <button class="icon-btn menu-btn" @click="$emit('toggle-sidebar')">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <div class="station-info">
        <span class="station-name">{{ settings.stationName }}</span>
        <span class="connection-badge" :class="isOnline ? 'online' : 'offline'">
          <span class="badge-dot"></span>
          {{ isOnline ? 'متصل' : 'غير متصل' }}
        </span>
      </div>
    </div>

    <!-- الجانب الأيسر: الأدوات -->
    <div class="header-left">

      <!-- رفع إلى GitHub -->
      <button
        class="icon-btn"
        title="رفع نسخة احتياطية"
        :disabled="!isOnline || isSyncing"
        @click="handleUpload"
      >
        <svg class="w-5 h-5" :class="{ 'animate-spin': isSyncing }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
      </button>

      <!-- استعادة من GitHub -->
      <button
        class="icon-btn"
        title="استعادة من GitHub"
        :disabled="!isOnline"
        @click="handleRestore"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3 3m0 0l3-3m-3 3V8"/>
        </svg>
      </button>

      <!-- الإشعارات -->
      <button class="icon-btn notification-btn" @click="showNotifications = !showNotifications">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </button>

      <!-- صورة المدير -->
      <div class="user-menu-wrapper" ref="userMenuRef">
        <button class="user-avatar-btn" @click="showUserMenu = !showUserMenu">
          <img v-if="auth.userAvatar" :src="auth.userAvatar" alt="صورة المستخدم" class="avatar-img" />
          <div v-else class="avatar-placeholder">
            {{ auth.userName.charAt(0) }}
          </div>
        </button>

        <!-- قائمة المستخدم -->
        <Transition name="dropdown">
          <div v-if="showUserMenu" class="user-dropdown">
            <div class="dropdown-header">
              <strong>{{ auth.userName }}</strong>
              <span class="role-badge">{{ roleLabel }}</span>
            </div>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click="goToProfile">
              <span>👤</span> الملف الشخصي
            </button>
            <button class="dropdown-item" @click="goToSettings">
              <span>⚙️</span> الإعدادات
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item danger" @click="handleLogout">
              <span>🚪</span> تسجيل الخروج
            </button>
          </div>
        </Transition>
      </div>

    </div>

    <!-- لوحة الإشعارات -->
    <Transition name="dropdown">
      <div v-if="showNotifications" class="notifications-panel">
        <NotificationsPanel @close="showNotifications = false" />
      </div>
    </Transition>

  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter }           from 'vue-router'
import { useAuthStore }        from '@/stores/auth.js'
import { useSettingsStore }    from '@/stores/settings.js'
import { useNotificationsStore } from '@/stores/notifications.js'
import { useOnlineStatus }     from '@/composables/useOnlineStatus.js'
import { useBackupStore }      from '@/stores/backup.js'
import NotificationsPanel      from '@/components/common/NotificationsPanel.vue'

const emit = defineEmits(['toggle-sidebar'])
const router = useRouter()
const auth   = useAuthStore()
const settings = useSettingsStore()
const notifs   = useNotificationsStore()
const backup   = useBackupStore()
const { isOnline } = useOnlineStatus()

const showNotifications = ref(false)
const showUserMenu      = ref(false)
const isSyncing         = ref(false)
const userMenuRef       = ref(null)

const unreadCount = computed(() => notifs.unreadCount)

const roleLabel = computed(() => {
  const roles = { admin: 'مدير النظام', accountant: 'محاسب', employee: 'موظف' }
  return roles[auth.userRole] ?? auth.userRole
})

async function handleUpload() {
  isSyncing.value = true
  await backup.uploadToGitHub()
  isSyncing.value = false
}

async function handleRestore() {
  router.push('/backup')
}

function goToProfile()  { showUserMenu.value = false; router.push('/settings?tab=profile') }
function goToSettings() { showUserMenu.value = false; router.push('/settings') }

function handleLogout() {
  showUserMenu.value = false
  auth.logout()
  router.replace('/login')
}

// إغلاق القوائم عند الضغط خارجها
function handleClickOutside(e) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  notifs.loadNotifications()
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0; right: 0; left: 0;
  height: 60px;
  background: var(--header-bg, rgba(15, 23, 42, 0.95));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  z-index: 100;
  box-shadow: 0 2px 20px rgba(0,0,0,0.3);
}

/* ─── الجانبان ───────────────────────────────── */
.header-right,
.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ─── زر الأيقونة ────────────────────────────── */
.icon-btn {
  width: 38px; height: 38px;
  border-radius: 10px;
  border: none;
  background: rgba(255,255,255,0.05);
  color: #94A3B8;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease;
  position: relative;
  flex-shrink: 0;
}
.icon-btn:hover:not(:disabled) {
  background: rgba(59,130,246,0.15);
  color: #60A5FA;
}
.icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ─── معلومات المحطة ─────────────────────────── */
.station-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.station-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #F1F5F9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.connection-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.68rem;
  font-weight: 500;
}
.connection-badge.online  { color: #34D399; }
.connection-badge.offline { color: #F87171; }

.badge-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}
.online  .badge-dot { background: #34D399; box-shadow: 0 0 4px #34D399; }
.offline .badge-dot { background: #F87171; }

/* ─── الإشعارات ──────────────────────────────── */
.notif-badge {
  position: absolute;
  top: 4px; left: 4px;
  min-width: 16px; height: 16px;
  background: #EF4444;
  border-radius: 99px;
  font-size: 0.65rem;
  font-weight: 700;
  color: white;
  display: flex; align-items: center; justify-content: center;
  padding: 0 3px;
  border: 2px solid var(--header-bg, #0F172A);
}

/* ─── أفاتار المستخدم ────────────────────────── */
.user-avatar-btn {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(59,130,246,0.4);
  overflow: hidden;
  cursor: pointer;
  background: none;
  padding: 0;
  transition: border-color 0.2s;
  flex-shrink: 0;
}
.user-avatar-btn:hover { border-color: #3B82F6; }

.avatar-img {
  width: 100%; height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, #1D4ED8, #7C3AED);
  display: flex; align-items: center; justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
}

/* ─── قائمة المستخدم ─────────────────────────── */
.user-menu-wrapper { position: relative; }

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 200px;
  background: #1E293B;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 6px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.4);
  z-index: 300;
}

.dropdown-header {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.dropdown-header strong {
  font-size: 0.9rem;
  color: #F1F5F9;
}

.role-badge {
  font-size: 0.7rem;
  color: #60A5FA;
  background: rgba(59,130,246,0.1);
  padding: 2px 8px;
  border-radius: 99px;
  width: fit-content;
}

.dropdown-divider {
  height: 1px;
  background: rgba(255,255,255,0.07);
  margin: 4px 0;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #94A3B8;
  font-size: 0.875rem;
  font-family: 'Cairo', sans-serif;
  cursor: pointer;
  text-align: right;
  transition: all 0.15s;
}
.dropdown-item:hover { background: rgba(255,255,255,0.05); color: #F1F5F9; }
.dropdown-item.danger:hover { background: rgba(239,68,68,0.1); color: #FCA5A5; }

/* ─── لوحة الإشعارات ─────────────────────────── */
.notifications-panel {
  position: fixed;
  top: 60px;
  right: 0; left: 0;
  z-index: 150;
  padding: 0 12px;
}

/* ─── Transitions ────────────────────────────── */
.dropdown-enter-active,
.dropdown-leave-active { transition: all 0.2s ease; }
.dropdown-enter-from { opacity: 0; transform: translateY(-8px) scale(0.95); }
.dropdown-leave-to   { opacity: 0; transform: translateY(-8px) scale(0.95); }
</style>