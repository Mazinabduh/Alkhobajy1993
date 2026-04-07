<template>
  <div class="login-page" dir="rtl">

    <!-- خلفية متحركة -->
    <div class="login-bg">
      <div class="bg-gradient"></div>
      <div class="bg-particles">
        <span v-for="i in 20" :key="i" class="particle" :style="particleStyle(i)"></span>
      </div>
    </div>

    <!-- بطاقة تسجيل الدخول -->
    <div class="login-container">

      <!-- الشعار -->
      <div class="login-logo">
        <div class="logo-glow">
          <svg viewBox="0 0 100 100" class="w-16 h-16">
            <defs>
              <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stop-color="#F59E0B"/>
                <stop offset="100%" stop-color="#3B82F6"/>
              </linearGradient>
            </defs>
            <polygon points="60,5 25,55 50,55 40,95 75,45 50,45" fill="url(#lg)"/>
          </svg>
        </div>
        <div v-if="stationLogo" class="station-logo">
          <img :src="stationLogo" alt="شعار المحطة" />
        </div>
      </div>

      <!-- العنوان -->
      <div class="login-header">
        <h1>{{ stationName }}</h1>
        <p>نظام الإدارة المتكامل</p>
      </div>

      <!-- نموذج الدخول -->
      <form class="login-form" @submit.prevent="handleLogin" novalidate>

        <!-- اسم المستخدم -->
        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">👤</span>
            اسم المستخدم
          </label>
          <div class="input-wrapper" :class="{ 'input-error': errors.username }">
            <input
              v-model="form.username"
              type="text"
              class="form-input"
              autocomplete="username"
              inputmode="text"
              @input="clearError('username')"
            />
            <span class="input-icon">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </span>
          </div>
          <p v-if="errors.username" class="error-text">{{ errors.username }}</p>
        </div>

        <!-- كلمة المرور -->
        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">🔐</span>
            كلمة المرور
          </label>
          <div class="input-wrapper" :class="{ 'input-error': errors.password }">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              autocomplete="current-password"
              @input="clearError('password')"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
            >
              <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
              </svg>
            </button>
          </div>
          <p v-if="errors.password" class="error-text">{{ errors.password }}</p>
        </div>

        <!-- تذكرني -->
        <div class="remember-row">
          <label class="remember-label">
            <div class="custom-checkbox" :class="{ checked: form.remember }" @click="form.remember = !form.remember">
              <svg v-if="form.remember" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <span>تذكرني</span>
          </label>
        </div>

        <!-- رسالة الخطأ العامة -->
        <div v-if="auth.error" class="error-alert">
          <span>⚠️</span>
          <span>{{ auth.error }}</span>
        </div>

        <!-- زر الدخول -->
        <button
          type="submit"
          class="login-btn"
          :disabled="auth.isLoading"
        >
          <span v-if="auth.isLoading" class="loading-spinner"></span>
          <span v-else>
            <span class="btn-icon">⚡</span>
            دخول
          </span>
        </button>

      </form>

      <!-- Footer -->
      <p class="login-footer">محطة الخبجي الكهربائية &copy; {{ new Date().getFullYear() }}</p>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter }    from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { db }           from '@/database/db.js'

const router = useRouter()
const auth   = useAuthStore()

const form = ref({ username: '', password: '', remember: false })
const errors = ref({ username: '', password: '' })
const showPassword = ref(false)
const stationName  = ref('محطة الخبجي الكهربائية')
const stationLogo  = ref(null)

onMounted(async () => {
  // جلب اسم وشعار المحطة من الإعدادات
  const name = await db.settings.get('station_name')
  const logo = await db.settings.get('station_logo')
  if (name?.value) stationName.value = name.value
  if (logo?.value) stationLogo.value = logo.value
})

function clearError(field) {
  errors.value[field] = ''
  auth.error = null
}

function validate() {
  let valid = true
  if (!form.value.username.trim()) {
    errors.value.username = 'اسم المستخدم مطلوب'
    valid = false
  }
  if (!form.value.password.trim()) {
    errors.value.password = 'كلمة المرور مطلوبة'
    valid = false
  }
  return valid
}

async function handleLogin() {
  if (!validate()) return

  const success = await auth.login(
    form.value.username.trim(),
    form.value.password,
    form.value.remember
  )

  if (success) {
    router.replace('/')
  }
}

function particleStyle(i) {
  const size  = Math.random() * 4 + 2
  const x     = Math.random() * 100
  const y     = Math.random() * 100
  const delay = Math.random() * 5
  const dur   = Math.random() * 10 + 10
  return {
    width:       size + 'px',
    height:      size + 'px',
    left:        x + '%',
    top:         y + '%',
    animationDelay: delay + 's',
    animationDuration: dur + 's',
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 20px;
  background: #0F172A;
  font-family: 'Cairo', sans-serif;
}

/* ─── الخلفية ────────────────────────────────── */
.login-bg {
  position: absolute;
  inset: 0;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 20% 10%, rgba(30,64,175,0.3) 0%, transparent 60%),
    radial-gradient(ellipse 60% 80% at 80% 90%, rgba(245,158,11,0.15) 0%, transparent 60%);
}

.particle {
  position: absolute;
  background: #3B82F6;
  border-radius: 50%;
  opacity: 0;
  animation: particleFloat linear infinite;
}

@keyframes particleFloat {
  0%   { opacity: 0;   transform: translateY(0)     scale(1); }
  10%  { opacity: 0.6; }
  90%  { opacity: 0.3; }
  100% { opacity: 0;   transform: translateY(-100px) scale(0.5); }
}

/* ─── البطاقة ────────────────────────────────── */
.login-container {
  position: relative;
  width: 100%;
  max-width: 380px;
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 24px;
  padding: 32px 28px;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.05),
    0 25px 50px rgba(0,0,0,0.5);
  animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleIn {
  0%   { opacity: 0; transform: scale(0.9) translateY(20px); }
  100% { opacity: 1; transform: scale(1)   translateY(0); }
}

/* ─── الشعار ─────────────────────────────────── */
.login-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.logo-glow {
  width: 72px;
  height: 72px;
  background: rgba(30, 64, 175, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(59, 130, 246, 0.4);
  box-shadow:
    0 0 20px rgba(59, 130, 246, 0.3),
    inset 0 0 20px rgba(30, 64, 175, 0.2);
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from { box-shadow: 0 0 10px rgba(59,130,246,0.3); }
  to   { box-shadow: 0 0 30px rgba(59,130,246,0.6); }
}

.station-logo img {
  height: 48px;
  object-fit: contain;
  border-radius: 8px;
}

/* ─── العنوان ────────────────────────────────── */
.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-header h1 {
  font-size: 1.3rem;
  font-weight: 800;
  color: #F1F5F9;
  margin: 0 0 4px;
}

.login-header p {
  font-size: 0.85rem;
  color: #64748B;
  margin: 0;
}

/* ─── النموذج ────────────────────────────────── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #94A3B8;
  display: flex;
  align-items: center;
  gap: 6px;
}

.label-icon { font-size: 0.9rem; }

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 13px 44px 13px 44px;
  background: rgba(15, 23, 42, 0.6);
  border: 1.5px solid rgba(71, 85, 105, 0.5);
  border-radius: 12px;
  color: #F1F5F9;
  font-size: 0.95rem;
  font-family: 'Cairo', sans-serif;
  transition: all 0.2s ease;
  outline: none;
  -webkit-appearance: none;
  direction: rtl;
}

.form-input:focus {
  border-color: #3B82F6;
  background: rgba(15, 23, 42, 0.8);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.input-wrapper.input-error .form-input {
  border-color: #EF4444;
}

.input-icon {
  position: absolute;
  right: 13px;
  color: #64748B;
  pointer-events: none;
  display: flex;
  align-items: center;
}

.password-toggle {
  position: absolute;
  left: 13px;
  color: #64748B;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.password-toggle:hover { color: #94A3B8; }

.error-text {
  font-size: 0.78rem;
  color: #EF4444;
  margin: 0;
}

/* ─── تذكرني ─────────────────────────────────── */
.remember-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.remember-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #94A3B8;
  user-select: none;
}

.custom-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 2px solid #475569;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.custom-checkbox.checked {
  background: #3B82F6;
  border-color: #3B82F6;
}

/* ─── رسالة الخطأ ────────────────────────────── */
.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #FCA5A5;
  font-size: 0.85rem;
}

/* ─── زر الدخول ──────────────────────────────── */
.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #1D4ED8, #1E40AF);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1.05rem;
  font-weight: 700;
  font-family: 'Cairo', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(29, 78, 216, 0.4);
  position: relative;
  overflow: hidden;
}

.login-btn::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transition: left 0.4s ease;
}

.login-btn:hover:not(:disabled)::before { left: 100%; }
.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(29, 78, 216, 0.5);
}
.login-btn:active:not(:disabled) { transform: translateY(0); }
.login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-icon { font-size: 1.1rem; }

.loading-spinner {
  width: 20px; height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Footer ─────────────────────────────────── */
.login-footer {
  text-align: center;
  font-size: 0.75rem;
  color: #334155;
  margin: 24px 0 0;
}
</style>