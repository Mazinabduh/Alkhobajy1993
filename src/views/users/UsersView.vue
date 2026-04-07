<template>
  <div class="users-view" dir="rtl">

    <div class="page-header">
      <div class="header-top">
        <h1>👤 المستخدمون</h1>
        <button
          v-if="auth.hasPermission('users.create')"
          class="btn-primary"
          @click="router.push('/users/new')"
        >
          <span>+</span> إضافة
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="center-state">
      <div class="spinner"></div>
    </div>

    <div v-else class="users-list">
      <div
        v-for="user in users"
        :key="user.id"
        class="user-card"
      >
        <!-- الأفاتار والمعلومات -->
        <div class="user-main">
          <div class="user-avatar-wrap">
            <img v-if="user.avatar" :src="user.avatar" class="user-avatar-img" alt="" />
            <div v-else class="user-avatar-placeholder" :style="{ background: getAvatarGradient(user.name) }">
              {{ user.name.charAt(0) }}
            </div>
            <span class="status-dot" :class="user.is_active ? 'active' : 'inactive'"></span>
          </div>

          <div class="user-info">
            <h3>{{ user.name }}</h3>
            <span class="user-username">@{{ user.username }}</span>
            <div class="user-tags">
              <span class="role-badge" :class="user.role">{{ roleLabel(user.role) }}</span>
              <span class="status-badge" :class="user.is_active ? 'active' : 'inactive'">
                {{ user.is_active ? 'نشط' : 'معطل' }}
              </span>
            </div>
          </div>
        </div>

        <!-- الهاتف -->
        <div v-if="user.phone" class="user-phone">
          <span>📞</span>
          <a :href="`tel:${user.phone}`">{{ user.phone }}</a>
        </div>

        <!-- الأزرار -->
        <div class="user-actions" v-if="auth.hasPermission('users.edit') || auth.hasPermission('users.delete')">
          <button
            v-if="auth.hasPermission('users.edit')"
            class="ua-btn info"
            @click="router.push(`/users/${user.id}/edit`)"
          >✏️ تعديل</button>

          <button
            v-if="auth.hasPermission('users.edit') && user.id !== auth.currentUser?.id"
            class="ua-btn"
            :class="user.is_active ? 'warning' : 'success'"
            @click="toggleUserStatus(user)"
          >{{ user.is_active ? '🔒 تعطيل' : '✅ تفعيل' }}</button>

          <button
            v-if="auth.hasPermission('users.delete') && user.id !== auth.currentUser?.id"
            class="ua-btn danger"
            @click="confirmDeleteUser(user)"
          >🗑️</button>
        </div>
      </div>
    </div>

    <!-- تأكيد الحذف -->
    <AppConfirm
      v-if="showDeleteConfirm"
      title="حذف المستخدم"
      :message="`هل تريد حذف المستخدم ${deletingUser?.name}؟`"
      confirm-label="حذف"
      type="danger"
      @confirm="doDeleteUser"
      @cancel="showDeleteConfirm = false"
    />

  </div>
</template>

<script setup>
import { ref, onMounted }  from 'vue'
import { useRouter }       from 'vue-router'
import { useAuthStore }    from '@/stores/auth.js'
import { useToast }        from '@/composables/useToast.js'
import { db }              from '@/database/db.js'
import AppConfirm          from '@/components/common/AppConfirm.vue'

const router = useRouter()
const auth   = useAuthStore()
const toast  = useToast()

const users             = ref([])
const isLoading         = ref(false)
const showDeleteConfirm = ref(false)
const deletingUser      = ref(null)

onMounted(loadUsers)

async function loadUsers() {
  isLoading.value = true
  users.value     = await db.users.orderBy('name').toArray()
  isLoading.value = false
}

function roleLabel(role) {
  return { admin: 'مدير النظام', accountant: 'محاسب', employee: 'موظف' }[role] ?? role
}

function getAvatarGradient(name) {
  const g = [
    'linear-gradient(135deg,#1D4ED8,#7C3AED)',
    'linear-gradient(135deg,#059669,#0891B2)',
    'linear-gradient(135deg,#D97706,#DC2626)',
  ]
  return g[name.charCodeAt(0) % g.length]
}

async function toggleUserStatus(user) {
  const newStatus = user.is_active ? 0 : 1
  await db.users.update(user.id, { is_active: newStatus, updated_at: new Date().toISOString() })
  toast.success(newStatus ? 'تم تفعيل المستخدم' : 'تم تعطيل المستخدم')
  await loadUsers()
}

function confirmDeleteUser(user) {
  deletingUser.value      = user
  showDeleteConfirm.value = true
}

async function doDeleteUser() {
  showDeleteConfirm.value = false
  await db.users.delete(deletingUser.value.id)
  toast.success('تم حذف المستخدم')
  await loadUsers()
}
</script>

<style scoped>
.users-view { display: flex; flex-direction: column; min-height: 100%; }

.page-header {
  background: var(--bg-secondary); padding: 14px;
  border-bottom: 1px solid var(--border-color);
  position: sticky; top: 0; z-index: 10;
}
.header-top { display: flex; align-items: center; justify-content: space-between; }
.header-top h1 { font-size: 1.2rem; font-weight: 800; color: var(--text-primary); }

.btn-primary {
  padding: 9px 16px; background: linear-gradient(135deg,#1D4ED8,#1E40AF);
  border: none; border-radius: 11px; color: white;
  font-family: 'Cairo', sans-serif; font-size: 0.88rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; gap: 4px;
  box-shadow: 0 4px 12px rgba(29,78,216,0.3);
}

.center-state {
  display: flex; align-items: center; justify-content: center; padding: 60px;
}
.spinner {
  width: 32px; height: 32px; border: 3px solid rgba(59,130,246,0.2);
  border-top-color: #3B82F6; border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.users-list { display: flex; flex-direction: column; gap: 8px; padding: 8px; }

.user-card {
  background: var(--card-bg); border: 1px solid var(--border-color);
  border-radius: 14px; padding: 14px;
  display: flex; flex-direction: column; gap: 10px;
}

.user-main { display: flex; align-items: center; gap: 12px; }

.user-avatar-wrap { position: relative; flex-shrink: 0; }

.user-avatar-img,
.user-avatar-placeholder {
  width: 52px; height: 52px; border-radius: 14px;
  object-fit: cover;
}

.user-avatar-placeholder {
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem; font-weight: 700; color: white;
}

.status-dot {
  position: absolute; bottom: 2px; left: 2px;
  width: 10px; height: 10px; border-radius: 50%;
  border: 2px solid var(--bg-secondary);
}
.status-dot.active   { background: #34D399; }
.status-dot.inactive { background: #F87171; }

.user-info { flex: 1; min-width: 0; }
.user-info h3 {
  font-size: 1rem; font-weight: 800; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.user-username { font-size: 0.78rem; color: var(--text-muted); font-family: monospace; }

.user-tags { display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap; }

.role-badge {
  padding: 2px 8px; border-radius: 99px; font-size: 0.7rem; font-weight: 600;
}
.role-badge.admin      { background: rgba(245,158,11,0.15); color: #FBBF24; }
.role-badge.accountant { background: rgba(59,130,246,0.15); color: #60A5FA; }
.role-badge.employee   { background: rgba(100,116,139,0.15);color: #94A3B8; }

.status-badge {
  padding: 2px 8px; border-radius: 99px; font-size: 0.7rem; font-weight: 600;
}
.status-badge.active   { background: rgba(16,185,129,0.15); color: #34D399; }
.status-badge.inactive { background: rgba(239,68,68,0.15);  color: #FCA5A5; }

.user-phone {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.82rem; color: var(--text-secondary);
}
.user-phone a { color: #60A5FA; text-decoration: none; }

.user-actions { display: flex; gap: 6px; flex-wrap: wrap; }

.ua-btn {
  padding: 7px 14px; border-radius: 9px; border: none;
  font-family: 'Cairo', sans-serif; font-size: 0.8rem; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.15s;
}
.ua-btn.info    { background: rgba(59,130,246,0.15); color: #60A5FA; }
.ua-btn.success { background: rgba(16,185,129,0.15); color: #34D399; }
.ua-btn.warning { background: rgba(245,158,11,0.15); color: #FBBF24; }
.ua-btn.danger  { background: rgba(239,68,68,0.15);  color: #FCA5A5; }
.ua-btn:hover   { filter: brightness(1.2); }
</style>