<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="report-modal">
        <div class="modal-header no-print">
          <button class="back-btn" @click="$emit('close')">✕</button>
          <h3>{{ report.label }}</h3>
          <div class="header-actions">
            <button class="hdr-btn" @click="doPrint">🖨️</button>
            <button class="hdr-btn" @click="doExport">Excel</button>
          </div>
        </div>

        <div class="report-content" id="report-content">
          <div class="report-header">
            <h2>{{ settings.stationName }}</h2>
            <h3>{{ report.label }}</h3>
            <p>الفترة: {{ periodFrom }} - {{ periodTo }}</p>
            <p>تاريخ الطباعة: {{ today }}</p>
          </div>

          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
          </div>

          <table v-else-if="rows.length > 0" class="report-table">
            <thead>
              <tr>
                <th v-for="h in headers" :key="h.key">{{ h.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in rows" :key="i">
                <td v-for="h in headers" :key="h.key">
                  {{ formatCell(row[h.key], h) }}
                </td>
              </tr>
            </tbody>
            <tfoot v-if="hasTotals">
              <tr>
                <td v-for="h in headers" :key="h.key" class="total-cell">
                  {{ getTotalCell(h) }}
                </td>
              </tr>
            </tfoot>
          </table>

          <div v-else class="empty-report">لا توجد بيانات في هذه الفترة</div>

          <div class="report-footer">
            <p>{{ settings.footerMessage }}</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings.js'
import { useExportService } from '@/services/ExportService.js'
import { db }               from '@/database/db.js'

const props = defineProps({
  report:     { type: Object, required: true },
  periodFrom: { type: String, default: '' },
  periodTo:   { type: String, default: '' },
})
defineEmits(['close'])

const settings    = useSettingsStore()
const { exportExcel } = useExportService()
const isLoading   = ref(true)
const headers     = ref([])
const rows        = ref([])
const hasTotals   = ref(false)

const today = new Date().toLocaleDateString('ar-SA', { year:'numeric', month:'long', day:'numeric' })

onMounted(async () => {
  await loadData()
  if (props.report.autoPrint) {
    setTimeout(() => window.print(), 600)
  }
})

async function loadData() {
  isLoading.value = true
  const config = await getReportConfig(props.report.key)
  headers.value  = config.headers
  rows.value     = config.rows
  hasTotals.value = config.hasTotals ?? false
  isLoading.value = false
}

async function getReportConfig(key) {
  const from = props.periodFrom
  const to   = props.periodTo

  const configs = {
    subscribers: {
      headers: [
        { key: 'name',         label: 'الاسم',       type: 'text' },
        { key: 'phone',        label: 'الهاتف',      type: 'text' },
        { key: 'meter_number', label: 'رقم العداد',  type: 'text' },
        { key: 'zone_name',    label: 'المنطقة',     type: 'text' },
        { key: 'status',       label: 'الحالة',      type: 'status' },
        { key: 'balance',      label: 'الرصيد',      type: 'money' },
      ],
      rows:      await db.subscribers.orderBy('name').toArray(),
      hasTotals: false,
    },
    billing: {
      headers: [
        { key: 'invoice_number',  label: 'رقم الفاتورة', type: 'text' },
        { key: 'subscriber_name', label: 'المشترك',      type: 'text' },
        { key: 'period_month',    label: 'الفترة',       type: 'text' },
        { key: 'consumption',     label: 'الاستهلاك',   type: 'number' },
        { key: 'total_amount',    label: 'الإجمالي',    type: 'money' },
        { key: 'paid_amount',     label: 'المدفوع',     type: 'money' },
        { key: 'remaining_amount',label: 'المتبقي',     type: 'money' },
        { key: 'status',          label: 'الحالة',      type: 'status' },
      ],
      rows: await db.invoices
        .filter(i => (!from || i.period_month >= from) && (!to || i.period_month <= to))
        .toArray()
        .then(async list => {
          return Promise.all(list.map(async i => {
            const sub = await db.subscribers.get(i.subscriber_id)
            return { ...i, subscriber_name: sub?.name ?? '' }
          }))
        }),
      hasTotals: true,
    },
    arrears: {
      headers: [
        { key: 'name',            label: 'المشترك',     type: 'text' },
        { key: 'phone',           label: 'الهاتف',      type: 'text' },
        { key: 'meter_number',    label: 'رقم العداد',  type: 'text' },
        { key: 'remaining_amount',label: 'المتأخرات',   type: 'money' },
      ],
      rows: await (async () => {
        const unpaid = await db.invoices.where('status').anyOf(['unpaid','partial']).toArray()
        const bySubId = {}
        for (const inv of unpaid) {
          bySubId[inv.subscriber_id] = (bySubId[inv.subscriber_id] ?? 0) + inv.remaining_amount
        }
        const result = []
        for (const [subId, amount] of Object.entries(bySubId)) {
          const sub = await db.subscribers.get(Number(subId))
          if (sub) result.push({ ...sub, remaining_amount: amount })
        }
        return result.sort((a,b) => b.remaining_amount - a.remaining_amount)
      })(),
      hasTotals: true,
    },
    expenses: {
      headers: [
        { key: 'description',  label: 'الوصف',       type: 'text' },
        { key: 'category_name',label: 'التصنيف',     type: 'text' },
        { key: 'amount',       label: 'المبلغ',      type: 'money' },
        { key: 'expense_date', label: 'التاريخ',     type: 'date' },
      ],
      rows: await db.expenses
        .filter(e => (!from || e.expense_date?.slice(0,7) >= from) && (!to || e.expense_date?.slice(0,7) <= to))
        .toArray()
        .then(async list => {
          const cats = await db.expense_categories.toArray()
          const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]))
          return list.map(e => ({ ...e, category_name: catMap[e.category_id] ?? '' }))
        }),
      hasTotals: true,
    },
    inventory: {
      headers: [
        { key: 'name',           label: 'الصنف',       type: 'text' },
        { key: 'category_name',  label: 'التصنيف',    type: 'text' },
        { key: 'quantity',       label: 'الكمية',     type: 'number' },
        { key: 'unit',           label: 'الوحدة',     type: 'text' },
        { key: 'purchase_price', label: 'سعر الشراء', type: 'money' },
        { key: 'selling_price',  label: 'سعر البيع',  type: 'money' },
      ],
      rows: await db.inventory_items.orderBy('name').toArray()
        .then(async list => {
          const cats = await db.inventory_categories.toArray()
          const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]))
          return list.map(i => ({ ...i, category_name: catMap[i.category_id] ?? '' }))
        }),
      hasTotals: false,
    },
  }

  return configs[key] ?? { headers: [], rows: [], hasTotals: false }
}

function formatCell(value, header) {
  if (value === null || value === undefined) return '—'
  if (header.type === 'money')  return Number(value).toLocaleString('ar-SA') + ' ' + settings.currency
  if (header.type === 'number') return Number(value).toLocaleString('ar-SA')
  if (header.type === 'date')   return value ? new Date(value).toLocaleDateString('ar-SA') : '—'
  if (header.type === 'status') {
    const labels = { active:'نشط', disconnected:'مفصول', unpaid:'غير مدفوع', partial:'جزئي', paid:'مدفوع' }
    return labels[value] ?? value
  }
  return value
}

function getTotalCell(header) {
  if (['money','number'].includes(header.type)) {
    const total = rows.value.reduce((s, r) => s + (parseFloat(r[header.key]) || 0), 0)
    if (header.type === 'money') return Number(total).toLocaleString('ar-SA') + ' ' + settings.currency
    return Number(total).toLocaleString('ar-SA')
  }
  if (header === headers.value[0]) return 'الإجمالي'
  return ''
}

function doPrint() { window.print() }

function doExport() {
  exportExcel(rows.value, props.report.label, headers.value)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7);
  backdrop-filter: blur(6px); display: flex; align-items: center;
  justify-content: center; z-index: 800; padding: 0;
}

.report-modal {
  background: var(--bg-primary); width: 100%; height: 100%;
  display: flex; flex-direction: column; overflow: hidden;
}

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}
.modal-header h3 { font-size: 1rem; font-weight: 800; color: var(--text-primary); }

.back-btn {
  width: 34px; height: 34px; border-radius: 8px;
  border: 1px solid var(--border-color); background: transparent;
  color: var(--text-secondary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

.header-actions { display: flex; gap: 6px; }
.hdr-btn {
  padding: 6px 12px; border-radius: 8px;
  border: 1px solid var(--border-color); background: rgba(255,255,255,0.04);
  color: var(--text-secondary); font-family: 'Cairo', sans-serif;
  font-size: 0.8rem; cursor: pointer; transition: all 0.15s;
}
.hdr-btn:hover { border-color: var(--primary); color: var(--primary); }

.report-content {
  flex: 1; overflow-y: auto; padding: 16px;
  background: white; color: #1a1a1a;
  font-family: 'Cairo', sans-serif; direction: rtl;
}

.report-header {
  text-align: center; margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 2px solid #1E40AF;
}
.report-header h2 { font-size: 1.3rem; font-weight: 800; color: #1E40AF; margin-bottom: 4px; }
.report-header h3 { font-size: 1rem; font-weight: 700; color: #334155; margin-bottom: 6px; }
.report-header p  { font-size: 0.8rem; color: #64748B; }

.loading-state { display: flex; justify-content: center; padding: 40px; }
.spinner { width: 32px; height: 32px; border: 3px solid rgba(30,64,175,0.2); border-top-color: #1E40AF; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.report-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.report-table th {
  background: #1E40AF; color: white; padding: 8px 10px;
  text-align: right; font-weight: 700; border: 1px solid #1D4ED8;
}
.report-table td {
  padding: 7px 10px; border: 1px solid #E2E8F0; color: #334155;
}
.report-table tbody tr:nth-child(even) { background: #F8FAFC; }
.report-table tbody tr:hover { background: #EFF6FF; }

.total-cell {
  background: #F1F5F9; font-weight: 700; color: #1E40AF;
  padding: 8px 10px; border: 1px solid #CBD5E1;
}

.empty-report { text-align: center; padding: 40px; color: #94A3B8; }

.report-footer {
  margin-top: 20px; padding-top: 12px;
  border-top: 1px solid #E2E8F0; text-align: center;
  font-size: 0.8rem; color: #64748B;
}

@media print {
  .no-print { display: none !important; }
  .report-modal { height: auto; }
  .report-content { padding: 0; }
  @page { size: A4 landscape; margin: 10mm; }
}
</style>