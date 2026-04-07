<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-card">
        <div class="modal-header">
          <h3>💰 سداد الفاتورة</h3>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <div class="invoice-info">
          <div class="info-row">
            <span>رقم الفاتورة</span>
            <strong>{{ invoice.invoice_number }}</strong>
          </div>
          <div class="info-row">
            <span>المشترك</span>
            <strong>{{ invoice.subscriber_name }}</strong>
          </div>
          <div class="info-row">
            <span>الفترة</span>
            <strong>{{ invoice.period_month }}</strong>
          </div>
          <div class="info-row total">
            <span>المتبقي</span>
            <strong class="text-danger">{{ formatMoney(invoice.remaining_amount) }}</strong>
          </div>
        </div>

        <div class="payment-form">
          <div class="form-group">
            <label>المبلغ المدفوع</label>
            <div class="amount-wrap">
              <input
                v-model.number="amount"
                type="number"
                min="0"
                :max="invoice.remaining_amount"
                step="0.01"
                class="amount-input"
                inputmode="decimal"
                dir="ltr"
              />
              <span class="currency">{{ settings.currency }}</span>
            </div>
            <div class="quick-amounts">
              <button class="qa-btn" @click="amount = invoice.remaining_amount">كامل المبلغ</button>
              <button class="qa-btn" @click="amount = Math.floor(invoice.remaining_amount / 2)">نصف</button>
            </div>
          </div>

          <div class="form-group">
            <label>تاريخ السداد</label>
            <input v-model="date" type="date" class="form-input" dir="ltr" />
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="$emit('close')">إلغاء</button>
          <button
            class="btn-pay"
            :disabled="!amount || amount <= 0 || isSaving"
            @click="handlePay"
          >
            <span v-if="isSaving" class="spinner-sm"></span>
            <span v-else>💰</span>
            تأكيد
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { useInvoicesStore } from '@/stores/invoices.js'
import { useSettingsStore } from '@/stores/settings.js'
import { useAuthStore }     from '@/stores/auth.js'

const props = defineProps({ invoice: { type: Object, required: true } })
const emit  = defineEmits(['close', 'paid'])

const invoices = useInvoicesStore()
const settings = useSettingsStore()
const auth     = useAuthStore()

const amount   = ref(props.invoice.remaining_amount)
const date     = ref(new Date().toISOString().slice(0,10))
const isSaving = ref(false)

function formatMoney(v) {
  return Number(v||0).toLocaleString('ar-SA') + ' ' + settings.currency
}

async function handlePay() {
  isSaving.value = true
  try {
    await invoices.applyPayment(props.invoice.id, amount.value, auth.currentUser.id, { date: date.value })
    emit('paid')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(6px);
  display: flex; align-items: flex-end; justify-content: center;
  z-index: 800;
}

.modal-card {
  background: var(--bg-secondary);
  border-radius: 24px 24px 0 0;
  padding: 0;
  width: 100%; max-width: 480px;
  border: 1px solid var(--border-color);
  box-shadow: 0 -10px 40px rgba(0,0,0,0.4);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}
.modal-header h3 { font-size: 1rem; font-weight: 800; color: var(--text-primary); }

.close-btn {
  width: 30px; height: 30px; border-radius: 8px;
  border: 1px solid var(--border-color); background: transparent;
  color: var(--text-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

.invoice-info {
  padding: 14px 20px;
  display: flex; flex-direction: column; gap: 6px;
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid var(--border-color);
}

.info-row {
  display: flex; justify-content: space-between;
  font-size: 0.875rem; color: var(--text-secondary);
}
.info-row strong { color: var(--text-primary); }
.info-row.total strong { font-size: 1rem; }
.text-danger { color: #F87171; }

.payment-form {
  padding: 16px 20px;
  display: flex; flex-direction: column; gap: 12px;
}

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }

.amount-wrap { position: relative; display: flex; align-items: center; }
.amount-input {
  width: 100%; padding: 13px 14px 13px 48px;
  background: var(--bg-input); border: 2px solid var(--border-input);
  border-radius: 12px; color: var(--text-primary);
  font-family: 'Cairo', sans-serif; font-size: 1.3rem; font-weight: 700;
  text-align: center; outline: none; -webkit-appearance: none;
  transition: border-color 0.2s;
}
.amount-input:focus { border-color: var(--primary,#3B82F6); }
.currency { position: absolute; left: 14px; font-size: 0.85rem; color: var(--text-muted); }

.quick-amounts { display: flex; gap: 8px; }
.qa-btn {
  flex: 1; padding: 8px; border-radius: 8px;
  border: 1px solid var(--border-color); background: rgba(255,255,255,0.04);
  color: var(--text-secondary); font-family: 'Cairo', sans-serif;
  font-size: 0.82rem; cursor: pointer; transition: all 0.15s;
}
.qa-btn:hover { border-color: var(--primary); color: var(--primary); }

.form-input {
  width: 100%; padding: 11px 14px;
  background: var(--bg-input); border: 1.5px solid var(--border-input);
  border-radius: 11px; color: var(--text-primary);
  font-family: 'Cairo', sans-serif; font-size: 0.9rem;
  outline: none; -webkit-appearance: none;
}

.modal-actions {
  display: flex; gap: 10px; padding: 16px 20px;
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  flex: 1; padding: 13px; border-radius: 12px;
  border: 1.5px solid var(--border-color); background: transparent;
  color: var(--text-secondary); font-family: 'Cairo', sans-serif;
  font-size: 0.9rem; font-weight: 600; cursor: pointer;
}

.btn-pay {
  flex: 2; padding: 13px; border-radius: 12px; border: none;
  background: linear-gradient(135deg,#059669,#047857); color: white;
  font-family: 'Cairo', sans-serif; font-size: 0.95rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: all 0.2s; box-shadow: 0 4px 12px rgba(5,150,105,0.3);
}
.btn-pay:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner-sm {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>