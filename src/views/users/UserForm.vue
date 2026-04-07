<template>
  <div class="form-view" dir="rtl">

    <div class="form-header">
      <button class="back-btn" @click="router.back()">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      <h1>{{ isEdit ? 'تعديل مستخدم' : 'إضافة مستخدم' }}</h1>
      <div class="w-10"></div>
    </div>

    <form class="form-body" @submit.prevent="handleSubmit" novalidate>

      <!-- الصورة الشخصية -->
      <div class="avatar-section">
        <div class="avatar-preview" @click="triggerFileInput">
          <img v-if="previewAvatar" :src="previewAvatar" class="avatar-img" alt="" />
          <div v-else class="avatar-initials" :style="{ background: gradientColor }">
            {{ (form.name || '?').charAt(0) }}
          </div>
          <div class="avatar-overlay">
            <span>📷</span>
          </div>
        </div>
        <input ref="fileInput" type="file" accept="image/*" hidden @change="onAvatarChange" />
        <p class="avatar-hint">اضغط لاختيار صورة</p>
      </div>

      <!-- البيانات الأساسية -->
      <div class="form-section">
        <h2 class="section-title">📋 البيانات الأساسية</h2>

        <div class="form-group" :class="{ error: errors.name }">
          <label>الاسم الكامل <span class="req">*</span></label>
          <input v-model="form.name" type="text" class="form-input" placeholder="اسم المستخدم الكامل" />
          <p v-if="errors.name" class="err-msg">{{ errors.name }}</p>
        </div>

        <div class="form-group" :class="{ error: errors.username }">
          <label>اسم الدخول <span class="req">*</span></label>
          <input
            v-model="form.username"
            type="text"
            class="form-input"
            placeholder="username"
            dir="ltr"
            autocomplete="off"
          />
          <p v-if="errors.username" class="err-msg">{{ errors.username }}</p>
        </div>

        <div class="form-group">
          <label>رقم الهاتف</label>
          <input v-model="form.phone" type="tel" class="form-input" placeholder="05xxxxxxxx" dir="ltr" />
        </div>

        <div class="form-group">
          <label>الدور الوظيفي</label>
          <div class="role-toggle">
            <button
              v-for="role in roles"
              :key="role.key"
              type="button"
              class="role-btn"
              :class="{ active: form.role === role.key }"
              @click="form.role = role.key"
            >
              <span>{{ role.icon }}</span>
              <span>{{ role.label }}</span>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>الحالة</label>
          <div class="status-toggle">
            <button type="button" class="toggle-btn" :class="{ active: form.is_active }" @click="form.is_active = true">✅ نشط</button>
            <button type="button" class="toggle-btn" :class="{ active: !form.is_active }" @click="form.is_active = false">🔒 معطل</button>
          </div>
        </div>
      </div>

      <!-- كلمة المرور -->
      <div class="form-section">
        <h2 class="section-title">🔐 {{ isEdit ? 'تغيير كلمة المرور' : 'كلمة المرور' }}</h2>

        <p v-if="isEdit" class="section-hint">اتركها فارغة إذا لم تريد التغيير</p>

        <div class="form-group" :class="{ error: errors.password }">
          <label>كلمة المرور {{ !isEdit ? '*' : '' }}</label>
          <div class="pwd-wrap">
            <input
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              class="form-input"
              placeholder="••••••••"
              autocomplete="new-password"
              dir="ltr"
            />
            <button type="button" class="pwd-toggle" @click="showPwd = !showPwd">
              {{ showPwd ? '🙈' : '👁️' }}
            </button>
          </div>
          <p v-if="errors.password" class="err-msg">{{ errors.password }}</p>
        </div>

        <div class="form-group" v-if="form.password">
          <label>تأكيد كلمة المرور</label>
          <div class="pwd-wrap">
            <input
              v-model="form.confirmPassword"
              :type="showPwd ? 'text' : 'password'"
              class="form-input"
              placeholder="••••••••"
              dir="ltr"
              :class="{ 'border-error': form.confirmPassword && form.password !== form.confirmPassword }"
            />
          </div>
          <p v-if="form.confirmPassword && form.password !== form.confirmPassword" class="err-msg">
            كلمتا المرور غير متطابقتين
          </p>
        </div>
      </div>

      <!-- الصلاحيات -->
      <div class="form-section" v-if="form.role !== 'admin'">
        <h2 class="section-title">🔐 الصلاحيات التفصيلية</h2>
        <p class="section-hint">يمكنك تخصيص صلاحيات إضافية فوق ما يسمح به الدور</p>

        <div class="permissions-grid">
          <div
            v-for="(perms, module) in allPermissions"
            :key="module"
            class="perm-module"
          >
            <div class="perm-module-header">
              <span class="perm-module-icon">{{ moduleIcon(module) }}</span>
              <strong>{{ moduleLabel(module) }}</strong>
              <button
                type="button"
                class="toggle-all-btn"
                @click="toggleModule(module, perms)"
              >
                {{ isModuleAllSelected(module, perms) ? 'إلغاء الكل' : 'تحديد الكل' }}
              </button>
            </div>
            <div class="perm-items">
              <label
                v-for="perm in perms"
                :key="perm.key"
                class="perm-item"
              >
                <div
                  class="perm-checkbox"
                  :class="{ checked: selectedPerms.includes(perm.key) }"
                  @click="togglePerm(perm.key)"
                >
                  <svg v-if="selectedPerms.includes(perm.key)" class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <span>{{ perm.label }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-cancel" @click="router.back()">إلغاء</button>
        <button type="submit" class="btn-save" :disabled="isSaving">
          <span v-if="isSaving" class="spinner-sm"></span>
          <span v-else>💾</span>
          {{ isEdit ? 'حفظ التعديلات' : 'إضافة المستخدم' }}
        </button>
      </div>

    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute }      from 'vue-router'
import { useAuthStore }             from '@/stores/auth.js'
import { useToast }                 from '@/composables/useToast.js'
import { hashPassword }             from '@/utils/crypto.js'
import { db }                       from '@/database/db.js'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()
const toast  = useToast()

const isEdit       = computed(() => !!route.params.id)
const isSaving     = ref(false)
const showPwd      = ref(false)
const previewAvatar = ref(null)
const fileInput    = ref(null)
const selectedPerms = ref([])

const form = ref({
  name:            '',
  username:        '',
  phone:           '',
  role:           'employee',
  is_active:       true,
  password:        '',
  confirmPassword: '',
  avatar:          null,
})

const errors = ref({ name: '', username: '', password: '' })

const roles = [
  { key: 'admin',      label: 'مدير النظام', icon: '👑' },
  { key: 'accountant', label: 'محاسب',       icon: '💼' },
  { key: 'employee',   label: 'موظف',        icon: '👤' },
]

const gradientColor = computed(() => {
  const g = ['linear-gradient(135deg,#1D4ED8,#7C3AED)', 'linear-gradient(135deg,#059669,#0891B2)']
  return g[form.value.name.charCodeAt(0) % g.length] || g[0]
})

// تعريف جميع الصلاحيات
const allPermissions = {
  subscribers: [
    { key: 'subscribers.view',       label: 'عرض المشتركين' },
    { key: 'subscribers.create',     label: 'إضافة مشترك' },
    { key: 'subscribers.edit',       label: 'تعديل مشترك' },
    { key: 'subscribers.delete',     label: 'حذف مشترك' },
    { key: 'subscribers.payment',    label: 'تسجيل السداد' },
    { key: 'subscribers.disconnect', label: 'فصل المشترك' },
    { key: 'subscribers.reconnect',  label: 'تشغيل المشترك' },
    { key: 'subscribers.sms',        label: 'إرسال رسائل' },
    { key: 'subscribers.print',      label: 'طباعة كشف' },
    { key: 'subscribers.statement',  label: 'عرض كشف الحساب' },
  ],
  readings: [
    { key: 'readings.view',   label: 'عرض القراءات' },
    { key: 'readings.create', label: 'إضافة قراءة' },
    { key: 'readings.edit',   label: 'تعديل قراءة' },
    { key: 'readings.delete', label: 'حذف قراءة' },
  ],
  invoices: [
    { key: 'invoices.view',   label: 'عرض الفواتير' },
    { key: 'invoices.create', label: 'إنشاء فاتورة' },
    { key: 'invoices.edit',   label: 'تعديل فاتورة' },
    { key: 'invoices.delete', label: 'حذف فاتورة' },
    { key: 'invoices.print',  label: 'طباعة فاتورة' },
  ],
  inventory: [
    { key: 'inventory.view',     label: 'عرض المخزون' },
    { key: 'inventory.create',   label: 'إضافة صنف' },
    { key: 'inventory.edit',     label: 'تعديل صنف' },
    { key: 'inventory.delete',   label: 'حذف صنف' },
    { key: 'inventory.purchase', label: 'شراء للمخزون' },
    { key: 'inventory.consume',  label: 'صرف من المخزون' },
  ],
  expenses: [
    { key: 'expenses.view',   label: 'عرض النفقات' },
    { key: 'expenses.create', label: 'إضافة نفقة' },
    { key: 'expenses.edit',   label: 'تعديل نفقة' },
    { key: 'expenses.delete', label: 'حذف نفقة' },
  ],
  reports: [
    { key: 'reports.view',   label: 'عرض التقارير' },
    { key: 'reports.export', label: 'تصدير التقارير' },
    { key: 'reports.print',  label: 'طباعة التقارير' },
  ],
  users: [
    { key: 'users.view',   label: 'عرض المستخدمين' },
    { key: 'users.create', label: 'إضافة مستخدم' },
    { key: 'users.edit',   label: 'تعديل مستخدم' },
    { key: 'users.delete', label: 'حذف مستخدم' },
  ],
  backup: [
    { key: 'backup.create',  label: 'إنشاء نسخة احتياطية' },
    { key: 'backup.restore', label: 'استعادة البيانات' },
    { key: 'backup.github',  label: 'مزامنة GitHub' },
  ],
  settings: [
    { key: 'settings.view', label: 'عرض الإعدادات' },
    { key: 'settings.edit', label: 'تعديل الإعدادات' },
  ],
}

function moduleLabel(m) {
  return { subscribers:'المشتركون', readings:'القراءات', invoices:'الفواتير',
           inventory:'المخزون', expenses:'النفقات', reports:'التقارير',
           users:'المستخدمون', backup:'النسخ الاحتياطي', settings:'الإعدادات' }[m] ?? m
}

function moduleIcon(m) {
  return { subscribers:'👥', readings:'⚡', invoices:'📄', inventory:'📦',
           expenses:'💸', reports:'📊', users:'👤', backup:'💾', settings:'⚙️' }[m] ?? '🔐'
}

function togglePerm(key) {
  const idx = selectedPerms.value.indexOf(key)
  if (idx === -1) selectedPerms.value.push(key)
  else            selectedPerms.value.splice(idx, 1)
}

function isModuleAllSelected(module, perms) {
  return perms.every(p => selectedPerms.value.includes(p.key))
}

function toggleModule(module, perms) {
  if (isModuleAllSelected(module, perms)) {
    selectedPerms.value = selectedPerms.value.filter(k => !perms.map(p => p.key).includes(k))
  } else {
    perms.forEach(p => {
      if (!selectedPerms.value.includes(p.key)) selectedPerms.value.push(p.key)
    })
  }
}

onMounted(async () => {
  if (isEdit.value) {
    const user = await db.users.get(Number(route.params.id))
    if (user) {
      form.value = {
        name:            user.name,
        username:        user.username,
        phone:           user.phone ?? '',
        role:           user.role,
        is_active:       !!user.is_active,
        password:        '',
        confirmPassword: '',
        avatar:          user.avatar,
      }
      previewAvatar.value = user.avatar
      selectedPerms.value = JSON.parse(user.permissions || '[]')
    }
  }
})

function triggerFileInput() { fileInput.value?.click() }

function onAvatarChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    previewAvatar.value = ev.target.result
    form.value.avatar   = ev.target.result
  }
  reader.readAsDataURL(file)
}

function validate() {
  errors.value = { name: '', username: '', password: '' }
  let valid = true
  if (!form.value.name.trim())     { errors.value.name     = 'الاسم مطلوب'; valid = false }
  if (!form.value.username.trim()) { errors.value.username = 'اسم الدخول مطلوب'; valid = false }
  if (!isEdit.value && !form.value.password) { errors.value.password = 'كلمة المرور مطلوبة'; valid = false }
  if (form.value.password && form.value.password !== form.value.confirmPassword) {
    errors.value.password = 'كلمتا المرور غير متطابقتين'
    valid = false
  }
  return valid
}

async function handleSubmit() {
  if (!validate()) return
  isSaving.value = true

  try {
    const now      = new Date().toISOString()
    const userData = {
      name:        form.value.name.trim(),
      username:    form.value.username.trim().toLowerCase(),
      phone:       form.value.phone.trim(),
      role:       form.value.role,
      is_active:   form.value.is_active ? 1 : 0,
      avatar:      form.value.avatar ?? null,
      permissions: JSON.stringify(form.value.role === 'admin' ? [] : selectedPerms.value),
      updated_at:  now,
    }

    if (form.value.password) {
      userData.password = await hashPassword(form.value.password)
    }

    if (isEdit.value) {
      await db.users.update(Number(route.params.id), userData)
      toast.success('تم تعديل بيانات المستخدم')
    } else {
      await db.users.add({ ...userData, created_at: now })
      toast.success('تم إضافة المستخدم')
    }

    router.back()
  } catch (e) {
    toast.error(e.message)
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.form-view { min-height: 100%; display: flex; flex-direction: column; background: var(--bg-primary); }

.form-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: sticky; top: 0; z-index: 10;
}
.form-header h1 { font-size: 1.05rem; font-weight: 800; color: var(--text-primary); }

.back-btn {
  width: 38px; height: 38px; border-radius: 10px;
  border: 1px solid var(--border-color); background: transparent;
  color: var(--text-secondary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

.form-body { flex: 1; display: flex; flex-direction: column; gap: 0; padding-bottom: 20px; }

/* قسم الصورة */
.avatar-section {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; padding: 20px;
}

.avatar-preview {
  width: 88px; height: 88px; border-radius: 22px;
  position: relative; cursor: pointer; overflow: hidden;
  border: 3px solid rgba(59,130,246,0.3);
  box-shadow: 0 0 20px rgba(59,130,246,0.2);
}

.avatar-img { width: 100%; height: 100%; object-fit: cover; }

.avatar-initials {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; font-weight: 700; color: white;
}

.avatar-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s; font-size: 1.5rem;
}
.avatar-preview:hover .avatar-overlay { opacity: 1; }

.avatar-hint { font-size: 0.75rem; color: var(--text-muted); }

/* أقسام النموذج */
.form-section {
  background: var(--bg-secondary); margin: 8px; border-radius: 16px;
  padding: 16px; border: 1px solid var(--border-color);
  display: flex; flex-direction: column; gap: 14px;
}

.section-title { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
.section-hint  { font-size: 0.78rem; color: var(--text-muted); }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.error .form-input { border-color: #EF4444; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
.req { color: #EF4444; }
.err-msg { font-size: 0.78rem; color: #EF4444; }

.form-input {
  width: 100%; padding: 12px 14px; background: var(--bg-input);
  border: 1.5px solid var(--border-input); border-radius: 12px;
  color: var(--text-primary); font-family: 'Cairo', sans-serif;
  font-size: 0.9rem; outline: none; -webkit-appearance: none;
  transition: border-color 0.2s;
}
.form-input:focus { border-color: var(--primary,#3B82F6); }
.form-input.border-error { border-color: #EF4444; }

/* الدور الوظيفي */
.role-toggle { display: flex; gap: 6px; }
.role-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px 6px; border-radius: 11px; border: 1.5px solid var(--border-color);
  background: transparent; cursor: pointer; font-family: 'Cairo', sans-serif;
  font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); transition: all 0.2s;
}
.role-btn span:first-child { font-size: 1.3rem; }
.role-btn.active { border-color: var(--primary,#3B82F6); background: rgba(59,130,246,0.1); color: #60A5FA; }

/* الحالة */
.status-toggle { display: flex; gap: 8px; }
.toggle-btn {
  flex: 1; padding: 10px; border-radius: 10px; border: 1.5px solid var(--border-color);
  background: transparent; color: var(--text-secondary); font-family: 'Cairo', sans-serif;
  font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.toggle-btn.active { border-color: var(--primary,#3B82F6); background: rgba(59,130,246,0.1); color: #60A5FA; }

/* كلمة المرور */
.pwd-wrap { position: relative; display: flex; align-items: center; }
.pwd-wrap .form-input { padding-left: 44px; }
.pwd-toggle {
  position: absolute; left: 12px; background: none; border: none;
  cursor: pointer; font-size: 1rem; line-height: 1;
}

/* الصلاحيات */
.permissions-grid { display: flex; flex-direction: column; gap: 12px; }

.perm-module {
  border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden;
}

.perm-module-header {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px;
  background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--border-color);
}

.perm-module-icon { font-size: 1rem; }

.perm-module-header strong {
  flex: 1; font-size: 0.85rem; font-weight: 700; color: var(--text-primary);
}

.toggle-all-btn {
  font-size: 0.72rem; color: var(--primary,#3B82F6); background: none;
  border: none; cursor: pointer; font-family: 'Cairo', sans-serif;
}

.perm-items {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0;
  padding: 8px;
}

.perm-item {
  display: flex; align-items: center; gap: 8px; padding: 8px;
  cursor: pointer; border-radius: 8px; transition: background 0.15s;
}
.perm-item:hover { background: rgba(255,255,255,0.04); }

.perm-checkbox {
  width: 18px; height: 18px; border-radius: 5px; border: 2px solid #475569;
  background: transparent; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; flex-shrink: 0;
}
.perm-checkbox.checked { background: var(--primary,#3B82F6); border-color: var(--primary,#3B82F6); }

.check-icon { width: 10px; height: 10px; color: white; }

.perm-item span:last-child { font-size: 0.78rem; color: var(--text-secondary); }

/* أزرار النموذج */
.form-actions {
  display: flex; gap: 10px; padding: 16px; margin: 0 8px;
  position: sticky; bottom: 0; background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  flex: 1; padding: 13px; border-radius: 12px;
  border: 1.5px solid var(--border-color); background: transparent;
  color: var(--text-secondary); font-family: 'Cairo', sans-serif;
  font-size: 0.95rem; font-weight: 600; cursor: pointer;
}

.btn-save {
  flex: 2; padding: 13px; border-radius: 12px; border: none;
  background: linear-gradient(135deg,#1D4ED8,#1E40AF); color: white;
  font-family: 'Cairo', sans-serif; font-size: 0.95rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: all 0.2s; box-shadow: 0 4px 12px rgba(29,78,216,0.3);
}
.btn-save:hover:not(:disabled) { transform: translateY(-2px); }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner-sm {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>