<template>
  <div class="expenses-view" dir="rtl">

    <div class="page-header">
      <div class="header-top">
        <h1>النفقات التشغيلية</h1>
        <button class="btn-primary" @click="showForm = true">
          <span>+</span> إضافة نفقة
        </button>
      </div>

      <!-- الإجماليات -->
      <div class="totals-card">
        <div class="total-item">
          <span class="t-icon">💸</span>
          <div>
            <span class="t-val">{{ formatMoney(store.totalAmount) }}</span>
            <span class="t-lbl">إجمالي النفقات</span>
          </div>
        </div>
        <div class="category-breakdown">
          <div
            v-for="(amount, cat) in store.byCategory"
            :key="cat"
            class="cat-item"
          >
            <span class="cat-name">{{ cat }}</span>
            <span class="cat-amount">{{ formatMoney(amount) }}</span>
          </div>
        </div>
      </div>

      <!-- فلاتر -->
      <div class="filters-row">
        <select v-model="store.filterCategory" class="filter-select">
          <option value="">كل التصنيفات</option>
          <option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <input v-model="store.filterMonth" type="month" class="filter-select" dir="ltr" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="center-state">
      <div class="spinner"></div>
    </div>

    <!-- فارغ -->
    <div v-else-if="store.filtered.length === 0" class="center-state">
      <span style="font-size:3rem">💸</span>
      <h3>لا توجد نفقات</h3>
    </div>

    <!-- القائمة -->
    <div v-else class="expenses-list">
      <div
        v-for="expense in store.filtered"
        :key="expense.id"
        class="expense-card"
      >
        <div class="exp-header">
          <div class="exp-icon">{{ getCatIcon(expense.category_name) }}</div>
          <div class="exp-info">
            <h3>{{ expense.description }}</h3>
            <div class="exp-meta">
              <span class="exp-cat">{{ expense.category_name }}</span>
              <span>·</span>
              <span>{{ formatDate(expense.expense_date) }}</span>
            </div>
          </div>
          <div class="exp-amount">{{ formatMoney(expense.amount) }}</div>
        </div>
        <div v-if="expense.notes" class="exp-notes">{{ expense.notes }}</div>
        <div class="exp-actions">
          <button class="ea-btn" @click="editExpense(expense)">✏️ تعديل</button>
          <button class="ea-btn danger" @click="confirmDelete(expense)">🗑️ حذف</button>
        </div>
      </div>
    </div>

    <!-- نموذج الإضافة/التعديل -->
    <ExpenseFormModal
      v-if="showForm"
      :expense="editingExpense"
      :categories="store.categories"
      @close="closeForm"
      @saved="onSaved"
    />

    <AppConfirm
      v-if="showDelete"
      title="حذف النفقة"
      :message="`حذف: ${deletingItem?.description}؟`"
      confirm-label="حذف"
      type="danger"
      @confirm="doDelete"
      @cancel="showDelete = false"
    />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useExpensesStore } from '@/stores/expenses.js'
import { useSettingsStore } from '@/stores/settings.js'
import { useToast }         from '@/composables/useToast.js'
import ExpenseFormModal     from '@/components/expenses/ExpenseFormModal.vue'
import AppConfirm           from '@/components/common/AppConfirm.vue'

const store    = useExpensesStore()
const settings = useSettingsStore()
const toast    = useToast()

const showForm       = ref(false)
const editingExpense = ref(null)
const showDelete     = ref(false)
const deletingItem   = ref(null)

onMounted(async () => {
  await store.loadAll()
  settings.loadSettings()
})

function formatMoney(v) {
  return Number(v||0).toLocaleString('ar-SA') + ' ' + settings.currency
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('ar-SA', { year:'numeric', month:'short', day:'numeric' }) : '—'
}

function getCatIcon(cat) {
  return { 'وقود':'⛽', 'رواتب':'👔', 'صيانة':'🔧', 'نفقات عامة':'📋' }[cat] ?? '💸'
}

function editExpense(exp) {
  editingExpense.value = exp
  showForm.value       = true
}

function confirmDelete(exp) {
  deletingItem.value = exp
  showDelete.value   = true
}

async function doDelete() {
  showDelete.value = false
  await store.remove(deletingItem.value.id)
  toast.success('تم حذف النفقة')
}

function closeForm() {
  showForm.value       = false
  editingExpense.value = null
}

function onSaved() {
  closeForm()
  toast.success('تم حفظ النفقة')
}
</script>

<style scoped>
.expenses-view { display: flex; flex-direction: column; min-height: 100%; }

.page-header {
  background: var(--bg-secondary); padding: 14px;
  display: flex; flex-direction: column; gap: 10px;
  border-bottom: 1px solid var(--border-color);
  position: sticky; top: 0; z-index: 10;
}

.header-top { display: flex; align-items: center; justify-content: space-between; }
.header-top h1 { font-size: 1.2rem; font-weight: 800; color: var(--text-primary); }

.btn-primary {
  padding: 9px 16px; background: linear-gradient(135deg,#1D4ED8,#1E40AF);
  border: none; border-radius: 11px; color: white; font-family: 'Cairo', sans-serif;
  font-size: 0.88rem; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; gap: 4px;
}

.totals-card {
  background: linear-gradient(135deg,rgba(30,64,175,0.15),rgba(245,158,11,0.08));
  border: 1px solid rgba(59,130,246,0.2); border-radius: 12px; padding: 12px;
  display: flex; flex-direction: column; gap: 10px;
}

.total-item {
  display: flex; align-items: center; gap: 10px;
}
.t-icon { font-size: 1.8rem; }
.t-val  { display: block; font-size: 1.2rem; font-weight: 800; color: #F87171; }
.t-lbl  { font-size: 0.72rem; color: var(--text-muted); }

.category-breakdown {
  display: flex; flex-wrap: wrap; gap: 6px;
  padding-top: 8px; border-top: 1px solid var(--border-color);
}

.cat-item {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 8px;
  background: rgba(255,255,255,0.04); border: 1px solid var(--border-color);
}
.cat-name   { font-size: 0.75rem; color: var(--text-muted); }
.cat-amount { font-size: 0.82rem; font-weight: 700; color: var(--text-primary); }

.filters-row { display: flex; gap: 8px; }
.filter-select {
  flex: 1; padding: 9px 10px; background: var(--bg-input);
  border: 1.5px solid var(--border-input); border-radius: 10px;
  color: var(--text-secondary); font-family: 'Cairo', sans-serif;
  font-size: 0.8rem; outline: none; -webkit-appearance: none;
}

.center-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 60px 20px; color: var(--text-muted);
}
.spinner {
  width: 32px; height: 32px; border: 3px solid rgba(59,130,246,0.2);
  border-top-color: #3B82F6; border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.center-state h3 { font-size: 1rem; color: var(--text-secondary); }

.expenses-list { display: flex; flex-direction: column; gap: 8px; padding: 8px; }

.expense-card {
  background: var(--card-bg); border: 1px solid var(--border-color);
  border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 8px;
}

.exp-header { display: flex; align-items: center; gap: 10px; }

.exp-icon {
  width: 42px; height: 42px; border-radius: 11px;
  background: rgba(239,68,68,0.1); display: flex; align-items: center;
  justify-content: center; font-size: 1.3rem; flex-shrink: 0;
}

.exp-info { flex: 1; min-width: 0; }
.exp-info h3 {
  font-size: 0.9rem; font-weight: 700; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.exp-meta { display: flex; gap: 6px; font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
.exp-cat  { color: #60A5FA; }

.exp-amount { font-size: 1rem; font-weight: 800; color: #F87171; flex-shrink: 0; }

.exp-notes {
  font-size: 0.78rem; color: var(--text-muted);
  padding: 6px 10px; background: rgba(255,255,255,0.02);
  border-radius: 8px;
}

.exp-actions { display: flex; gap: 6px; }
.ea-btn {
  padding: 6px 12px; border-radius: 8px; border: none;
  background: rgba(255,255,255,0.05); color: var(--text-secondary);
  font-family: 'Cairo', sans-serif; font-size: 0.75rem; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.ea-btn:hover { background: rgba(255,255,255,0.1); }
.ea-btn.danger { color: #FCA5A5; }
.ea-btn.danger:hover { background: rgba(239,68,68,0.1); }
</style>