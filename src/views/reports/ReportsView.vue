<template>
  <div class="reports-view" dir="rtl">

    <!-- رأس الصفحة -->
    <div class="page-header">
      <h1>📊 التقارير</h1>
      <div class="period-selector">
        <input v-model="periodFrom" type="month" class="period-input" dir="ltr" />
        <span class="period-sep">إلى</span>
        <input v-model="periodTo" type="month" class="period-input" dir="ltr" />
        <button class="btn-load" @click="loadReports">تحميل</button>
      </div>
    </div>

    <!-- الإحصائيات الرئيسية -->
    <div class="main-stats" v-if="!isLoading">
      <div class="main-stat-card">
        <div class="msc-icon">💰</div>
        <div class="msc-body">
          <span class="msc-val">{{ formatMoney(summary.totalBilled) }}</span>
          <span class="msc-lbl">إجمالي الفوترة</span>
        </div>
      </div>
      <div class="main-stat-card success">
        <div class="msc-icon">✅</div>
        <div class="msc-body">
          <span class="msc-val">{{ formatMoney(summary.totalCollected) }}</span>
          <span class="msc-lbl">إجمالي التحصيل</span>
        </div>
      </div>
      <div class="main-stat-card danger">
        <div class="msc-icon">⏰</div>
        <div class="msc-body">
          <span class="msc-val">{{ formatMoney(summary.totalArrears) }}</span>
          <span class="msc-lbl">المتأخرات</span>
        </div>
      </div>
      <div class="main-stat-card warning">
        <div class="msc-icon">💸</div>
        <div class="msc-body">
          <span class="msc-val">{{ formatMoney(summary.totalExpenses) }}</span>
          <span class="msc-lbl">النفقات</span>
        </div>
      </div>
      <div class="main-stat-card" :class="summary.netProfit >= 0 ? 'success' : 'danger'" style="grid-column: span 2;">
        <div class="msc-icon">📈</div>
        <div class="msc-body">
          <span class="msc-val">{{ formatMoney(summary.netProfit) }}</span>
          <span class="msc-lbl">صافي الربح</span>
        </div>
      </div>
    </div>

    <!-- الرسوم البيانية -->
    <div class="charts-grid" v-if="!isLoading">

      <!-- مخطط الاستهلاك الشهري -->
      <div class="chart-card">
        <h3>📈 الاستهلاك الشهري (كيلوواط)</h3>
        <div class="chart-wrap">
          <BarChart :data="consumptionChartData" :options="barOptions" />
        </div>
      </div>

      <!-- مخطط التحصيل -->
      <div class="chart-card">
        <h3>💰 التحصيل الشهري</h3>
        <div class="chart-wrap">
          <LineChart :data="collectionChartData" :options="lineOptions" />
        </div>
      </div>

      <!-- مخطط توزيع النفقات -->
      <div class="chart-card half">
        <h3>💸 توزيع النفقات</h3>
        <div class="chart-wrap-sm">
          <DoughnutChart :data="expensesChartData" :options="doughnutOptions" />
        </div>
      </div>

      <!-- مخطط المشتركين حسب المنطقة -->
      <div class="chart-card half">
        <h3>👥 المشتركون حسب المنطقة</h3>
        <div class="chart-wrap-sm">
          <PieChart :data="zoneChartData" :options="doughnutOptions" />
        </div>
      </div>
    </div>

    <!-- قائمة التقارير -->
    <div class="reports-list">
      <h2 class="section-title">📋 قوائم التقارير</h2>

      <div class="report-items">
        <div
          v-for="rep in reportTypes"
          :key="rep.key"
          class="report-item"
          @click="openReport(rep)"
        >
          <div class="rep-icon">{{ rep.icon }}</div>
          <div class="rep-info">
            <h4>{{ rep.label }}</h4>
            <p>{{ rep.description }}</p>
          </div>
          <div class="rep-actions">
            <button class="rep-btn" @click.stop="exportReport(rep, 'pdf')">PDF</button>
            <button class="rep-btn" @click.stop="exportReport(rep, 'excel')">Excel</button>
            <button class="rep-btn" @click.stop="printReport(rep)">🖨️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- تقرير مفصل -->
    <ReportDetailModal
      v-if="activeReport"
      :report="activeReport"
      :period-from="periodFrom"
      :period-to="periodTo"
      @close="activeReport = null"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore }  from '@/stores/settings.js'
import { useExportService }  from '@/services/ExportService.js'
import { db }                from '@/database/db.js'
import BarChart              from '@/components/charts/BarChart.vue'
import LineChart             from '@/components/charts/LineChart.vue'
import DoughnutChart         from '@/components/charts/DoughnutChart.vue'
import PieChart              from '@/components/charts/PieChart.vue'
import ReportDetailModal     from '@/components/reports/ReportDetailModal.vue'

const settings    = useSettingsStore()
const { exportExcel } = useExportService()
const isLoading   = ref(false)
const activeReport = ref(null)

const now = new Date()
const periodFrom = ref(`${now.getFullYear()}-01`)
const periodTo   = ref(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`)

const summary = ref({
  totalBilled:    0,
  totalCollected: 0,
  totalArrears:   0,
  totalExpenses:  0,
  netProfit:      0,
  totalConsumption: 0,
})

const consumptionChartData = ref({ labels: [], datasets: [] })
const collectionChartData  = ref({ labels: [], datasets: [] })
const expensesChartData    = ref({ labels: [], datasets: [] })
const zoneChartData        = ref({ labels: [], datasets: [] })

const chartColors = ['#3B82F6','#F59E0B','#10B981','#EF4444','#8B5CF6','#06B6D4','#F97316']

const barOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8', font: { family: 'Cairo' } } },
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8', font: { family: 'Cairo' } } }
  }
}

const lineOptions = { ...barOptions }

const doughnutOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#94A3B8', font: { family: 'Cairo', size: 11 }, padding: 12 }
    }
  }
}

const reportTypes = [
  { key: 'billing',      label: 'تقرير الفوترة',          icon: '📄', description: 'إجمالي الفواتير الصادرة' },
  { key: 'collection',   label: 'تقرير التحصيل',          icon: '💰', description: 'إجمالي المبالغ المحصلة' },
  { key: 'arrears',      label: 'تقرير المتأخرين',        icon: '⏰', description: 'المشتركون الذين لديهم متأخرات' },
  { key: 'expenses',     label: 'تقرير النفقات',          icon: '💸', description: 'تفصيل جميع النفقات' },
  { key: 'net',          label: 'التقرير المالي الصافي',  icon: '📈', description: 'الإيرادات - النفقات' },
  { key: 'subscribers',  label: 'تقرير المشتركين',        icon: '👥', description: 'بيانات جميع المشتركين' },
  { key: 'consumption',  label: 'تقرير الاستهلاك',        icon: '⚡', description: 'الاستهلاك لكل مشترك' },
  { key: 'inventory',    label: 'تقرير المخزون',          icon: '📦', description: 'حالة المخزون الحالية' },
]

onMounted(async () => {
  await settings.loadSettings()
  await loadReports()
})

async function loadReports() {
  isLoading.value = true
  try {
    await Promise.all([
      loadSummary(),
      loadCharts(),
    ])
  } finally {
    isLoading.value = false
  }
}

async function loadSummary() {
  const from = periodFrom.value
  const to   = periodTo.value

  const invoices = await db.invoices
    .filter(inv => inv.period_month >= from && inv.period_month <= to)
    .toArray()

  const payments = await db.payments.toArray()
  const paymentsInPeriod = payments.filter(p =>
    p.payment_date?.slice(0,7) >= from && p.payment_date?.slice(0,7) <= to
  )

  const expenses = await db.expenses
    .filter(e => e.expense_date?.slice(0,7) >= from && e.expense_date?.slice(0,7) <= to)
    .toArray()

  const totalBilled    = invoices.reduce((s,i) => s + (i.total_amount ?? 0), 0)
  const totalCollected = paymentsInPeriod.reduce((s,p) => s + (p.amount ?? 0), 0)
  const totalArrears   = invoices.filter(i => ['unpaid','partial'].includes(i.status))
                                 .reduce((s,i) => s + (i.remaining_amount ?? 0), 0)
  const totalExpenses  = expenses.reduce((s,e) => s + (e.amount ?? 0), 0)
  const totalConsumption = invoices.reduce((s,i) => s + (i.consumption ?? 0), 0)

  summary.value = {
    totalBilled, totalCollected, totalArrears, totalExpenses,
    totalConsumption,
    netProfit: totalCollected - totalExpenses,
  }
}

async function loadCharts() {
  const months  = []
  const from    = periodFrom.value
  const to      = periodTo.value

  let current = new Date(from + '-01')
  const end   = new Date(to + '-01')

  while (current <= end) {
    months.push(current.toISOString().slice(0,7))
    current.setMonth(current.getMonth() + 1)
  }

  const labels = months.map(m => {
    const d = new Date(m + '-01')
    return d.toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' })
  })

  // استهلاك شهري
  const consumptionData = await Promise.all(months.map(async m => {
    const invs = await db.invoices.where('period_month').equals(m).toArray()
    return invs.reduce((s,i) => s + (i.consumption ?? 0), 0)
  }))

  consumptionChartData.value = {
    labels,
    datasets: [{
      label: 'الاستهلاك (كيلوواط)',
      data:  consumptionData,
      backgroundColor: 'rgba(59,130,246,0.6)',
      borderColor:     '#3B82F6',
      borderWidth: 2,
      borderRadius: 6,
    }]
  }

  // تحصيل شهري
  const collectionData = await Promise.all(months.map(async m => {
    const pays = await db.payments.filter(p => p.payment_date?.startsWith(m)).toArray()
    return pays.reduce((s,p) => s + (p.amount ?? 0), 0)
  }))

  collectionChartData.value = {
    labels,
    datasets: [{
      label: 'التحصيل',
      data:  collectionData,
      borderColor:     '#10B981',
      backgroundColor: 'rgba(16,185,129,0.1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#10B981',
    }]
  }

  // توزيع النفقات
  const expCats = await db.expense_categories.toArray()
  const expData = await Promise.all(expCats.map(async cat => {
    const exps = await db.expenses.where('category_id').equals(cat.id).toArray()
    const inPeriod = exps.filter(e => e.expense_date?.slice(0,7) >= from && e.expense_date?.slice(0,7) <= to)
    return inPeriod.reduce((s,e) => s + (e.amount ?? 0), 0)
  }))

  expensesChartData.value = {
    labels:   expCats.map(c => c.name),
    datasets: [{
      data:            expData,
      backgroundColor: chartColors,
      borderWidth:     2,
      borderColor:     '#1E293B',
    }]
  }

  // مشتركون حسب المنطقة
  const zones   = await db.zones.toArray()
  const zoneData = await Promise.all(zones.map(async z => {
    return db.subscribers.where('zone_id').equals(z.id).count()
  }))

  zoneChartData.value = {
    labels:   zones.map(z => z.name),
    datasets: [{
      data:            zoneData,
      backgroundColor: chartColors,
      borderWidth:     2,
      borderColor:     '#1E293B',
    }]
  }
}

function formatMoney(v) {
  return Number(v||0).toLocaleString('ar-SA') + ' ' + settings.currency
}

async function openReport(rep) {
  activeReport.value = rep
}

async function exportReport(rep, format) {
  const data = await getReportData(rep.key)
  if (format === 'excel') {
    exportExcel(data.rows, rep.label, data.headers)
  }
}

function printReport(rep) {
  activeReport.value = { ...rep, autoPrint: true }
}

async function getReportData(key) {
  const headers_map = {
    subscribers: [
      { key: 'name',         label: 'الاسم' },
      { key: 'phone',        label: 'الهاتف' },
      { key: 'meter_number', label: 'رقم العداد' },
      { key: 'status',       label: 'الحالة' },
      { key: 'balance',      label: 'الرصيد' },
    ],
    billing: [
      { key: 'invoice_number', label: 'رقم الفاتورة' },
      { key: 'period_month',   label: 'الفترة' },
      { key: 'total_amount',   label: 'الإجمالي' },
      { key: 'status',         label: 'الحالة' },
    ],
    expenses: [
      { key: 'description',  label: 'الوصف' },
      { key: 'amount',       label: 'المبلغ' },
      { key: 'expense_date', label: 'التاريخ' },
    ],
  }

  const rows_map = {
    subscribers: await db.subscribers.toArray(),
    billing:     await db.invoices.filter(i => i.period_month >= periodFrom.value && i.period_month <= periodTo.value).toArray(),
    expenses:    await db.expenses.filter(e => e.expense_date?.slice(0,7) >= periodFrom.value && e.expense_date?.slice(0,7) <= periodTo.value).toArray(),
  }

  return {
    headers: headers_map[key] ?? [],
    rows:    rows_map[key]    ?? [],
  }
}
</script>

<style scoped>
.reports-view { display: flex; flex-direction: column; min-height: 100%; gap: 0; }

.page-header {
  background: var(--bg-secondary); padding: 14px;
  border-bottom: 1px solid var(--border-color);
  position: sticky; top: 0; z-index: 10;
  display: flex; flex-direction: column; gap: 10px;
}
.page-header h1 { font-size: 1.2rem; font-weight: 800; color: var(--text-primary); }

.period-selector {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.period-input {
  padding: 8px 10px; background: var(--bg-input);
  border: 1.5px solid var(--border-input); border-radius: 10px;
  color: var(--text-primary); font-family: 'Cairo', sans-serif;
  font-size: 0.82rem; outline: none; flex: 1; min-width: 100px;
  -webkit-appearance: none;
}
.period-sep { font-size: 0.8rem; color: var(--text-muted); }
.btn-load {
  padding: 9px 18px; background: linear-gradient(135deg,#1D4ED8,#1E40AF);
  border: none; border-radius: 10px; color: white; font-family: 'Cairo', sans-serif;
  font-size: 0.85rem; font-weight: 700; cursor: pointer; white-space: nowrap;
}

/* ─── الإحصائيات الرئيسية ─────────────────────── */
.main-stats {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 8px;
}

.main-stat-card {
  background: var(--card-bg); border: 1px solid var(--border-color);
  border-radius: 14px; padding: 14px;
  display: flex; align-items: center; gap: 12px;
  transition: transform 0.2s;
}
.main-stat-card:hover { transform: translateY(-2px); }

.msc-icon { font-size: 1.8rem; }
.msc-body { display: flex; flex-direction: column; gap: 2px; }
.msc-val  { font-size: 1rem;  font-weight: 800; color: var(--text-primary); }
.msc-lbl  { font-size: 0.7rem; color: var(--text-muted); }

.main-stat-card.success .msc-val { color: #34D399; }
.main-stat-card.danger  .msc-val { color: #F87171; }
.main-stat-card.warning .msc-val { color: #FBBF24; }

/* ─── الرسوم البيانية ─────────────────────────── */
.charts-grid {
  display: grid; grid-template-columns: 1fr; gap: 8px; padding: 0 8px;
}

.chart-card {
  background: var(--card-bg); border: 1px solid var(--border-color);
  border-radius: 14px; padding: 14px;
}

.chart-card h3 {
  font-size: 0.875rem; font-weight: 700; color: var(--text-primary);
  margin-bottom: 12px;
}

.chart-wrap    { height: 200px; }
.chart-wrap-sm { height: 180px; }

/* في الشاشات الكبيرة */
@media (min-width: 640px) {
  .charts-grid { grid-template-columns: 1fr 1fr; }
  .chart-card.half { }
}

/* ─── قائمة التقارير ─────────────────────────── */
.reports-list {
  padding: 8px; display: flex; flex-direction: column; gap: 8px;
}

.section-title {
  font-size: 1rem; font-weight: 800; color: var(--text-primary); padding: 4px 0;
}

.report-items { display: flex; flex-direction: column; gap: 6px; }

.report-item {
  background: var(--card-bg); border: 1px solid var(--border-color);
  border-radius: 12px; padding: 12px 14px;
  display: flex; align-items: center; gap: 12px; cursor: pointer;
  transition: all 0.2s;
}
.report-item:hover { border-color: rgba(59,130,246,0.3); transform: translateX(-2px); }

.rep-icon { font-size: 1.4rem; flex-shrink: 0; }

.rep-info { flex: 1; min-width: 0; }
.rep-info h4 { font-size: 0.875rem; font-weight: 700; color: var(--text-primary); }
.rep-info p  { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }

.rep-actions { display: flex; gap: 4px; flex-shrink: 0; }

.rep-btn {
  padding: 5px 10px; border-radius: 7px;
  border: 1px solid var(--border-color); background: rgba(255,255,255,0.04);
  color: var(--text-secondary); font-family: 'Cairo', sans-serif;
  font-size: 0.72rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
  white-space: nowrap;
}
.rep-btn:hover { border-color: var(--primary); color: var(--primary); }
</style>