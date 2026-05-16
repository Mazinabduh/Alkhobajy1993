<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? 'تعديل العداد' : 'إضافة عداد' }}</h1>
      <router-link to="/meters" class="btn btn-outline">العودة</router-link>
    </div>

    <form class="form-card" @submit.prevent="saveMeter">
      <div class="form-group">
        <label class="form-label">الرقم التسلسلي</label>
        <input v-model="form.serial_number" type="text" class="form-input" required />
      </div>

      <div class="form-group">
        <label class="form-label">المشترك</label>
        <select v-model="form.subscriber_id" class="form-input">
          <option value="">بدون مشترك</option>
          <option v-for="sub in subscribers" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">الحالة</label>
        <select v-model="form.status" class="form-input">
          <option value="active">نشط</option>
          <option value="inactive">معطل</option>
        </select>
      </div>

      <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:16px;">
        {{ isEdit ? 'حفظ التعديلات' : 'إضافة العداد' }}
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
const subscribers = ref([])
const form = ref({ serial_number: '', subscriber_id: '', status: 'active' })

onMounted(async () => {
  subscribers.value = await db.subscribers.toArray()

  if (isEdit.value) {
    const meter = await db.meters.get(parseInt(route.params.id))
    if (meter) {
      form.value = { serial_number: meter.serial_number, subscriber_id: meter.subscriber_id || '', status: meter.status || 'active' }
    }
  }
})

async function saveMeter() {
  try {
    const data = { ...form.value, subscriber_id: form.value.subscriber_id || null, updated_at: new Date().toISOString() }
    if (isEdit.value) {
      await db.meters.update(parseInt(route.params.id), data)
    } else {
      data.created_at = new Date().toISOString()
      await db.meters.add(data)
    }
    router.push('/meters')
  } catch (e) {
    console.error('Error saving meter:', e)
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
