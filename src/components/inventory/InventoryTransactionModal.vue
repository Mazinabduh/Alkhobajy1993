<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ typeLabel }} - {{ item.name }}</h3>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <div class="modal-body">
          <div class="item-current">
            <span class="curr-label">الرصيد الحالي</span>
            <span class="curr-value">{{ item.quantity }} {{ item.unit }}</span>
          </div>

          <div class="form-group">
            <label>الكمية <span class="req">*</span></label>
            <div class="qty-input-wrap">
              <input
                v-model.number="form.quantity"
                type="number" min="0.01" step="0.01"
                class="form-input large" inputmode="decimal" dir="ltr"
                placeholder="0"
              />
              <span class="unit-badge">{{ item.unit }}</span>
            </div>
            <div class="new-balance" v-if="form.quantity > 0">
              الرصيد بعد العملية:
              <strong :class="newBalance < 0 ? 'text-danger' : 'text-success'">
                {{ newBalance }} {{ item.unit }}
              </strong>
            </div>
          </div>

          <div class="form-group">
            <label>سعر الوحدة</label>
            <div class="price-input-wrap">
              <input
                v-model.number="form.unit_price"
                type="number" min="0" step="0.01"
                class="form-input" inputmode="decimal" dir="ltr"
                placeholder="0.00"
              />
              <span class="currency-badge">{{ settings.currency }}</span>
            </div>
          </div>

          <div class="form-group">
            <label>التاريخ</label>
            <input v-model="form.date" type="date" class="form-input" dir="ltr" />
          </div>

          <div class="form-group">
            <label>الجهة / المرجع</label>
            <input v-model="form.reference" type="text" class="form-input" placeholder="اسم المورد أو رقم الفاتورة..." />
          </div>

          <div class="form-group">
            <label>ملاحظات</label>
            <textarea v-model="form.notes" class="form-textarea" rows="2" placeholder="..."></textarea>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="$emit('close')">إلغاء</button>
          <button
            class="btn-save"
            :class="type === 'purchase' ? 'success' : 'danger'"
            :disabled="!form.quantity || form.quantity <= 0 || isSaving"
            @click="handleSave"
          >
            <span v-if="isSaving" class="spinner-sm"></span>
            <span v-else>{{ type === 'purchase' ? '📥' : '📤' }}</span>
            تأكيد
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useInventoryStore } from '@/stores/inventory.js'
import { useSettingsStore }  from '@/stores/settings.js'
import { useAuthStore }      from '@/stores/auth.js'

const props = defineProps({
  item: { type: Object, required: true },
  type: { type: String, default: 'purchase' },
})
const emit = defineEmits(['close', 'saved'])

const store    = useInventoryStore()
const settings = useSettingsStore()
const auth     = useAuthStore()
const isSaving = ref(false)

const form = ref({
  quantity:   '',
  unit_price: props.type === 'purchase' ? props.item.purchase_price : props.item.selling_price,
  date:       new Date().toISOString().slice(0, 10),
  reference:  '',
  notes:      '',
})

const typeLabel = computed(() => ({
  purchase:    '📥 وارد / شراء',
  sale:        '📤 مبيع',
  consumption: '📤 استهلاك / صرف',
  adjustment:  '🔄 تسوية',
})[props.type] ?? props.type)

const newBalance = computed(() => {
  const qty = parseFloat(form.value.quantity) || 0
  if (['purchase', 'adjustment'].includes(props.type)) return props.item.quantity + qty
  return props.item.quantity - qty
})

async function handleSave() {
  isSaving.value = true
  try {
    await store.addTransaction({
      item_id:          props.item.id,
      transaction_type: props.type,
      quantity:         parseFloat(form.value.quantity),
      unit_price:       parseFloat(form.value.unit_price || 0),
      total_amount:     parseFloat(form.value.quantity) * parseFloat(form.value.unit_price || 0),
      notes:           [form.value.reference, form.value.notes].filter(Boolean).join(' - '),
      transaction_date: form.value.date,
      created_by:       auth.currentUser?.id,
    })
    emit('saved')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.65);
  backdrop-filter: blur(6px); display: flex; align-items: flex-end;
  justify-content: center; z-index: 800;
}

.modal-card {
  background: var(--bg-secondary); border-radius: 24px 24px 0 0;
  width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
  border: 1px solid var(--border-color); box-shadow: 0 -10px 40px rgba(0,0,0,0.4);
  animation: slideUp 0.3s ease;
}
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border-color);
  position: sticky; top: 0; background: var(--bg-secondary); z-index: 1;
}
.modal-header h3 { font-size: 0.95rem; font-weight: 800; color: var(--text-primary); }

.close-btn {
  width: 30px; height: 30px; border-radius: 8px;
  border: 1px solid var(--border-color); background: transparent;
  color: var(--text-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

.modal-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }

.item-current {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: rgba(255,255,255,0.03);
  border-radius: 10px; border: 1px solid var(--border-color);
}
.curr-label { font-size: 0.82rem; color: var(--text-muted); }
.curr-value { font-size: 1rem; font-weight: 700; color: var(--text-primary); }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }
.req { color: #EF4444; }

.qty-input-wrap, .price-input-wrap { position: relative; display: flex; align-items: center; }

.form-input {
  width: 100%; padding: 11px 14px;
  background: var(--bg-input); border: 1.5px solid var(--border-input);
  border-radius: 11px; color: var(--text-primary);
  font-family: 'Cairo', sans-serif; font-size: 0.9rem; outline: none;
  -webkit-appearance: none; transition: border-color 0.2s;
}
.form-input.large { font-size: 1.3rem; font-weight: 700; text-align: center; padding-left: 60px; }
.form-input:focus { border-color: var(--primary,#3B82F6); }

.unit-badge, .currency-badge {
  position: absolute; left: 12px; font-size: 0.8rem; color: var(--text-muted);
}

.form-textarea {
  width: 100%; padding: 10px 14px; resize: vertical; min-height: 60px;
  background: var(--bg-input); border: 1.5px solid var(--border-input);
  border-radius: 11px; color: var(--text-primary);
  font-family: 'Cairo', sans-serif; font-size: 0.875rem; outline: none;
}

.new-balance {
  font-size: 0.82rem; color: var(--text-secondary); padding: 4px 0;
}
.text-success { color: #34D399; font-weight: 700; }
.text-danger  { color: #F87171; font-weight: 700; }

.modal-actions {
  display: flex; gap: 10px; padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  position: sticky; bottom: 0; background: var(--bg-secondary);
}

.btn-cancel {
  flex: 1; padding: 13px; border-radius: 12px;
  border: 1.5px solid var(--border-color); background: transparent;
  color: var(--text-secondary); font-family: 'Cairo', sans-serif;
  font-size: 0.9rem; font-weight: 600; cursor: pointer;
}

.btn-save {
  flex: 2; padding: 13px; border-radius: 12px; border: none; color: white;
  font-family: 'Cairo', sans-serif; font-size: 0.95rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: all 0.2s;
}
.btn-save.success { background: linear-gradient(135deg,#059669,#047857); box-shadow: 0 4px 12px rgba(5,150,105,0.3); }
.btn-save.danger  { background: linear-gradient(135deg,#DC2626,#B91C1C); box-shadow: 0 4px 12px rgba(220,38,38,0.3); }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner-sm {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>