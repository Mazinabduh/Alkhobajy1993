<template>
  <div class="dashboard" dir="rtl">

    <!-- الترحيب -->
    <div class="welcome-section">
      <div class="welcome-text">
        <h1>مرحبًا، {{ firstName }} 👋</h1>
        <p>{{ todayDate }}</p>
      </div>
      <div class="weather-icon">⚡</div>
    </div>

    <!-- بطاقات الإحصائيات السريعة -->
    <div class="stats-grid">
      <StatCard
        v-for="stat in stats"
        :key="stat.key"
        :stat="stat"
        @click="router.push(stat.route)"
      />
    </div>

    <!-- الرسوم البيانية -->
    <div class="charts-section">
      <div class="section-header">
        <h2>📊 الاستهلاك الشهري</h2>
        <select v-model="chartPeriod" class="period-select">
          <option value="3">3 أشهر</option>
          <option value="6">6 أشهر</option>
          <option value="12">12 شهر</option>
        </select>
      </div>
      <div class="chart-card">
        <BarChart :data="consumptionData" :options="chartOptions" />
      </div>
    </div>

    <!-- أحدث المعاملات -->
    <div class="recent-section">
      <div class="section-header">
        <h2>💳 آخر المدفوعات</h2>
        <RouterLink to="/payments" class="see-all">عرض الكل ←</RouterLink>
      </div>

      <div class="transactions-list">
        <div
          v-for="payment in recentPayments"
          :key="payment.id"
          class="transaction-item"
        >
          <div class="transaction-info">
            <span class="transaction-name">{{ payment.subscriber_name }}</span>
            <span class="transaction-date">{{ formatDate(payment.payment_date) }}</span>
          </div>
          <div class="transaction-amount success">
            +{{ formatMoney(payment.amount) }}
          </div>
        </div>

        <div v-if="recentPayments.length === 0" class="empty-state">
          لا توجد مدفوعات حديثة
        </div>
      </div>
    </div>

    <!-- تنبيهات المخزون -->
    <div v-if="lowStockItems.length > 0" class="alerts-section">
      <div class="section-header">
        <h2>⚠️ تنبيهات المخزون</h2>
      </div>
      <div
        v-for="item in lowStockItems"
        :key="item.id"
        class="alert-item"
      >
        <span class="alert-icon">📦</span>
        <div class="alert-content">
          <strong>{{ item.name }}</strong>
          <span>الرصيد: {{ item.quantity }} {{ item.unit }}</span>
        </div>
        <span class="alert-badge">منخفض</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter }        from 'vue-router'
import { useAuthStore }     from '@/stores/auth.js'
import { useSettingsStore } from '@/stores/settings.js'
import { db }               from '@/database/db.js'
import BarChart              from '@/components/charts/BarChart.vue'
import StatCard              from '@/components/common/StatCard.vue'

const router   = useRouter()
const auth     = useAuthStore()
const settings = useSettingsStore()

const chartPeriod     = ref('6')
const recentPayments  = ref([])
const lowStockItems   = ref([])
const consumptionData = ref({ labels: [], datasets: [] })

const firstName = computed(() => {
  const name = auth.userName
  return name.split(' ')[0] || name
})

const todayDate = computed(() => {
  return new Date().toLocaleDateString('ar-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
})

const stats = ref([
  { key: 'subscribers',  label: 'المشتركون',     value: 0, icon: '👥', color: '#3B82F6', route: '/subscribers' },
  { key: 'invoices',     label: 'فواتير مستحقة', value: 0, icon: '📄', color: '#F59E0B', route: '/invoices' },
  { key: 'collected',    label: 'تم التحصيل',    value: 0, icon: '💰', color: '#10B981', route: '/payments', isMoney: true },
  { key: 'arrears',      label: 'المتأخرات',      value: 0, icon: '⏰', color: '#EF4444', route: '/arrears',  isMoney: true },
])

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8' } },
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8' } }
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString('ar-SA') + ' ' + settings.currency
}

onMounted(async () => {
  await loadStats()
  await loadRecentPayments()
  await loadLowStock()
  await loadChartData()
})

async function loadStats() {
  const [subCount, unpaidCount] = await Promise.all([
    db.subscribers.where('status').equals('active').count(),
    db.invoices.where('status').notEqual('paid').and(i => i.status !== 'cancelled').count(),
  ])

  // إجمالي التحصيل هذا الشهر
  const thisMonth = new Date().toISOString().slice(0, 7)
  const payments  = await db.payments
    .filter(p => p.payment_date?.startsWith(thisMonth))
    .toArray()
  const collected = payments.reduce((s, p) => s + (p.amount || 0), 0)

  // إجمالي المتأخرات
  const unpaidInvoices = await db.invoices
    .where('status').anyOf(['unpaid', 'partial'])
    .toArray()
  const totalArrears = unpaidInvoices.reduce((s, i) => s + (i.remaining_amount || 0), 0)

  stats.value[0].value = subCount
  stats.value[1].value = unpaidCount
  stats.value[2].value = collected
  stats.value[3].value = totalArrears
}

async function loadRecentPayments() {
  const payments = await db.payments.orderBy('created_at').reverse().limit(5).toArray()
  const withNames = await Promise.all(
    payments.map(async p => {
      const sub = await db.subscribers.get(p.subscriber_id)
      return { ...p, subscriber_name: sub?.name ?? 'غير معروف' }
    })
  )
  recentPayments.value = withNames
}

async function loadLowStock() {
  const items = await db.inventory_items.toArray()
  lowStockItems.value = items.filter(i => i.quantity <= i.min_quantity && i.min_quantity > 0)
}

async function loadChartData() {
  const months  = []
  const amounts = []
  const n       = parseInt(chartPeriod.value)
  const now     = new Date()

  for (let i = n - 1; i >= 0; i--) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = d.toISOString().slice(0, 7)
    months.push(d.toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' }))

    const invoices = await db.invoices.where('period_month').equals(month).toArray()
    const total    = invoices.reduce((s, inv) => s + (inv.consumption_amount || 0), 0)
    amounts.push(total)
  }

  consumptionData.value = {
    labels: months,
    datasets: [{
      label: 'الاستهلاك',
      data: amounts,
      backgroundColor: 'rgba(59,130,246,0.6)',
      borderColor:     '#3B82F6',
      borderWidth: 2,
      borderRadius: 8,
    }]
  }
}
</script>

<style scoped>
.dashboard {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* ─── الترحيب ────────────────────────────────── */
.welcome-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(30,64,175,0.2), rgba(245,158,11,0.1));
  border: 1px solid rgba(59,130,246,0.2);
  border-radius: 16px;
}

.welcome-text h1 {
  font-size: 1.15rem;
  font-weight: 800;
  color: #F1F5F9;
  margin: 0 0 4px;
}

.welcome-text p {
  font-size: 0.78rem;
  color: #64748B;
  margin: 0;
}

.weather-icon {
  font-size: 2rem;
  animation: pulse 2s ease-in-out infinite;
}

/* ─── الإحصائيات ─────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* ─── الرسوم البيانية ────────────────────────── */
.charts-section,
.recent-section,
.alerts-section {
  background: rgba(30,41,59,0.6);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-header h2 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #F1F5F9;
  margin: 0;
}

.period-select {
  background: rgba(15,23,42,0.6);
  border: 1px solid rgba(71,85,105,0.4);
  border-radius: 8px;
  color: #94A3B8;
  font-size: 0.8rem;
  font-family: 'Cairo', sans-serif;
  padding: 4px 8px;
  outline: none;
}

.chart-card { height: 200px; }

/* ─── المعاملات الحديثة ──────────────────────── */
.see-all {
  font-size: 0.8rem;
  color: #3B82F6;
  text-decoration: none;
}

.transaction-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.transaction-item:last-child { border-bottom: none; }

.transaction-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.transaction-name { font-size: 0.875rem; color: #F1F5F9; font-weight: 600; }
.transaction-date { font-size: 0.72rem;  color: #64748B; }

.transaction-amount {
  font-size: 0.9rem;
  font-weight: 700;
}
.transaction-amount.success { color: #34D399; }

.empty-state {
  text-align: center;
  color: #475569;
  font-size: 0.85rem;
  padding: 16px;
}

/* ─── تنبيهات المخزون ────────────────────────── */
.alert-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.alert-icon { font-size: 1.3rem; }

.alert-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.alert-content strong { font-size: 0.875rem; color: #F1F5F9; }
.alert-content span   { font-size: 0.75rem;  color: #94A3B8; }

.alert-badge {
  font-size: 0.7rem;
  background: rgba(239,68,68,0.2);
  color: #FCA5A5;
  padding: 3px 8px;
  border-radius: 99px;
}
</style>