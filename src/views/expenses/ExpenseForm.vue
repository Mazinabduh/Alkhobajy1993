<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? 'تعديل النفق' : 'إضافة نفقة' }}</h1>
      <router-link to="/expenses" class="btn btn-outline">العودة</router-link>
    </div>

    <form class="form-card" @submit.prevent="saveExpense">
      <div class="form-group">
        <label class="form-label">التصنيف</label>
        <select v-model="form.category_id" class="form-input" required>
          <option value="">اختر التصنيف</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">المبلغ</label>
        <input v-model.number="form.amount" type="number" class="form-input" min="0" step="0.01" required />
      </div>

      <div class="form-group">
        <label class="form-label">الوصف</label>
        <textarea v-model="form.description" class="form-input" rows="3"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">التاريخ</label>
        <input v-model="form.expense_date" type="date" class="form-input" required />
      </div>

      <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:16px;">
        {{ isEdit ? 'حفظ التعديلات' : 'إضافة النفقة' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/database/db.js'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const categories = ref([])
const form = ref({ category_id: '', amount: 0, description: '', expense_date: new Date().toISOString().slice(0, 10) })

onMounted(async () => {
  categories.value = await db.expense_categories.toArray()

  if (isEdit.value) {
    const expense = await db.expenses.get(parseInt(route.params.id))
    if (expense) {
      form.value = { category_id: expense.category_id, amount: expense.amount, description: expense.description || '', expense_date: expense.expense_date?.slice(0, 10) || '' }
    }
  }
})

async function saveExpense() {
  try {
    const data = { ...form.value, updated_at: new Date().toISOString() }
    if (isEdit.value) {
      await db.expenses.update(parseInt(route.params.id), data)
    } else {
      data.created_at = new Date().toISOString()
      data.created_by = 1
      await db.expenses.add(data)
    }
    router.push('/expenses')
  } catch (e) {
    console.error('Error saving expense:', e)
  }
}
</script>

<style scoped>
.page-container { padding: 16px; max-width: 600px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.btn { padding: 8px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.btn-primary { background: var(--primary); color: white; border: none; }
.btn-outline { background: transparent; color: var(--primary); border: 1px solid var(--primary); }
.form-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
.form-input { width: 100%; padding: 10px 14px; background: var(--bg-input); border: 1.5px solid var(--border-input); border-radius: 10px; color: var(--text-primary); font-size: 0.9rem; font-family: 'Cairo', sans-serif; outline: none; direction: rtl; }
.form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
</style>
