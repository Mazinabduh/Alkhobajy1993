<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-card">

        <!-- رأس النافذة -->
        <div class="modal-header">
          <h3>💰 تسجيل سداد</h3>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <!-- معلومات المشترك -->
        <div class="sub-info-bar">
          <div class="sub-avatar">{{ subscriber.name.charAt(0) }}</div>
          <div>
            <div class="sub-name">{{ subscriber.name }}</div>
            <div class="sub-meter">{{ subscriber.meter_number }}</div>
          </div>
        </div>

        <!-- الفواتير غير المدفوعة -->
        <div v-if="unpaidInvoices.length > 0" class="invoices-section">
          <p class="section-label">الفواتير المستحقة:</p>
          <div class="invoice-chips">
            <button
              v-for="inv in unpaidInvoices"
              :key="inv.id"
              class="invoice-chip"
              :class="{ selected: selectedInvoiceId === inv.id }"
              @click="selectInvoice(inv)"
            >
              <span>{{ inv.period_month }}</span>
              <strong>{{ formatMoney(inv.remaining_amount) }}</strong>
            </button>
          </div>
        </div>

        <div v-else class="no-invoices">
          <span>✅</span>
          <p>لا توجد فواتير مستحقة</p>
        </div>

        <!-- نموذج الدفع -->
        <div class="payment-form" v-if="unpaidInvoices.length > 0">

          <!-- المبلغ -->
          <div class="form-group">
            <label>المبلغ المدفوع</label>
            <div class="amount-input-wrapper">
              <input
                v-model.number="form.amount"
                type="number"
                min="0"
                step="0.01"
                class="amount-input"
                inputmode="decimal"
                dir="ltr"
                placeholder="0.00"
              />
              <span class="currency">{{ settings.currency }}</span>
            </div>
            <!-- أزرار المبالغ السريعة -->
            <div class="quick-amounts">
              <button
                v-for="amt in quickAmounts"
                :key="amt"
                class="quick-amt-btn"
                @click="form.amount = amt"
              >{{ formatMoney(amt) }}</button>
              <button class="quick-amt-btn full" @click="setFullAmount">كامل</button>
            </div>
          </div>

          <!-- طريقة الدفع -->
          <div class="form-group">
            <label>طريقة الدفع</label>
            <div class="method-toggle">
              <button
                v-for="m in methods"
                :key="m.key"
                class="method-btn"
                :class="{ active: form.method === m.key }"
                @click="form.method = m.key"
              >
                {{ m.icon }} {{ m.label }}
              </button>
            </div>
          </div>

          <!-- تاريخ الدفع -->
          <div class="form-group">
            <label>تاريخ الدفع</label>
            <input v-model="form.date" type="date" class="form-input" dir="ltr" />
          </div>

          <!-- ملاحظات -->
          <div class="form-group">
            <label>ملاحظات (اختياري)</label>
            <input v-model="form.notes" type="text" class="form-input" placeholder="..." />
          </div>

        </div>

        <!-- ملخص الدفع -->
        <div v-if="selectedInvoice && form.amount > 0" class="payment-summary">
          <div class="summary-row">
            <span>المبلغ المستحق</span>
            <span>{{ formatMoney(selectedInvoice.remaining_amount) }}</span>
          </div>
          <div class="summary-row">
            <span>المبلغ المدفوع</span>
            <strong class="text-success">{{ formatMoney(form.amount) }}</strong>
          </div>
          <div class="summary-row" v-if="change > 0">
            <span>الباقي</span>
            <strong class="text-warning">{{ formatMoney(change) }}</strong>
          </div>
        </div>

        <!-- أزرار التأكيد -->
        <div class="modal-actions">
          <button class="btn-cancel" @click="$emit('close')">إلغاء</button>
          <button
            class="btn-pay"
            :disabled="!canPay || isSaving"
            @click="handlePay"
          >
            <span v-if="isSaving" class="spinner-sm"></span>
            <span v-else>💰</span>
            تأكيد السداد
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInvoicesStore }  from '@/stores/invoices.js'
import { useSettingsStore }  from '@/stores/settings.js'
import { useAuthStore }      from '@/stores/auth.js'
import { db }                from '@/database/db.js'

const props = defineProps({ subscriber: { type: Object, required: true } })
const emit  = defineEmits(['close', 'paid'])

const invoices = useInvoicesStore()
const settings = useSettingsStore()
const auth     = useAuthStore()

const unpaidInvoices    = ref([])
const selectedInvoiceId = ref(null)
const isSaving          = ref(false)

const form = ref({
  amount: 0,
  method: 'cash',
  date:   new Date().toISOString().slice(0, 10),
  notes:  '',
})

const methods = [
  { key: 'cash',     label: 'نقدي',   icon: '💵' },
  { key: 'transfer', label: 'تحويل',  icon: '🏦' },
  { key: 'other',    label: 'أخرى',   icon: '📝' },
]

const quickAmounts = computed(() => {
  if (!selectedInvoice.value) return [10, 50, 100, 200]
  const rem = selectedInvoice.value.remaining_amount
  const half = Math.floor(rem / 2)
  return [50, 100, half, rem].filter((v, i, a) => v > 0 && a.indexOf(v) === i).slice(0, 4)
})

const selectedInvoice = computed(() =>
  unpaidInvoices.value.find(i => i.id === selectedInvoiceId.value) ?? null
)

const change = computed(() => {
  if (!selectedInvoice.value) return 0
  return Math.max(0, selectedInvoice.value.remaining_amount - form.value.amount)
})

const canPay = computed(() =>
  selectedInvoiceId.value && form.value.amount > 0 && form.value.amount <= (selectedInvoice.value?.remaining_amount ?? 0)
)

onMounted(async () => {
  unpaidInvoices.value = await db.invoices
    .where('subscriber_id').equals(props.subscriber.id)
    .and(i => ['unpaid','partial'].includes(i.status))
    .toArray()

  if (unpaidInvoices.value.length > 0) {
    selectedInvoiceId.value = unpaidInvoices.value[0].id
    form.value.amount = unpaidInvoices.value[0].remaining_amount
  }
})

function selectInvoice(inv) {
  selectedInvoiceId.value = inv.id
  form.value.amount = inv.remaining_amount
}

function setFullAmount() {
  if (selectedInvoice.value)
    form.value.amount = selectedInvoice.value.remaining_amount
}

function formatMoney(v) {
  return Number(v || 0).toLocaleString('ar-SA') + ' ' + settings.currency
}

async function handlePay() {
  if (!canPay.value) return
  isSaving.value = true
  try {
    await invoices.applyPayment(
      selectedInvoiceId.value,
      form.value.amount,
      auth.currentUser.id,
      { date: form.value.date, method: form.value.method, notes: form.value.notes }
    )
    emit('paid')
  } catch (e) {
    console.error(e)
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 800;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-card {
  background: var(--bg-secondary, #1E293B);
  border-radius: 24px 24px 0 0;
  padding: 0 0 env(safe-area-inset-bottom);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  box-shadow: 0 -10px 40px rgba(0,0,0,0.4);
  animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

/* ─── الرأس ──────────────────────────────────── */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  background: var(--bg-secondary);
  z-index: 1;
}

.modal-header h3 { font-size: 1rem; font-weight: 800; color: var(--text-primary); }

.close-btn {
  width: 30px; height: 30px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem;
}

/* ─── معلومات المشترك ────────────────────────── */
.sub-info-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid var(--border-color);
}

.sub-avatar {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg,#1D4ED8,#7C3AED);
  color: white;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.sub-name  { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
.sub-meter { font-size: 0.72rem; color: var(--text-muted); font-family: monospace; }

/* ─── الفواتير ───────────────────────────────── */
.invoices-section {
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);
}

.section-label { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px; }

.invoice-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.invoice-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1.5px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  font-family: 'Cairo', sans-serif;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.invoice-chip strong { font-size: 0.9rem; color: var(--text-primary); }
.invoice-chip.selected { border-color: var(--primary,#3B82F6); background: rgba(59,130,246,0.1); color: #60A5FA; }
.invoice-chip.selected strong { color: #60A5FA; }

.no-invoices {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px;
  color: var(--text-muted);
  font-size: 0.85rem;
}
.no-invoices span { font-size: 2rem; }

/* ─── نموذج الدفع ────────────────────────────── */
.payment-form {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group { display: flex; flex-direction: column; gap: 6px; }

.form-group label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-input {
  width: 100%;
  padding: 11px 14px;
  background: var(--bg-input, rgba(15,23,42,0.6));
  border: 1.5px solid var(--border-input, rgba(71,85,105,0.5));
  border-radius: 11px;
  color: var(--text-primary);
  font-family: 'Cairo', sans-serif;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
  -webkit-appearance: none;
}
.form-input:focus { border-color: var(--primary,#3B82F6); }

/* حقل المبلغ */
.amount-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.amount-input {
  width: 100%;
  padding: 14px 14px 14px 50px;
  background: var(--bg-input);
  border: 2px solid var(--border-input);
  border-radius: 12px;
  color: var(--text-primary);
  font-family: 'Cairo', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  outline: none;
  text-align: center;
  -webkit-appearance: none;
  transition: border-color 0.2s;
}
.amount-input:focus { border-color: var(--primary,#3B82F6); }

.currency {
  position: absolute;
  left: 14px;
  font-size: 0.85rem;
  color: var(--text-muted);
  pointer-events: none;
}

/* أزرار المبالغ السريعة */
.quick-amounts {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.quick-amt-btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: rgba(255,255,255,0.04);
  color: var(--text-secondary);
  font-family: 'Cairo', sans-serif;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s;
}
.quick-amt-btn:hover { border-color: var(--primary,#3B82F6); color: var(--primary,#3B82F6); }
.quick-amt-btn.full  { border-color: rgba(16,185,129,0.4); color: #34D399; background: rgba(16,185,129,0.08); }

/* طريقة الدفع */
.method-toggle {
  display: flex;
  gap: 6px;
}

.method-btn {
  flex: 1;
  padding: 9px 6px;
  border-radius: 10px;
  border: 1.5px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  font-family: 'Cairo', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.method-btn.active {
  border-color: var(--primary,#3B82F6);
  background: rgba(59,130,246,0.1);
  color: #60A5FA;
}

/* ─── ملخص الدفع ─────────────────────────────── */
.payment-summary {
  margin: 0 20px;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.text-success { color: #34D399; font-weight: 700; }
.text-warning { color: #FBBF24; font-weight: 700; }

/* ─── أزرار ──────────────────────────────────── */
.modal-actions {
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  position: sticky;
  bottom: 0;
  background: var(--bg-secondary);
}

.btn-cancel {
  flex: 1;
  padding: 13px;
  border-radius: 12px;
  border: 1.5px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  font-family: 'Cairo', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-pay {
  flex: 2;
  padding: 13px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg,#059669,#047857);
  color: white;
  font-family: 'Cairo', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(5,150,105,0.3);
}

.btn-pay:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-pay:hover:not(:disabled) { transform: translateY(-1px); }

.spinner-sm {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>