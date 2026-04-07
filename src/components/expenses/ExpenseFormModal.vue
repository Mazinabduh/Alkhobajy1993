<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ expense ? 'تعديل نفقة' : 'إضافة نفقة' }}</h3>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <form class="modal-body" @submit.prevent="handleSave" novalidate>

          <div class="form-group" :class="{ error: errors.description }">
            <label>الوصف <span class="req">*</span></label>
            <input v-model="form.description" type="text" class="form-input" placeholder="وصف النفقة..." />
            <p v-if="errors.description" class="err-msg">{{ errors.description }}</p>
          </div>

          <div class="form-group" :class="{ error: errors.amount }">
            <label>المبلغ <span class="req">*</span></label>
            <div class="amt-wrap">
              <input
                v-model.number="form.amount" type="number" min="0" step="0.01"
                class="form-input" inputmode="decimal" dir="ltr" placeholder="0.00"
              />
              <span class="currency">{{ settings.currency }}</span>
            </div>
            <p v-if="errors.amount" class="err-msg">{{ errors.amount }}</p>
          </div>

          <div class="form-group">
            <label>التصنيف</label>
            <div class="select-add-row">
              <select v-model="form.category_id" class="form-select">
                <option value="">بدون تصنيف</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
              <button type="button" class="add-cat-btn" @click="showAddCat = true">+</button>
            </div>
          </div>

          <div class="form-group">
            <label>التاريخ</label>
            <input v-model="form.expense_date" type="date" class="form-input" dir="ltr" />
          </div>

          <div class="form-group">
            <label>رقم المرجع / الفاتورة</label>
            <input v-model="form.reference_number" type="text" class="form-input" placeholder="اختياري" />
          </div>

          <div class="form-group">
            <label>ملاحظات</label>
            <textarea v-model="form.notes" class="form-textarea" rows="2" placeholder="..."></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="$emit('close')">إلغاء</button>
            <button type="submit" class="btn-save" :disabled="isSaving">
              <span v-if="isSaving" class="spinner-sm"></span>
              <span v-else>💾</span>
              حفظ
            </button>
          </div>
        </form>

        <!-- إضافة تصنيف -->
        <div v-if="showAddCat" class="add-cat-overlay" @click.self="showAddCat = false">
          <div class="add-cat-card">
            <h4>إضافة تصنيف</h4>
            <input v-model="newCatName" type="text" class="form-input" placeholder="اسم التصنيف" @keyup.enter="addCategory" />
            <div class="modal-actions">
              <button class="btn-cancel" @click="showAddCat = false">إلغاء</button>
              <button class="btn-save" @click="addCategory">إضافة</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useExpensesStore } from '@/stores/expenses.js'
import { useSettingsStore } from '@/stores/settings.js'
import { useAuthStore }     from '@/stores/auth.js'

const props = defineProps({
  expense:    { type: Object, default: null },
  categories: { type: Array,  default: () => [] },
})
const emit = defineEmits(['close', 'saved'])

const store    = useExpensesStore()
const settings = useSettingsStore()
const auth     = useAuthStore()
const isSaving   = ref(false)
const showAddCat = ref(false)
const newCatName = ref('')

const form = ref({
  description:      '',
  amount:           '',
  category_id:      '',
  expense_date:     new Date().toISOString().slice(0, 10),
  reference_number: '',
  notes:            '',
})
const errors = ref({ description: '', amount: '' })

onMounted(() => {
  if (props.expense) {
    Object.assign(form.value, {
      description:      props.expense.description,
      amount:           props.expense.amount,
      category_id:      props.expense.category_id ?? '',
      expense_date:     props.expense.expense_date,
      reference_number: props.expense.reference_number ?? '',
      notes:            props.expense.notes ?? '',
    })
  }
})

function validate() {
  errors.value = { description: '', amount: '' }
  let valid = true
  if (!form.value.description?.trim()) { errors.value.description = 'الوصف مطلوب'; valid = false }
  if (!form.value.amount || form.value.amount <= 0) { errors.value.amount = 'المبلغ مطلوب'; valid = false }
  return valid
}

async function handleSave() {
  if (!validate()) return
  isSaving.value = true
  try {
    if (props.expense) {
      await store.update(props.expense.id, form.value)
    } else {
      await store.create(form.value, auth.currentUser?.id)
    }
    emit('saved')
  } finally {
    isSaving.value = false
  }
}

async function addCategory() {
  if (!newCatName.value.trim()) return
  const id = await store.createCategory(newCatName.value.trim())
  form.value.category_id = id
  newCatName.value = ''
  showAddCat.value = false
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
  animation: slideUp 0.3s ease; position: relative;
}
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border-color);
  position: sticky; top: 0; background: var(--bg-secondary); z-index: 1;
}
.modal-header h3 { font-size: 1rem; font-weight: 800; color: var(--text-primary); }

.close-btn {
  width: 30px; height: 30px; border-radius: 8px;
  border: 1px solid var(--border-color); background: transparent;
  color: var(--text-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

.modal-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.error .form-input { border-color: #EF4444; }
.form-group label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }
.req { color: #EF4444; }
.err-msg { font-size: 0.78rem; color: #EF4444; }

.form-input, .form-select, .form-textarea {
  width: 100%; padding: 11px 14px;
  background: var(--bg-input); border: 1.5px solid var(--border-input);
  border-radius: 11px; color: var(--text-primary); font-family: 'Cairo', sans-serif;
  font-size: 0.9rem; outline: none; -webkit-appearance: none;
  transition: border-color 0.2s;
}
.form-input:focus, .form-select:focus { border-color: var(--primary,#3B82F6); }
.form-textarea { resize: vertical; min-height: 60px; }

.amt-wrap { position: relative; display: flex; align-items: center; }
.amt-wrap .form-input { padding-left: 48px; }
.currency { position: absolute; left: 12px; font-size: 0.8rem; color: var(--text-muted); }

.select-add-row { display: flex; gap: 8px; }
.select-add-row .form-select { flex: 1; }
.add-cat-btn {
  width: 44px; background: rgba(59,130,246,0.15);
  border: 1.5px solid rgba(59,130,246,0.3); border-radius: 11px;
  color: #60A5FA; font-size: 1.4rem; cursor: pointer; flex-shrink: 0;
}

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
  flex: 2; padding: 13px; border-radius: 12px; border: none;
  background: linear-gradient(135deg,#1D4ED8,#1E40AF); color: white;
  font-family: 'Cairo', sans-serif; font-size: 0.95rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: all 0.2s; box-shadow: 0 4px 12px rgba(29,78,216,0.3);
}
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner-sm {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.add-cat-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; padding: 20px;
  border-radius: 24px 24px 0 0;
}
.add-cat-card {
  background: var(--bg-secondary); border-radius: 16px; padding: 20px;
  width: 100%; display: flex; flex-direction: column; gap: 12px;
  border: 1px solid var(--border-color);
}
.add-cat-card h4 { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
</style>