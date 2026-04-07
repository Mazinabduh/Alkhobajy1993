<template>
  <div class="detail-view" dir="rtl" v-if="subscriber">

    <!-- رأس الصفحة -->
    <div class="detail-header">
      <button class="back-btn" @click="router.back()">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      <h1>تفاصيل المشترك</h1>
      <button
        v-if="auth.hasPermission('subscribers.edit')"
        class="edit-btn"
        @click="router.push(`/subscribers/${id}/edit`)"
      >تعديل</button>
    </div>

    <!-- بطاقة الهوية -->
    <div class="identity-card">
      <div class="identity-avatar" :style="{ background: avatarColor }">
        {{ subscriber.name.charAt(0) }}
      </div>
      <div class="identity-info">
        <h2>{{ subscriber.name }}</h2>
        <div class="identity-tags">
          <span class="tag" :class="subscriber.status">
            {{ subscriber.status === 'active' ? '✅ نشط' : '🔌 مفصول' }}
          </span>
          <span v-if="subscriber.zone_name" class="tag zone">📍 {{ subscriber.zone_name }}</span>
        </div>
      </div>
    </div>

    <!-- بطاقات البيانات -->
    <div class="data-cards">

      <!-- بيانات الاتصال -->
      <div class="data-card">
        <h3>📱 بيانات الاتصال</h3>
        <div class="data-row">
          <span class="data-label">رقم الهاتف</span>
          <span class="data-value">
            <a v-if="subscriber.phone" :href="`tel:${subscriber.phone}`" class="phone-link">
              {{ subscriber.phone }}
            </a>
            <span v-else class="text-muted">غير محدد</span>
          </span>
        </div>
        <div class="data-row">
          <span class="data-label">رقم العداد</span>
          <span class="data-value mono">{{ subscriber.meter_number }}</span>
        </div>
        <div class="data-row">
          <span class="data-label">العنوان</span>
          <span class="data-value">{{ subscriber.address || '—' }}</span>
        </div>
        <div class="data-row">
          <span class="data-label">تاريخ الاشتراك</span>
          <span class="data-value">{{ formatDate(subscriber.join_date) }}</span>
        </div>
      </div>

      <!-- البيانات المالية -->
      <div class="data-card financial">
        <h3>💰 الملف المالي</h3>
        <div class="financial-grid">
          <div class="financial-item">
            <span class="fi-label">الرصيد الحالي</span>
            <span class="fi-value" :class="subscriber.balance >= 0 ? 'danger' : 'success'">
              {{ formatMoney(subscriber.balance) }}
            </span>
          </div>
          <div class="financial-item">
            <span class="fi-label">المقدم</span>
            <span class="fi-value neutral">{{ formatMoney(subscriber.deposit) }}</span>
          </div>
          <div class="financial-item">
            <span class="fi-label">آخر قراءة</span>
            <span class="fi-value">{{ lastReading?.current_reading ?? '—' }}</span>
          </div>
          <div class="financial-item">
            <span class="fi-label">آخر استهلاك</span>
            <span class="fi-value">{{ lastReading?.consumption ?? '—' }} كيلوواط</span>
          </div>
        </div>
      </div>

    </div>

    <!-- الأزرار السريعة الكبيرة -->
    <div class="action-grid">
      <button
        v-if="auth.hasPermission('subscribers.payment')"
        class="action-btn success"
        @click="showPayment = true"
      >
        <span class="action-icon">💰</span>
        <span>سداد</span>
      </button>

      <button
        v-if="auth.hasPermission('readings.create')"
        class="action-btn primary"
        @click="router.push(`/readings/new?subscriber=${id}`)"
      >
        <span class="action-icon">⚡</span>
        <span>قراءة جديدة</span>
      </button>

      <button
        v-if="auth.hasPermission('subscribers.statement')"
        class="action-btn info"
        @click="router.push(`/subscribers/${id}/statement`)"
      >
        <span class="action-icon">📊</span>
        <span>كشف حساب</span>
      </button>

      <button
        v-if="subscriber.phone && auth.hasPermission('subscribers.sms')"
        class="action-btn secondary"
        @click="sendSMS"
      >
        <span class="action-icon">💬</span>
        <span>رسالة</span>
      </button>

      <button
        v-if="subscriber.phone"
        class="action-btn neutral"
        @click="callSubscriber"
      >
        <span class="action-icon">📞</span>
        <span>اتصال</span>
      </button>

      <button
        v-if="auth.hasPermission('subscribers.disconnect') || auth.hasPermission('subscribers.reconnect')"
        class="action-btn"
        :class="subscriber.status === 'active' ? 'danger' : 'warning'"
        @click="toggleStatus"
      >
        <span class="action-icon">{{ subscriber.status === 'active' ? '🔌' : '✅' }}</span>
        <span>{{ subscriber.status === 'active' ? 'فصل' : 'تشغيل' }}</span>
      </button>
    </div>

    <!-- تبويبات -->
    <div class="tabs-section">
      <div class="tabs-header">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key; loadTabData(tab.key)"
        >{{ tab.label }}</button>
      </div>

      <!-- الفواتير -->
      <div v-if="activeTab === 'invoices'" class="tab-content">
        <div v-if="tabLoading" class="tab-loading">جاري التحميل...</div>
        <div v-else-if="invoices.length === 0" class="tab-empty">لا توجد فواتير</div>
        <div v-else class="invoice-list">
          <div
            v-for="inv in invoices"
            :key="inv.id"
            class="invoice-row"
            @click="router.push(`/invoices/${inv.id}`)"
          >
            <div class="inv-info">
              <span class="inv-number">{{ inv.invoice_number }}</span>
              <span class="inv-period">{{ inv.period_month }}</span>
            </div>
            <div class="inv-right">
              <span class="inv-amount">{{ formatMoney(inv.total_amount) }}</span>
              <span class="inv-status" :class="inv.status">{{ statusLabel(inv.status) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- القراءات -->
      <div v-if="activeTab === 'readings'" class="tab-content">
        <div v-if="tabLoading" class="tab-loading">جاري التحميل...</div>
        <div v-else-if="readingsList.length === 0" class="tab-empty">لا توجد قراءات</div>
        <div v-else class="readings-list">
          <div
            v-for="r in readingsList"
            :key="r.id"
            class="reading-row"
          >
            <div class="reading-info">
              <span class="reading-date">{{ formatDate(r.reading_date) }}</span>
              <span class="reading-period">{{ r.period_month }}</span>
            </div>
            <div class="reading-values">
              <span class="reading-val">{{ r.previous_reading }} ← {{ r.current_reading }}</span>
              <span class="reading-consumption">{{ r.consumption }} كيلوواط</span>
            </div>
          </div>
        </div>
      </div>

      <!-- المدفوعات -->
      <div v-if="activeTab === 'payments'" class="tab-content">
        <div v-if="tabLoading" class="tab-loading">جاري التحميل...</div>
        <div v-else-if="paymentsList.length === 0" class="tab-empty">لا توجد مدفوعات</div>
        <div v-else class="payments-list">
          <div v-for="p in paymentsList" :key="p.id" class="payment-row">
            <div class="pay-info">
              <span class="pay-date">{{ formatDate(p.payment_date) }}</span>
              <span class="pay-method">{{ methodLabel(p.payment_method) }}</span>
            </div>
            <span class="pay-amount success">+{{ formatMoney(p.amount) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal السداد -->
    <QuickPaymentModal
      v-if="showPayment"
      :subscriber="subscriber"
      @close="showPayment = false"
      @paid="onPaid"
    />

  </div>

  <!-- حالة التحميل -->
  <div v-else class="loading-page">
    <div class="spinner"></div>
    <span>جاري التحميل...</span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute }      from 'vue-router'
import { useAuthStore }             from '@/stores/auth.js'
import { useSubscribersStore }      from '@/stores/subscribers.js'
import { useSettingsStore }         from '@/stores/settings.js'
import { useReadingsStore }         from '@/stores/readings.js'
import { useInvoicesStore }         from '@/stores/invoices.js'
import { useToast }                 from '@/composables/useToast.js'
import QuickPaymentModal            from '@/components/subscribers/QuickPaymentModal.vue'
import { db }                       from '@/database/db.js'

const router   = useRouter()
const route    = useRoute()
const auth     = useAuthStore()
const subStore = useSubscribersStore()
const settings = useSettingsStore()
const readingsStore = useReadingsStore()
const invoicesStore = useInvoicesStore()
const toast    = useToast()

const id          = computed(() => route.params.id)
const subscriber  = ref(null)
const lastReading = ref(null)
const showPayment = ref(false)
const activeTab   = ref('invoices')
const tabLoading  = ref(false)
const invoices    = ref([])
const readingsList = ref([])
const paymentsList = ref([])

const tabs = [
  { key: 'invoices',  label: 'الفواتير' },
  { key: 'readings',  label: 'القراءات' },
  { key: 'payments',  label: 'المدفوعات' },
]

const avatarColor = computed(() => {
  const colors = [
    'linear-gradient(135deg,#1D4ED8,#7C3AED)',
    'linear-gradient(135deg,#059669,#0891B2)',
    'linear-gradient(135deg,#D97706,#DC2626)',
  ]
  const idx = (subscriber.value?.name?.charCodeAt(0) ?? 0) % colors.length
  return colors[idx]
})

onMounted(async () => {
  subscriber.value = await subStore.getById(id.value)
  lastReading.value = await readingsStore.getLastReading(Number(id.value))
  await loadTabData('invoices')
  settings.loadSettings()
})

async function loadTabData(tab) {
  tabLoading.value = true
  try {
    if (tab === 'invoices') {
      invoices.value = await db.invoices
        .where('subscriber_id').equals(Number(id.value))
        .reverse().toArray()
    } else if (tab === 'readings') {
      readingsList.value = await db.readings
        .where('subscriber_id').equals(Number(id.value))
        .reverse().toArray()
    } else if (tab === 'payments') {
      paymentsList.value = await db.payments
        .where('subscriber_id').equals(Number(id.value))
        .reverse().toArray()
    }
  } finally {
    tabLoading.value = false
  }
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatMoney(v) {
  return Number(v || 0).toLocaleString('ar-SA') + ' ' + settings.currency
}

function callSubscriber() {
  if (subscriber.value?.phone) window.location.href = `tel:${subscriber.value.phone}`
}

function sendSMS() {
  router.push(`/messages?subscriber=${id.value}`)
}

async function toggleStatus() {
  const current  = subscriber.value.status
  const newSt    = current === 'active' ? 'disconnected' : 'active'
  await subStore.setStatus(id.value, newSt)
  subscriber.value.status = newSt
  toast.success(newSt === 'active' ? 'تم تشغيل المشترك' : 'تم فصل المشترك')
}

function onPaid() {
  showPayment.value = false
  toast.success('تم تسجيل السداد')
}

function statusLabel(s) {
  return { unpaid: 'غير مدفوع', partial: 'جزئي', paid: 'مدفوع', cancelled: 'ملغي' }[s] ?? s
}

function methodLabel(m) {
  return { cash: 'نقدي', transfer: 'تحويل', other: 'أخرى' }[m] ?? m
}
</script>

<style scoped>
.detail-view {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 100%;
  background: var(--bg-primary);
}

/* ─── رأس الصفحة ─────────────────────────────── */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.detail-header h1 { font-size: 1.05rem; font-weight: 800; color: var(--text-primary); }

.back-btn {
  width: 38px; height: 38px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

.edit-btn {
  padding: 7px 14px;
  border-radius: 10px;
  border: 1.5px solid rgba(59,130,246,0.4);
  background: rgba(59,130,246,0.1);
  color: #60A5FA;
  font-family: 'Cairo', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

/* ─── بطاقة الهوية ───────────────────────────── */
.identity-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 16px;
  background: linear-gradient(135deg, rgba(30,64,175,0.2), rgba(245,158,11,0.1));
  border-bottom: 1px solid var(--border-color);
}

.identity-avatar {
  width: 60px; height: 60px;
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.identity-info h2 {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.identity-tags { display: flex; gap: 6px; flex-wrap: wrap; }

.tag {
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
}
.tag.active       { background: rgba(16,185,129,0.15); color: #34D399; }
.tag.disconnected { background: rgba(239,68,68,0.15);  color: #FCA5A5; }
.tag.zone         { background: rgba(245,158,11,0.15); color: #FCD34D; }

/* ─── بطاقات البيانات ────────────────────────── */
.data-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}

.data-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 14px;
}

.data-card h3 {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.data-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 0;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.data-row:last-child { border-bottom: none; }

.data-label { font-size: 0.8rem; color: var(--text-muted); }
.data-value { font-size: 0.875rem; color: var(--text-primary); font-weight: 600; }
.data-value.mono { font-family: monospace; letter-spacing: 1px; }
.phone-link { color: #60A5FA; text-decoration: none; }
.text-muted { color: var(--text-muted); font-weight: 400; }

/* الشبكة المالية */
.financial-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.financial-item {
  background: rgba(255,255,255,0.03);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fi-label { font-size: 0.72rem; color: var(--text-muted); }
.fi-value { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
.fi-value.danger  { color: #F87171; }
.fi-value.success { color: #34D399; }
.fi-value.neutral { color: #FBBF24; }

/* ─── شبكة الأزرار ───────────────────────────── */
.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 8px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border-radius: 14px;
  border: 1px solid transparent;
  cursor: pointer;
  font-family: 'Cairo', sans-serif;
  font-size: 0.78rem;
  font-weight: 600;
  transition: all 0.2s;
}

.action-icon { font-size: 1.5rem; }

.action-btn.success  { background: rgba(16,185,129,0.12); color: #34D399;  border-color: rgba(16,185,129,0.2); }
.action-btn.primary  { background: rgba(59,130,246,0.12); color: #60A5FA;  border-color: rgba(59,130,246,0.2); }
.action-btn.info     { background: rgba(14,165,233,0.12); color: #38BDF8;  border-color: rgba(14,165,233,0.2); }
.action-btn.secondary{ background: rgba(245,158,11,0.12); color: #FCD34D;  border-color: rgba(245,158,11,0.2); }
.action-btn.neutral  { background: rgba(100,116,139,0.12); color: #94A3B8; border-color: rgba(100,116,139,0.2); }
.action-btn.danger   { background: rgba(239,68,68,0.12);  color: #FCA5A5;  border-color: rgba(239,68,68,0.2); }
.action-btn.warning  { background: rgba(249,115,22,0.12); color: #FB923C;  border-color: rgba(249,115,22,0.2); }

.action-btn:hover { filter: brightness(1.15); transform: translateY(-2px); }

/* ─── التبويبات ──────────────────────────────── */
.tabs-section {
  margin: 8px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  overflow: hidden;
}

.tabs-header {
  display: flex;
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: 'Cairo', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab-btn.active {
  color: var(--primary, #3B82F6);
  border-bottom-color: var(--primary, #3B82F6);
}

.tab-content { padding: 12px; }

.tab-loading, .tab-empty {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

/* صفوف الفواتير والقراءات */
.invoice-row, .reading-row, .payment-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  cursor: pointer;
}
.invoice-row:last-child, .reading-row:last-child, .payment-row:last-child { border-bottom: none; }

.inv-info, .reading-info, .pay-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.inv-number, .reading-date, .pay-date {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.inv-period, .reading-period, .pay-method {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.inv-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}

.inv-amount, .pay-amount {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}
.pay-amount.success { color: #34D399; }

.inv-status {
  font-size: 0.68rem;
  padding: 2px 8px;
  border-radius: 99px;
}
.inv-status.unpaid   { background: rgba(239,68,68,0.15);  color: #FCA5A5; }
.inv-status.partial  { background: rgba(245,158,11,0.15); color: #FCD34D; }
.inv-status.paid     { background: rgba(16,185,129,0.15); color: #34D399; }
.inv-status.cancelled{ background: rgba(100,116,139,0.15);color: #94A3B8; }

.reading-values { text-align: left; }
.reading-val { font-size: 0.82rem; color: var(--text-secondary); font-family: monospace; }
.reading-consumption { font-size: 0.72rem; color: var(--text-muted); }

/* ─── صفحة التحميل ───────────────────────────── */
.loading-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 60vh;
  color: var(--text-muted);
}
.spinner {
  width: 32px; height: 32px;
  border: 3px solid rgba(59,130,246,0.2);
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>