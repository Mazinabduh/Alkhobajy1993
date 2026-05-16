<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? 'تعديل عنصر' : 'إضافة عنصر' }}</h1>
      <router-link to="/inventory" class="btn btn-outline">العودة</router-link>
    </div>

    <form class="form-card" @submit.prevent="saveItem">
      <div class="form-group">
        <label class="form-label">اسم العنصر</label>
        <input v-model="form.name" type="text" class="form-input" required />
      </div>

      <div class="form-group">
        <label class="form-label">التصنيف</label>
        <select v-model="form.category_id" class="form-input" required>
          <option value="">اختر التصنيف</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">الكمية</label>
        <input v-model.number="form.quantity" type="number" class="form-input" min="0" />
      </div>

      <div class="form-group">
        <label class="form-label">الوحدة</label>
        <input v-model="form.unit" type="text" class="form-input" placeholder="مثال: قطعة، متر" />
      </div>

      <div class="form-group">
        <label class="form-label">السعر</label>
        <input v-model.number="form.price" type="number" class="form-input" min="0" step="0.01" />
      </div>

      <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:16px;">
        {{ isEdit ? 'حفظ التعديلات' : 'إضافة العنصر' }}
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
const form = ref({ name: '', category_id: '', quantity: 0, unit: '', price: 0 })

onMounted(async () => {
  categories.value = await db.inventory_categories.toArray()

  if (isEdit.value) {
    const item = await db.inventory_items.get(parseInt(route.params.id))
    if (item) {
      form.value = { name: item.name, category_id: item.category_id, quantity: item.quantity || 0, unit: item.unit || '', price: item.price || 0 }
    }
  }
})

async function saveItem() {
  try {
    const data = { ...form.value, updated_at: new Date().toISOString() }
    if (isEdit.value) {
      await db.inventory_items.update(parseInt(route.params.id), data)
    } else {
      data.status = 'available'
      data.created_at = new Date().toISOString()
      await db.inventory_items.add(data)
    }
    router.push('/inventory')
  } catch (e) {
    console.error('Error saving item:', e)
  }
}
</script>

<style scoped>
.page-container { padding: 16px; max-width: 600px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.btn { padding: 8px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; }
.btn-primary { background: var(--primary); color: white; border: none; }
.btn-outline { background: transparent; color: var(--primary); border: 1px solid var(--primary); }
.form-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
.form-input { width: 100%; padding: 10px 14px; background: var(--bg-input); border: 1.5px solid var(--border-input); border-radius: 10px; color: var(--text-primary); font-size: 0.9rem; font-family: 'Cairo', sans-serif; outline: none; direction: rtl; }
.form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
</style>
