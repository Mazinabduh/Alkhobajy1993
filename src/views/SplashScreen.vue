<template>
  <div class="splash-screen" :class="{ 'fade-out': isFading }">

    <!-- خلفية متحركة -->
    <div class="electric-bg">
      <div class="lightning-bolt bolt-1">⚡</div>
      <div class="lightning-bolt bolt-2">⚡</div>
      <div class="lightning-bolt bolt-3">⚡</div>

      <!-- دوائر متحركة -->
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>

      <!-- خطوط الشبكة -->
      <svg class="grid-lines" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59,130,246,0.1)" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
    </div>

    <!-- المحتوى الرئيسي -->
    <div class="splash-content" :class="{ 'content-visible': contentVisible }">

      <!-- الشعار -->
      <div class="logo-container">
        <div class="logo-ring logo-ring-outer"></div>
        <div class="logo-ring logo-ring-inner"></div>
        <div class="logo-icon">
          <svg viewBox="0 0 100 100" class="bolt-svg">
            <defs>
              <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stop-color="#F59E0B"/>
                <stop offset="100%" stop-color="#1E40AF"/>
              </linearGradient>
            </defs>
            <polygon
              points="60,5 25,55 50,55 40,95 75,45 50,45"
              fill="url(#boltGrad)"
              filter="drop-shadow(0 0 8px rgba(245,158,11,0.8))"
            />
          </svg>
        </div>
      </div>

      <!-- اسم المحطة -->
      <h1 class="station-name">محطة الخبجي</h1>
      <h2 class="station-sub">الكهربائية</h2>

      <!-- شريط التحميل -->
      <div class="loading-bar-container">
        <div class="loading-bar" :style="{ width: loadingProgress + '%' }"></div>
      </div>
      <p class="loading-text">{{ loadingText }}</p>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter }      from 'vue-router'
import { useAuthStore }   from '@/stores/auth.js'
import { seedDatabase }   from '@/database/seeds.js'

const router         = useRouter()
const auth           = useAuthStore()
const contentVisible = ref(false)
const isFading       = ref(false)
const loadingProgress = ref(0)
const loadingText     = ref('جاري التهيئة...')

const steps = [
  { progress: 20,  text: 'تحميل قاعدة البيانات...',  delay: 400  },
  { progress: 40,  text: 'إعداد النظام...',           delay: 700  },
  { progress: 60,  text: 'تحميل الإعدادات...',        delay: 1000 },
  { progress: 80,  text: 'التحقق من الجلسة...',       delay: 1300 },
  { progress: 100, text: 'جاهز!',                     delay: 1600 },
]

onMounted(async () => {
  // إظهار المحتوى بعد لحظة
  setTimeout(() => { contentVisible.value = true }, 100)

  // تهيئة قاعدة البيانات
  await seedDatabase()

  // خطوات التحميل المتتالية
  for (const step of steps) {
    await delay(step.delay - (steps[steps.indexOf(step) - 1]?.delay ?? 0))
    loadingProgress.value = step.progress
    loadingText.value     = step.text
  }

  await delay(400)

  // التحقق من الجلسة المحفوظة
  const hasSession = await auth.initSession()

  // تلاشي وانتقال
  isFading.value = true
  await delay(600)

  router.replace(hasSession ? '/' : '/login')
})

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}
</script>

<style scoped>
.splash-screen {
  position: fixed;
  inset: 0;
  background: #0F172A;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: opacity 0.6s ease;
  z-index: 9999;
}

.splash-screen.fade-out {
  opacity: 0;
  pointer-events: none;
}

/* ─── الخلفية الكهربائية ─────────────────────── */
.electric-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.grid-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(59, 130, 246, 0.2);
  animation: expandCircle 4s ease-out infinite;
}

.circle-1 {
  width: 200px;  height: 200px;
  top: 50%;      left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 0s;
}
.circle-2 {
  width: 350px;  height: 350px;
  top: 50%;      left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 1s;
}
.circle-3 {
  width: 500px;  height: 500px;
  top: 50%;      left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 2s;
}

@keyframes expandCircle {
  0%   { opacity: 0.8; transform: translate(-50%,-50%) scale(0.5); }
  100% { opacity: 0;   transform: translate(-50%,-50%) scale(1.5); }
}

.lightning-bolt {
  position: absolute;
  font-size: 2rem;
  animation: floatBolt 3s ease-in-out infinite;
  opacity: 0.15;
}
.bolt-1 { top: 15%; left: 10%;  animation-delay: 0s;   }
.bolt-2 { top: 70%; right: 15%; animation-delay: 1s;   }
.bolt-3 { top: 40%; right: 5%;  animation-delay: 2s;   }

@keyframes floatBolt {
  0%, 100% { transform: translateY(0) rotate(-15deg);   opacity: 0.15; }
  50%       { transform: translateY(-15px) rotate(15deg); opacity: 0.35; }
}

/* ─── المحتوى ────────────────────────────────── */
.splash-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.splash-content.content-visible {
  opacity: 1;
  transform: translateY(0);
}

/* ─── الشعار ─────────────────────────────────── */
.logo-container {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.logo-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
}

.logo-ring-outer {
  width: 120px;
  height: 120px;
  border-top-color:  #1E40AF;
  border-right-color: #1E40AF;
  animation: spinRing 2s linear infinite;
}

.logo-ring-inner {
  width: 90px;
  height: 90px;
  border-bottom-color: #F59E0B;
  border-left-color:   #F59E0B;
  animation: spinRing 1.5s linear infinite reverse;
}

@keyframes spinRing {
  to { transform: rotate(360deg); }
}

.logo-icon {
  width: 60px;
  height: 60px;
  background: rgba(30, 64, 175, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.bolt-svg {
  width: 36px;
  height: 36px;
  animation: pulseBolt 1.5s ease-in-out infinite;
}

@keyframes pulseBolt {
  0%, 100% { filter: drop-shadow(0 0 8px rgba(245,158,11,0.8));  }
  50%       { filter: drop-shadow(0 0 20px rgba(245,158,11,1.0)); }
}

/* ─── النصوص ─────────────────────────────────── */
.station-name {
  font-size: 1.75rem;
  font-weight: 800;
  color: #F1F5F9;
  letter-spacing: -0.5px;
  text-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
  margin: 0;
}

.station-sub {
  font-size: 1.1rem;
  font-weight: 500;
  color: #F59E0B;
  margin: 0;
  letter-spacing: 2px;
}

/* ─── شريط التحميل ───────────────────────────── */
.loading-bar-container {
  width: 200px;
  height: 4px;
  background: rgba(255,255,255,0.1);
  border-radius: 99px;
  overflow: hidden;
  margin-top: 24px;
}

.loading-bar {
  height: 100%;
  background: linear-gradient(90deg, #1E40AF, #F59E0B);
  border-radius: 99px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(245,158,11,0.5);
}

.loading-text {
  font-size: 0.8rem;
  color: #64748B;
  margin: 0;
  font-weight: 400;
}
</style>