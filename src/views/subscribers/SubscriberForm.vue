<template>
  <div class="form-view" dir="rtl">

    <!-- رأس الصفحة -->
    <div class="form-header">
      <button class="back-btn" @click="router.back()">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      <h1>{{ isEdit ? 'تعديل مشترك' : 'إضافة مشترك' }}</h1>
      <div class="w-10"></div>
    </div>

    <!-- النموذج -->
    <form class="form-body" @submit.prevent="handleSubmit" novalidate>

      <!-- القسم الأول: البيانات الأساسية -->
      <div class="form-section">
        <h2 class="section-title">📋 البيانات الأساسية</h2>

        <!-- الاسم -->
        <div class="form-group" :class="{ error: errors.name }">
          <label>الاسم الكامل <span class="required">*</span></label>
          <input v-model="form.name" type="text" placeholder="أدخل اسم المشترك" class="form-input" />
          <p v-if="errors.name" class="error-msg">{{ errors.name }}</p>
        </div>

        <!-- رقم الهاتف -->
        <div class="form-group">
          <label>رقم الهاتف</label>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="05xxxxxxxx"
            class="form-input"
            inputmode="numeric"
            dir="ltr"
          />
        </div>

        <!-- رقم العداد -->
        <div class="form-group" :class="{ error: errors.meter_number }">
          <label>رقم العداد <span class="required">*</span></label>
          <input
            v-model="form.meter_number"
            type="text"
            placeholder="أدخل رقم العداد"
            class="form-input"
            dir="ltr"
          />
          <p v-if="errors.meter_number" class="error-msg">{{ errors.meter_number }}</p>
        </div>

        <!-- المنطقة -->
        <div class="form-group">
          <label>المنطقة</label>
          <div class="select-with-add">
            <select v-model="form.zone_id" class="form-select">
              <option value="">اختر المنطقة</option>
              <option v-for="z in store.zones" :key="z.id" :value="z.id">{{ z.name }}</option>
            </select>
            <button type="button" class="add-zone-btn" @click="showAddZone = true">+</button>
          </div>
        </div>

        <!-- العنوان -->
        <div class="form-group">
          <label>العنوان / الوصف</label>
          <textarea
            v-model="form.address"
            placeholder="وصف موقع المشترك (اختياري)"
            class="form-textarea"
            rows="2"
          ></textarea>
        </div>
      </div>

      <!-- القسم الثاني: البيانات المالية -->
      <div class="form-section">
        <h2 class="section-title">💰 البيانات المالية</h2>

        <!-- المقدم -->
        <div class="form-group">
          <label>المقدم (ضمان)</label>
          <div class="input-with-currency">
            <input
              v-model.number="form.deposit"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              class="form-input"
              inputmode="decimal"
              dir="ltr"
            />
            <span class="currency-badge">{{ settings.currency }}</span>
          </div>
        </div>

        <!-- الرصيد -->
        <div class="form-group">
          <label>
            الرصيد الافتراضي
            <span class="label-hint">(متأخرات سابقة بالموجب أو رصيد دائن بالسالب)</span>
          </label>
          <div class="input-with-currency">
            <input
              v-model.number="form.balance"
              type="number"
              step="0.01"
              placeholder="0.00"
              class="form-input"
              inputmode="decimal"
              dir="ltr"
            />
            <span class="currency-badge">{{ settings.currency }}</span>
          </div>
        </div>

        <!-- تاريخ الاشتراك -->
        <div class="form-group">
          <label>تاريخ الاشتراك</label>
          <input v-model="form.join_date" type="date" class="form-input" dir="ltr" />
        </div>
      </div>

      <!-- القسم الثالث: إعدادات العداد -->
      <div class="form-section">
        <h2 class="section-title">⚡ إعدادات العداد</h2>

        <!-- القراءة الافتراضية -->
        <div class="form-group">
          <label>القراءة الأولية للعداد</label>
          <input
            v-model.number="form.initial_reading"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            class="form-input"
            inputmode="numeric"
            dir="ltr"
          />
          <p class="field-hint">هذه هي القراءة السابقة عند بداية اشتراك العميل</p>
        </div>

        <!-- حالة الاشتراك -->
        <div class="form-group">
          <label>حالة الاشتراك</label>
          <div class="status-toggle">
            <button
              type="button"
              class="toggle-btn"
              :class="{ active: form.status === 'active' }"
              @click="form.status = 'active'"
            >✅ نشط</button>
            <button
              type="button"
              class="toggle-btn"
              :class="{ active: form.status === 'disconnected' }"
              @click="form.status = 'disconnected'"
            >🔌 مفصول</button>
          </div>
        </div>

        <!-- ملاحظات -->
        <div class="form-group">
          <label>ملاحظات</label>
          <textarea
            v-model="form.notes"
            placeholder="أي ملاحظات إضافية..."
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- أزرار الحفظ -->
      <div class="form-actions">
        <button type="button" class="btn-cancel" @click="router.back()">إلغاء</button>
        <button type="submit" class="btn-save" :disabled="isSaving">
          <span v-if="isSaving" class="spinner-sm"></span>
          <span v-else>💾</span>
          {{ isEdit ? 'حفظ التعديلات' : 'إضافة المشترك' }}
        </button>
      </div>

    </form>

    <!-- Modal إضافة منطقة -->
    <div v-if="showAddZone" class="modal-overlay" @click.self="showAddZone = false">
      <div class="modal-card">
        <h3>إضافة منطقة جديدة</h3>
        <input
          v-model="newZoneName"
          type="text"
          placeholder="اسم المنطقة"
          class="form-input"
          @keyup.enter="addZone"
        />
        <div class="modal-actions">
          <button class="btn-cancel" @click="showAddZone = false">إلغاء</button>
          <button class="btn-save" @click="addZone">إضافة</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute }      from 'vue-router'
import { useAuthStore }             from '@/stores/auth.js'
import { useSubscribersStore }      from '@/stores/subscribers.js'
import { useSettingsStore }         from '@/stores/settings.js'
import { useReadingsStore }         from '@/stores/readings.js'
import { useToast }                 from '@/composables/useToast.js'

const router   = useRouter()
const route    = useRoute()
const auth     = useAuthStore()
const store    = useSubscribersStore()
const settings = useSettingsStore()
const readings = useReadingsStore()
const toast    = useToast()

const isEdit     = computed(() => !!route.params.id)
const isSaving   = ref(false)
const showAddZone = ref(false)
const newZoneName = ref('')

const form = ref({
  name:            '',
  phone:           '',
  meter_number:    '',
  zone_id:         '',
  address:         '',
  deposit:         0,
  balance:         0,
  join_date:       new Date().toISOString().slice(0, 10),
  initial_reading: 0,
  status:          'active',
  notes:           '',
})

const errors = ref({
  name:         '',
  meter_number: '',
})

onMounted(async () => {
  await store.loadZones()

  if (isEdit.value) {
    const sub = await store.getById(route.params.id)
    if (sub) {
      Object.assign(form.value, {
        name:            sub.name ?? '',
        phone:           sub.phone ?? '',
        meter_number:    sub.meter_number ?? '',
        zone_id:         sub.zone_id ?? '',
        address:         sub.address ?? '',
        deposit:         sub.deposit ?? 0,
        balance:         sub.balance ?? 0,
        join_date:       sub.join_date ?? '',
        status:          sub.status ?? 'active',
        notes:           sub.notes ?? '',
      })
    }
  }
})

function validate() {
  let valid = true
  errors.value = { name: '', meter_number: '' }

  if (!form.value.name.trim()) {
    errors.value.name = 'اسم المشترك مطلوب'
    valid = false
  }
  if (!form.value.meter_number.trim()) {
    errors.value.meter_number = 'رقم العداد مطلوب'
    valid = false
  }
  return valid
}

async function handleSubmit() {
  if (!validate()) return

  isSaving.value = true

  try {
    if (isEdit.value) {
      await store.update(route.params.id, form.value)
      toast.success('تم تعديل بيانات المشترك')
    } else {
      const newId = await store.create(form.value, auth.currentUser.id)

      // إنشاء قراءة أولية إذا تم إدخال قراءة ابتدائية
      if (form.value.initial_reading > 0) {
        await readings.create({
          subscriber_id:    newId,
          previous_reading: 0,
          current_reading:  form.value.initial_reading,
          reading_date:     form.value.join_date,
          period_month:     form.value.join_date?.slice(0, 7),
          notes:            'قراءة أولية عند الاشتراك',
        }, auth.currentUser.id)

        // تحديث حالة القراءة لتكون "مرجعية" وليس "معلقة"
        const lastReading = await readings.getLastReading(newId)
        if (lastReading) {
          const { db } = await import('@/database/db.js')
          await db.readings.update(lastReading.id, { status: 'billed' })
        }
      }

      toast.success('تم إضافة المشترك بنجاح')
    }

    router.back()
  } catch (e) {
    toast.error(e.message || 'حدث خطأ أثناء الحفظ')
  } finally {
    isSaving.value = false
  }
}

async function addZone() {
  if (!newZoneName.value.trim()) return
  const id = await store.createZone(newZoneName.value.trim())
  form.value.zone_id = id
  newZoneName.value  = ''
  showAddZone.value  = false
}
</script>

<style scoped>
.form-view {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

/* ─── رأس النموذج ────────────────────────────── */
.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.form-header h1 {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
}

.back-btn {
  width: 38px; height: 38px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.back-btn:hover { border-color: var(--primary); color: var(--primary); }

/* ─── جسم النموذج ────────────────────────────── */
.form-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-bottom: 20px;
}

/* ─── أقسام النموذج ──────────────────────────── */
.form-section {
  background: var(--bg-secondary);
  margin: 8px;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

/* ─── حقول النموذج ───────────────────────────── */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.error .form-input { border-color: #EF4444; }

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.required { color: #EF4444; }

.label-hint {
  font-size: 0.72rem;
  font-weight: 400;
  color: var(--text-muted);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 14px;
  background: var(--bg-input);
  border: 1.5px solid var(--border-input);
  border-radius: 12px;
  color: var(--text-primary);
  font-family: 'Cairo', sans-serif;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
  -webkit-appearance: none;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus { border-color: var(--primary, #3B82F6); }

.form-textarea { resize: vertical; min-height: 60px; }

.field-hint {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.error-msg {
  font-size: 0.78rem;
  color: #EF4444;
}

/* المدخل مع الرمز */
.input-with-currency {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-currency .form-input { padding-left: 48px; }

.currency-badge {
  position: absolute;
  left: 12px;
  font-size: 0.8rem;
  color: var(--text-muted);
  pointer-events: none;
}

/* القائمة مع زر الإضافة */
.select-with-add {
  display: flex;
  gap: 8px;
}

.select-with-add .form-select { flex: 1; }

.add-zone-btn {
  width: 44px;
  background: rgba(59,130,246,0.15);
  border: 1.5px solid rgba(59,130,246,0.3);
  border-radius: 12px;
  color: #60A5FA;
  font-size: 1.4rem;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}
.add-zone-btn:hover { background: rgba(59,130,246,0.25); }

/* ─── حالة الاشتراك Toggle ───────────────────── */
.status-toggle {
  display: flex;
  gap: 8px;
}

.toggle-btn {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  border: 1.5px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  font-family: 'Cairo', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  border-color: var(--primary);
  background: rgba(59,130,246,0.1);
  color: #60A5FA;
}

/* ─── أزرار النموذج ──────────────────────────── */
.form-actions {
  display: flex;
  gap: 10px;
  padding: 16px;
  margin: 0 8px;
  position: sticky;
  bottom: 0;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  flex: 1;
  padding: 13px;
  border-radius: 12px;
  border: 1.5px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  font-family: 'Cairo', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel:hover { border-color: var(--text-secondary); }

.btn-save {
  flex: 2;
  padding: 13px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #1D4ED8, #1E40AF);
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
  box-shadow: 0 4px 12px rgba(29,78,216,0.3);
}
.btn-save:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(29,78,216,0.4); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner-sm {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Modal المنطقة ──────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 20px;
}

.modal-card {
  background: var(--bg-secondary);
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
}

.modal-card h3 { font-size: 1rem; font-weight: 700; color: var(--text-primary); }

.modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
</style>