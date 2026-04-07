<template>
  <div class="settings-view" dir="rtl">

    <div class="page-header">
      <h1>⚙️ الإعدادات</h1>
    </div>

    <!-- التبويبات -->
    <div class="tabs-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span>{{ tab.icon }}</span>
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- إعدادات المحطة -->
    <div v-if="activeTab === 'station'" class="tab-content">
      <div class="settings-section">
        <h2 class="sec-title">🏭 بيانات المحطة</h2>

        <div class="logo-upload-area">
          <div class="logo-preview" @click="triggerLogoInput">
            <img v-if="logoPreview" :src="logoPreview" alt="شعار" class="logo-img" />
            <div v-else class="logo-placeholder">⚡</div>
            <div class="logo-overlay">📷 تغيير الشعار</div>
          </div>
          <input ref="logoInputRef" type="file" accept="image/*" hidden @change="onLogoChange" />
        </div>

        <div class="form-group">
          <label>اسم المحطة</label>
          <input v-model="stationForm.name" type="text" class="form-input" />
        </div>

        <div class="form-group">
          <label>رقم التواصل</label>
          <input v-model="stationForm.phone" type="tel" class="form-input" dir="ltr" />
        </div>

        <div class="form-group">
          <label>العنوان</label>
          <textarea v-model="stationForm.address" class="form-textarea" rows="2"></textarea>
        </div>

        <div class="form-group">
          <label>رسالة التذييل (أسفل الفواتير)</label>
          <textarea v-model="stationForm.footer" class="form-textarea" rows="2"></textarea>
        </div>

        <button class="btn-save" @click="saveStationSettings" :disabled="isSaving.station">
          <span v-if="isSaving.station" class="spinner-sm"></span>
          💾 حفظ بيانات المحطة
        </button>
      </div>
    </div>

    <!-- إعدادات الفوترة -->
    <div v-if="activeTab === 'billing'" class="tab-content">
      <div class="settings-section">
        <h2 class="sec-title">💰 إعدادات الفوترة</h2>

        <div class="form-group">
          <label>سعر الوحدة (كيلوواط)</label>
          <div class="input-with-suffix">
            <input v-model.number="billingForm.unitPrice" type="number" min="0" step="0.001" class="form-input" dir="ltr" />
            <span class="suffix">{{ billingForm.currency }}</span>
          </div>
        </div>

        <div class="form-group">
          <label>العملة</label>
          <select v-model="billingForm.currency" class="form-select">
            <option value="ر.س">ريال سعودي (ر.س)</option>
            <option value="$">دولار ($)</option>
            <option value="€">يورو (€)</option>
            <option value="ج.م">جنيه مصري (ج.م)</option>
          </select>
        </div>

        <div class="form-group">
          <label>نسبة الضريبة (%)</label>
          <input v-model.number="billingForm.taxRate" type="number" min="0" max="100" step="0.1" class="form-input" dir="ltr" />
        </div>

        <div class="form-group">
          <label>بادئة رقم الفاتورة</label>
          <input v-model="billingForm.invoicePrefix" type="text" class="form-input" dir="ltr" maxlength="10" />
        </div>

        <button class="btn-save" @click="saveBillingSettings" :disabled="isSaving.billing">
          <span v-if="isSaving.billing" class="spinner-sm"></span>
          💾 حفظ إعدادات الفوترة
        </button>
      </div>
    </div>

    <!-- إعدادات الثيم -->
    <div v-if="activeTab === 'theme'" class="tab-content">
      <div class="settings-section">
        <h2 class="sec-title">🎨 الثيم والمظهر</h2>

        <!-- الوضع الليلي/النهاري -->
        <div class="form-group">
          <label>وضع العرض</label>
          <div class="mode-toggle">
            <button
              class="mode-btn"
              :class="{ active: themeForm.mode === 'dark' }"
              @click="setThemeMode('dark')"
            >🌙 داكن</button>
            <button
              class="mode-btn"
              :class="{ active: themeForm.mode === 'light' }"
              @click="setThemeMode('light')"
            >☀️ فاتح</button>
          </div>
        </div>

        <!-- اللون الرئيسي -->
        <div class="form-group">
          <label>اللون الرئيسي</label>
          <div class="color-picker-row">
            <input v-model="themeForm.primary" type="color" class="color-input" @change="applyPreview" />
            <span class="color-value">{{ themeForm.primary }}</span>
            <div class="preset-colors">
              <div
                v-for="color in presetColors"
                :key="color"
                class="preset-dot"
                :style="{ background: color }"
                @click="themeForm.primary = color; applyPreview()"
              ></div>
            </div>
          </div>
        </div>

        <!-- اللون الثانوي -->
        <div class="form-group">
          <label>اللون الثانوي (الكهربائي)</label>
          <div class="color-picker-row">
            <input v-model="themeForm.secondary" type="color" class="color-input" @change="applyPreview" />
            <span class="color-value">{{ themeForm.secondary }}</span>
          </div>
        </div>

        <!-- حجم الخط -->
        <div class="form-group">
          <label>حجم الخط</label>
          <div class="size-toggle">
            <button
              v-for="s in fontSizes"
              :key="s.key"
              class="size-btn"
              :class="{ active: themeForm.fontSize === s.key }"
              :style="{ fontSize: s.preview }"
              @click="themeForm.fontSize = s.key"
            >{{ s.label }}</button>
          </div>
        </div>

        <button class="btn-save" @click="saveThemeSettings" :disabled="isSaving.theme">
          <span v-if="isSaving.theme" class="spinner-sm"></span>
          💾 حفظ إعدادات الثيم
        </button>
      </div>
    </div>

    <!-- الملف الشخصي -->
    <div v-if="activeTab === 'profile'" class="tab-content">
      <div class="settings-section">
        <h2 class="sec-title">👤 الملف الشخصي</h2>

        <div class="profile-avatar-section">
          <div class="profile-avatar" @click="triggerProfileAvatar">
            <img v-if="profileAvatarPreview" :src="profileAvatarPreview" class="pa-img" alt="" />
            <div v-else class="pa-placeholder">{{ auth.userName.charAt(0) }}</div>
            <div class="pa-overlay">📷</div>
          </div>
          <input ref="profileAvatarRef" type="file" accept="image/*" hidden @change="onProfileAvatarChange" />
        </div>

        <div class="form-group">
          <label>الاسم الكامل</label>
          <input v-model="profileForm.name" type="text" class="form-input" />
        </div>

        <div class="form-group">
          <label>رقم الهاتف</label>
          <input v-model="profileForm.phone" type="tel" class="form-input" dir="ltr" />
        </div>

        <div class="form-group">
          <label>كلمة المرور الجديدة (اتركها فارغة إذا لا تريد التغيير)</label>
          <input v-model="profileForm.newPassword" type="password" class="form-input" dir="ltr" autocomplete="new-password" />
        </div>

        <button class="btn-save" @click="saveProfile" :disabled="isSaving.profile">
          <span v-if="isSaving.profile" class="spinner-sm"></span>
          💾 حفظ الملف الشخصي
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted }   from 'vue'
import { useRoute }         from 'vue-router'
import { useSettingsStore } from '@/stores/settings.js'
import { useAuthStore }     from '@/stores/auth.js'
import { useToast }         from '@/composables/useToast.js'
import { hashPassword }     from '@/utils/crypto.js'
import { db }               from '@/database/db.js'

const route    = useRoute()
const settings = useSettingsStore()
const auth     = useAuthStore()
const toast    = useToast()

const activeTab       = ref(route.query.tab === 'profile' ? 'profile' : 'station')
const logoInputRef    = ref(null)
const profileAvatarRef = ref(null)
const logoPreview     = ref(null)
const profileAvatarPreview = ref(null)

const tabs = [
  { key: 'station', label: 'المحطة',  icon: '🏭' },
  { key: 'billing', label: 'الفوترة', icon: '💰' },
  { key: 'theme',   label: 'الثيم',   icon: '🎨' },
  { key: 'profile', label: 'حسابي',   icon: '👤' },
]

const isSaving = ref({ station: false, billing: false, theme: false, profile: false })

const stationForm = ref({ name: '', phone: '', address: '', footer: '' })
const billingForm = ref({ unitPrice: 1, currency: 'ر.س', taxRate: 0, invoicePrefix: 'INV' })
const themeForm   = ref({ mode: 'dark', primary: '#1E40AF', secondary: '#F59E0B', fontSize: 'medium' })
const profileForm = ref({ name: '', phone: '', newPassword: '' })

const presetColors = ['#1E40AF','#7C3AED','#059669','#DC2626','#D97706','#0891B2','#DB2777']
const fontSizes    = [
  { key: 'small',  label: 'صغير',  preview: '12px' },
  { key: 'medium', label: 'متوسط', preview: '14px' },
  { key: 'large',  label: 'كبير',  preview: '16px' },
]

onMounted(async () => {
  await settings.loadSettings()
  stationForm.value = {
    name:    settings.stationName,
    phone:   settings.stationPhone,
    address: settings.stationAddress,
    footer:  settings.footerMessage,
  }
  billingForm.value = {
    unitPrice:     settings.unitPrice,
    currency:      settings.currency,
    taxRate:       settings.taxRate,
    invoicePrefix: settings.invoicePrefix,
  }
  themeForm.value = {
    mode:      settings.themeMode,
    primary:   settings.themePrimary,
    secondary: settings.themeSecondary,
    fontSize:  settings.fontSize,
  }
  logoPreview.value = settings.stationLogo || null

  if (auth.currentUser) {
    profileForm.value.name  = auth.currentUser.name
    profileForm.value.phone = auth.currentUser.phone ?? ''
    profileAvatarPreview.value = auth.currentUser.avatar
  }
})

function triggerLogoInput() { logoInputRef.value?.click() }

function onLogoChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => { logoPreview.value = ev.target.result }
  reader.readAsDataURL(file)
}

function triggerProfileAvatar() { profileAvatarRef.value?.click() }

function onProfileAvatarChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => { profileAvatarPreview.value = ev.target.result }
  reader.readAsDataURL(file)
}

async function saveStationSettings() {
  isSaving.value.station = true
  try {
    await settings.saveAll({
      station_name:    stationForm.value.name,
      station_phone:   stationForm.value.phone,
      station_address: stationForm.value.address,
      footer_message:  stationForm.value.footer,
      station_logo:    logoPreview.value ?? '',
    })
    toast.success('تم حفظ بيانات المحطة')
  } finally {
    isSaving.value.station = false
  }
}

async function saveBillingSettings() {
  isSaving.value.billing = true
  try {
    await settings.saveAll({
      unit_price:      String(billingForm.value.unitPrice),
      currency:        billingForm.value.currency,
      tax_rate:        String(billingForm.value.taxRate),
      invoice_prefix:  billingForm.value.invoicePrefix,
    })
    toast.success('تم حفظ إعدادات الفوترة')
  } finally {
    isSaving.value.billing = false
  }
}

function setThemeMode(mode) {
  themeForm.value.mode = mode
  applyPreview()
}

function applyPreview() {
  const root = document.documentElement
  root.style.setProperty('--primary', themeForm.value.primary)
  root.style.setProperty('--secondary', themeForm.value.secondary)
  root.classList.toggle('theme-dark',  themeForm.value.mode === 'dark')
  root.classList.toggle('theme-light', themeForm.value.mode === 'light')
}

async function saveThemeSettings() {
  isSaving.value.theme = true
  try {
    await settings.saveAll({
      theme_mode:      themeForm.value.mode,
      theme_primary:   themeForm.value.primary,
      theme_secondary: themeForm.value.secondary,
      font_size:       themeForm.value.fontSize,
    })
    settings.applyTheme()
    toast.success('تم حفظ إعدادات الثيم')
  } finally {
    isSaving.value.theme = false
  }
}

async function saveProfile() {
  isSaving.value.profile = true
  try {
    const updates = {
      name:       profileForm.value.name,
      phone:      profileForm.value.phone,
      avatar:     profileAvatarPreview.value,
      updated_at: new Date().toISOString(),
    }

    if (profileForm.value.newPassword) {
      updates.password = await hashPassword(profileForm.value.newPassword)
    }

    await db.users.update(auth.currentUser.id, updates)

    // تحديث الجلسة
    auth.currentUser.name   = profileForm.value.name
    auth.currentUser.phone  = profileForm.value.phone
    auth.currentUser.avatar = profileAvatarPreview.value

    toast.success('تم حفظ الملف الشخصي')
    profileForm.value.newPassword = ''
  } finally {
    isSaving.value.profile = false
  }
}
</script>

<style scoped>
.settings-view { display: flex; flex-direction: column; min-height: 100%; }

.page-header {
  background: var(--bg-secondary); padding: 14px;
  border-bottom: 1px solid var(--border-color);
}
.page-header h1 { font-size: 1.2rem; font-weight: 800; color: var(--text-primary); }

.tabs-bar {
  display: flex; background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color); overflow-x: auto;
}
.tab-btn {
  flex: 1; min-width: 70px; display: flex; flex-direction: column; align-items: center;
  gap: 2px; padding: 10px 4px; border: none; background: transparent;
  color: var(--text-muted); font-family: 'Cairo', sans-serif; font-size: 0.72rem;
  font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s;
  white-space: nowrap;
}
.tab-btn span:first-child { font-size: 1.1rem; }
.tab-btn.active { color: var(--primary,#3B82F6); border-bottom-color: var(--primary,#3B82F6); }

.tab-content { flex: 1; }

.settings-section {
  background: var(--bg-secondary); margin: 8px; border-radius: 14px;
  padding: 16px; border: 1px solid var(--border-color);
  display: flex; flex-direction: column; gap: 14px;
}

.sec-title { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }

/* شعار المحطة */
.logo-upload-area { display: flex; justify-content: center; }
.logo-preview {
  width: 80px; height: 80px; border-radius: 16px;
  border: 2px dashed rgba(59,130,246,0.4); cursor: pointer;
  position: relative; overflow: hidden; display: flex;
  align-items: center; justify-content: center;
}
.logo-img { width: 100%; height: 100%; object-fit: contain; }
.logo-placeholder { font-size: 2.5rem; }
.logo-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; color: white; opacity: 0; transition: opacity 0.2s; text-align: center;
}
.logo-preview:hover .logo-overlay { opacity: 1; }

/* حقول النموذج */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }

.form-input, .form-select, .form-textarea {
  width: 100%; padding: 11px 14px; background: var(--bg-input);
  border: 1.5px solid var(--border-input); border-radius: 11px;
  color: var(--text-primary); font-family: 'Cairo', sans-serif;
  font-size: 0.875rem; outline: none; -webkit-appearance: none;
  transition: border-color 0.2s;
}
.form-input:focus, .form-select:focus { border-color: var(--primary,#3B82F6); }
.form-textarea { resize: vertical; min-height: 60px; }

.input-with-suffix { position: relative; display: flex; align-items: center; }
.input-with-suffix .form-input { padding-left: 50px; }
.suffix { position: absolute; left: 12px; font-size: 0.82rem; color: var(--text-muted); }

/* وضع العرض */
.mode-toggle { display: flex; gap: 8px; }
.mode-btn {
  flex: 1; padding: 11px; border-radius: 11px; border: 1.5px solid var(--border-color);
  background: transparent; color: var(--text-secondary); font-family: 'Cairo', sans-serif;
  font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.mode-btn.active { border-color: var(--primary,#3B82F6); background: rgba(59,130,246,0.1); color: #60A5FA; }

/* منتقي الألوان */
.color-picker-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.color-input {
  width: 48px; height: 40px; border: 2px solid var(--border-color);
  border-radius: 10px; cursor: pointer; padding: 2px; background: transparent;
  -webkit-appearance: none;
}
.color-value { font-size: 0.8rem; font-family: monospace; color: var(--text-muted); }
.preset-colors { display: flex; gap: 6px; }
.preset-dot {
  width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
  border: 2px solid transparent; transition: all 0.15s;
}
.preset-dot:hover { transform: scale(1.2); border-color: white; }

/* حجم الخط */
.size-toggle { display: flex; gap: 6px; }
.size-btn {
  flex: 1; padding: 10px; border-radius: 10px; border: 1.5px solid var(--border-color);
  background: transparent; color: var(--text-secondary); font-family: 'Cairo', sans-serif;
  font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.size-btn.active { border-color: var(--primary,#3B82F6); background: rgba(59,130,246,0.1); color: #60A5FA; }

/* الأفاتار الشخصي */
.profile-avatar-section { display: flex; justify-content: center; }
.profile-avatar {
  width: 80px; height: 80px; border-radius: 20px;
  position: relative; cursor: pointer; overflow: hidden;
  border: 3px solid rgba(59,130,246,0.3);
}
.pa-img { width: 100%; height: 100%; object-fit: cover; }
.pa-placeholder {
  width: 100%; height: 100%;
  background: linear-gradient(135deg,#1D4ED8,#7C3AED);
  display: flex; align-items: center; justify-content: center;
  font-size: 2rem; font-weight: 700; color: white;
}
.pa-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; opacity: 0; transition: opacity 0.2s;
}
.profile-avatar:hover .pa-overlay { opacity: 1; }

/* زر الحفظ */
.btn-save {
  width: 100%; padding: 13px; border: none; border-radius: 12px;
  background: linear-gradient(135deg,#1D4ED8,#1E40AF); color: white;
  font-family: 'Cairo', sans-serif; font-size: 0.95rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: all 0.2s; box-shadow: 0 4px 12px rgba(29,78,216,0.3);
  margin-top: 4px;
}
.btn-save:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(29,78,216,0.4); }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner-sm {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>