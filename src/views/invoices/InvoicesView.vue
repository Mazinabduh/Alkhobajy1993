<template>
  <div class="invoices-view" dir="rtl">

    <!-- رأس الصفحة -->
    <div class="page-header">
      <div class="header-top">
        <h1>الفواتير</h1>
        <button class="btn-primary" @click="router.push('/readings/new')">
          <span>+</span> فاتورة جديدة
        </button>
      </div>

      <!-- إحصائيات -->
      <div class="stats-row">
        <div class="stat-chip">
          <span class="chip-val">{{ totalCount }}</span>
          <span class="chip-lbl">إجمالي</span>
        </div>
        <div class="stat-chip unpaid">
          <span class="chip-val">{{ unpaidCount }}</span>
          <span class="chip-lbl">غير مدفوع</span>
        </div>
        <div class="stat-chip partial">
          <span class="chip-val">{{ partialCount }}</span>
          <span class="chip-lbl">جزئي</span>
        </div>
        <div class="stat-chip paid">
          <span class="chip-val">{{ paidCount }}</span>
          <span class="chip-lbl">مدفوع</span>
        </div>
      </div>

      <!-- إجمالي المتأخرات -->
      <div class="arrears-banner" v-if="invoiceStore.totalUnpaid > 0">
        <span>⚠️ إجمالي المستحقات:</span>
        <strong>{{ formatMoney(invoiceStore.totalUnpaid) }}</strong>
      </div>

      <!-- فلاتر -->
      <div class="filters-row">
        <input
          v-model="search"
          type="search"
          placeholder="بحث بالاسم أو رقم الفاتورة..."
          class="search-input"
        />

        <select v-model="invoiceStore.filterStatus" class="filter-select">
          <option value="">كل الحالات</option>
          <option value="unpaid">غير مدفوع</option>
          <option value="partial">جزئي</option>
          <option value="paid">مدفوع</option>
          <option value="cancelled">ملغي</option>
        </select>

        <input
          v-model="invoiceStore.filterMonth"
          type="month"
          class="filter-select"
          dir="ltr"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="invoiceStore.isLoading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <!-- فارغ -->
    <div v-else-if="displayList.length === 0" class="empty-state">
      <div class="empty-icon">📄</div>
      <h3>لا توجد فواتير</h3>
    </div>

    <!-- قائمة الفواتير -->
    <div v-else class="invoices-list">
      <div
        v-for="inv in displayList"
        :key="inv.id"
        class="invoice-card"
        @click="router.push(`/invoices/${inv.id}`)"
      >
        <div class="inv-header">
          <div class="inv-number-row">
            <span class="inv-num">{{ inv.invoice_number }}</span>
            <span class="inv-status-badge" :class="inv.status">{{ statusLabel(inv.status) }}</span>
          </div>
          <div class="inv-sub-name">{{ inv.subscriber_name }}</div>
        </div>

        <div class="inv-body">
          <div class="inv-detail-col">
            <span class="inv-period">📅 {{ inv.period_month }}</span>
            <span class="inv-consumption">⚡ {{ inv.consumption }} كيلوواط</span>
          </div>
          <div class="inv-amounts">
            <div class="amt-row">
              <span>الإجمالي</span>
              <strong>{{ formatMoney(inv.total_amount) }}</strong>
            </div>
            <div class="amt-row remaining" v-if="inv.remaining_amount > 0">
              <span>المتبقي</span>
              <strong class="text-danger">{{ formatMoney(inv.remaining_amount) }}</strong>
            </div>
            <div class="amt-row paid-info" v-if="inv.paid_amount > 0">
              <span>مدفوع</span>
              <strong class="text-success">{{ formatMoney(inv.paid_amount) }}</strong>
            </div>
          </div>
        </div>

        <!-- أزرار سريعة -->
        <div class="inv-actions" @click.stop>
          <button
            v-if="['unpaid','partial'].includes(inv.status) && auth.hasPermission('subscribers.payment')"
            class="inv-btn success"
            @click.stop="openPayment(inv)"
          >💰 سداد</button>

          <button
            v-if="auth.hasPermission('invoices.print')"
            class="inv-btn neutral"
            @click.stop="router.push(`/invoices/${inv.id}/print`)"
          >🖨️ طباعة</button>

          <button
            v-if="inv.subscriber_phone"
            class="inv-btn info"
            @click.stop="sendInvoiceSMS(inv)"
          >💬 إرسال</button>
        </div>
      </div>
    </div>

    <!-- سداد سريع -->
    <QuickPaymentFromInvoice
      v-if="selectedInvoice"
      :invoice="selectedInvoice"
      @close="selectedInvoice = null"
      @paid="onPaid"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter }           from 'vue-router'
import { useInvoicesStore }    from '@/stores/invoices.js'
import { useSettingsStore }    from '@/stores/settings.js'
import { useAuthStore }        from '@/stores/auth.js'
import { useToast }            from '@/composables/useToast.js'
import QuickPaymentFromInvoice from '@/components/invoices/QuickPaymentFromInvoice.vue'

const router        = useRouter()
const invoiceStore  = useInvoicesStore()
const settings      = useSettingsStore()
const auth          = useAuthStore()
const toast         = useToast()

const search          = ref('')
const selectedInvoice = ref(null)

const displayList = computed(() => {
  let list = invoiceStore.filtered
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(i =>
      i.invoice_number?.toLowerCase().includes(q) ||
      i.subscriber_name?.toLowerCase().includes(q)
    )
  }
  return list
})

const totalCount   = computed(() => invoiceStore.items.length)
const unpaidCount  = computed(() => invoiceStore.items.filter(i => i.status === 'unpaid').length)
const partialCount = computed(() => invoiceStore.items.filter(i => i.status === 'partial').length)
const paidCount    = computed(() => invoiceStore.items.filter(i => i.status === 'paid').length)

onMounted(async () => {
  await invoiceStore.loadAll()
})

function formatMoney(v) {
  return Number(v||0).toLocaleString('ar-SA') + ' ' + settings.currency
}

function statusLabel(s) {
  return { unpaid: 'غير مدفوع', partial: 'جزئي', paid: 'مدفوع', cancelled: 'ملغي' }[s] ?? s
}

function openPayment(inv) { selectedInvoice.value = inv }

function sendInvoiceSMS(inv) {
  const msg = `فاتورة رقم ${inv.invoice_number} - ${inv.period_month}\nالاستهلاك: ${inv.consumption} كيلوواط\nالمبلغ: ${formatMoney(inv.total_amount)}\nالمتبقي: ${formatMoney(inv.remaining_amount)}`
  window.location.href = `sms:${inv.subscriber_phone}?body=${encodeURIComponent(msg)}`
}

function onPaid() {
  selectedInvoice.value = null
  toast.success('تم تسجيل السداد')
  invoiceStore.loadAll()
}
</script>

<style scoped>
.invoices-view { display: flex; flex-direction: column; min-height: 100%; }

/* ─── الرأس ──────────────────────────────────── */
.page-header {
  background: var(--bg-secondary);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-top h1 { font-size: 1.2rem; font-weight: 800; color: var(--text-primary); }

.btn-primary {
  padding: 9px 16px;
  background: linear-gradient(135deg,#1D4ED8,#1E40AF);
  border: none;
  border-radius: 11px;
  color: white;
  font-family: 'Cairo', sans-serif;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  display: flex; align-items: center; gap: 4px;
  box-shadow: 0 4px 12px rgba(29,78,216,0.3);
}

/* ─── الإحصائيات ─────────────────────────────── */
.stats-row {
  display: flex;
  gap: 8px;
}

.stat-chip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border-color);
  gap: 2px;
}

.chip-val { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.chip-lbl { font-size: 0.65rem; color: var(--text-muted); }

.stat-chip.unpaid  .chip-val { color: #F87171; }
.stat-chip.partial .chip-val { color: #FBBF24; }
.stat-chip.paid    .chip-val { color: #34D399; }

/* ─── شريط المتأخرات ─────────────────────────── */
.arrears-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 10px;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.arrears-banner strong { color: #F87171; font-size: 1rem; }

/* ─── الفلاتر ────────────────────────────────── */
.filters-row {
  display: flex;
  gap: 6px;
}

.search-input {
  flex: 1;
  padding: 9px 12px;
  background: var(--bg-input);
  border: 1.5px solid var(--border-input);
  border-radius: 10px;
  color: var(--text-primary);
  font-family: 'Cairo', sans-serif;
  font-size: 0.85rem;
  outline: none;
}

.filter-select {
  padding: 9px 10px;
  background: var(--bg-input);
  border: 1.5px solid var(--border-input);
  border-radius: 10px;
  color: var(--text-secondary);
  font-family: 'Cairo', sans-serif;
  font-size: 0.8rem;
  outline: none;
  -webkit-appearance: none;
  min-width: 80px;
}

/* ─── الحالات ────────────────────────────────── */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
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

.empty-icon { font-size: 3rem; }
.empty-state h3 { font-size: 1rem; color: var(--text-secondary); }

/* ─── قائمة الفواتير ─────────────────────────── */
.invoices-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}

.invoice-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.invoice-card:hover { border-color: rgba(59,130,246,0.3); transform: translateX(-2px); }

/* رأس الفاتورة */
.inv-header { display: flex; flex-direction: column; gap: 4px; }

.inv-number-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.inv-num {
  font-size: 0.82rem;
  font-family: monospace;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.inv-status-badge {
  padding: 2px 10px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 600;
}
.inv-status-badge.unpaid    { background: rgba(239,68,68,0.15);  color: #FCA5A5; }
.inv-status-badge.partial   { background: rgba(245,158,11,0.15); color: #FCD34D; }
.inv-status-badge.paid      { background: rgba(16,185,129,0.15); color: #34D399; }
.inv-status-badge.cancelled { background: rgba(100,116,139,0.15);color: #94A3B8; }

.inv-sub-name { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }

/* تفاصيل */
.inv-body {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.inv-detail-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inv-period, .inv-consumption {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.inv-amounts {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}

.amt-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.amt-row strong { font-size: 0.9rem; color: var(--text-primary); }
.text-danger  { color: #F87171 !important; }
.text-success { color: #34D399 !important; }

/* أزرار */
.inv-actions { display: flex; gap: 6px; }

.inv-btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  font-family: 'Cairo', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex; align-items: center; gap: 4px;
  transition: all 0.15s;
}

.inv-btn.success { background: rgba(16,185,129,0.15); color: #34D399; }
.inv-btn.neutral { background: rgba(100,116,139,0.15);color: #94A3B8; }
.inv-btn.info    { background: rgba(59,130,246,0.15);  color: #60A5FA; }
.inv-btn:hover   { filter: brightness(1.2); }
</style>