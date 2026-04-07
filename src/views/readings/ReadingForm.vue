<template>
  <div class="reading-form-view" dir="rtl">

    <!-- رأس الصفحة -->
    <div class="form-header">
      <button class="back-btn" @click="router.back()">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      <h1>{{ isEdit ? 'تعديل قراءة' : 'قراءة جديدة' }}</h1>
      <div class="w-10"></div>
    </div>

    <form class="form-body" @submit.prevent="handleSubmit" novalidate>

      <!-- اختيار المشترك -->
      <div class="form-section">
        <h2 class="section-title">⚡ بيانات القراءة</h2>

        <!-- اختيار المشترك -->
        <div class="form-group" :class="{ error: errors.subscriber_id }">
          <label>المشترك <span class="required">*</span></label>

          <!-- عرض المشترك المحدد -->
          <div v-if="selectedSubscriber" class="selected-sub" @click="selectedSubscriber = null">
            <div class="sel-avatar">{{ selectedSubscriber.name.charAt(0) }}</div>
            <div class="sel-info">
              <span class="sel-name">{{ selectedSubscriber.name }}</span>
              <span class="sel-meter">{{ selectedSubscriber.meter_number }}</span>
            </div>
            <span class="sel-change">تغيير</span>
          </div>

          <!-- بحث عن مشترك -->
          <div v-else class="sub-search">
            <input
              v-model="subSearch"
              type="search"
              placeholder="ابحث باسم المشترك أو رقم عداده..."
              class="form-input"
              @input="searchSubscribers"
            />
            <div v-if="subSearch && searchResults.length > 0" class="search-results">
              <div
                v-for="sub in searchResults"
                :key="sub.id"
                class="search-result-item"
                @click="selectSubscriber(sub)"
              >
                <div>
                  <div class="res-name">{{ sub.name }}</div>
                  <div class="res-meter">{{ sub.meter_number }}</div>
                </div>
                <span class="res-zone">{{ sub.zone_name }}</span>
              </div>
            </div>
          </div>

          <p v-if="errors.subscriber_id" class="error-msg">{{ errors.subscriber_id }}</p>
        </div>

        <!-- معلومات العداد -->
        <div v-if="selectedSubscriber" class="meter-info-card">
          <div class="meter-row">
            <span class="meter-label">القراءة السابقة</span>
            <span class="meter-value accent">{{ previousReading }} كيلوواط</span>
          </div>
          <div v-if="selectedSubscriber.meter" class="meter-row">
            <span class="meter-label">رقم العداد</span>
            <span class="meter-value">{{ selectedSubscriber.meter.serial_number }}</span>
          </div>
        </div>

        <!-- القراءة الجديدة -->
        <div class="form-group" :class="{ error: errors.current_reading }">
          <label>القراءة الجديدة <span class="required">*</span></label>
          <div class="reading-input-wrapper">
            <input
              v-model.number="form.current_reading"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              class="form-input reading-input"
              inputmode="numeric"
              dir="ltr"
              @input="calculateConsumption"
            />
            <span class="reading-unit">كيلوواط</span>
          </div>
          <p v-if="errors.current_reading" class="error-msg">{{ errors.current_reading }}</p>
        </div>

        <!-- عرض الاستهلاك المحتسب -->
        <div v-if="consumption !== null" class="consumption-preview" :class="consumption < 0 ? 'error-state' : 'success-state'">
          <div class="cons-row">
            <span>الاستهلاك المحتسب</span>
            <strong>{{ consumption }} كيلوواط</strong>
          </div>
          <div class="cons-row">
            <span>المبلغ التقديري</span>
            <strong>{{ formatMoney(consumption * settings.unitPrice) }}</strong>
          </div>
          <p v-if="consumption < 0" class="cons-error">
            ⚠️ القراءة الجديدة أقل من القراءة السابقة!
          </p>
        </div>

        <!-- تاريخ القراءة -->
        <div class="form-group">
          <label>تاريخ القراءة</label>
          <input v-model="form.reading_date" type="date" class="form-input" dir="ltr" />
        </div>

        <!-- الفترة -->
        <div class="form-group">
          <label>الفترة (الشهر)</label>
          <input v-model="form.period_month" type="month" class="form-input" dir="ltr" />
        </div>

        <!-- ملاحظات -->
        <div class="form-group">
          <label>ملاحظات</label>
          <textarea v-model="form.notes" class="form-textarea" rows="2" placeholder="ملاحظات اختيارية..."></textarea>
        </div>
      </div>

      <!-- خيار إصدار الفاتورة -->
      <div v-if="!isEdit" class="issue-invoice-section">
        <label class="checkbox-label">
          <div class="custom-checkbox" :class="{ checked: autoIssueInvoice }" @click="autoIssueInvoice = !autoIssueInvoice">
            <svg v-if="autoIssueInvoice" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div>
            <span class="checkbox-text">إصدار فاتورة تلقائياً</span>
            <span class="checkbox-hint">سيتم إنشاء فاتورة بعد حفظ القراءة مباشرة</span>
          </div>
        </label>
      </div>

      <!-- أزرار الحفظ -->
      <div class="form-actions">
        <button type="button" class="btn-cancel" @click="router.back()">إلغاء</button>
        <button type="submit" class="btn-save" :disabled="isSaving || consumption < 0">
          <span v-if="isSaving" class="spinner-sm"></span>
          <span v-else>⚡</span>
          {{ isEdit ? 'تعديل القراءة' : 'حفظ القراءة' }}
        </button>
      </div>

    </form>

    <!-- Modal الفاتورة الناتجة -->
    <div v-if="createdInvoiceId" class="invoice-created-overlay">
      <div class="invoice-created-card">
        <div class="created-icon">✅</div>
        <h3>تم إنشاء الفاتورة</h3>
        <p>تم حفظ القراءة وإنشاء الفاتورة بنجاح</p>
        <div class="created-actions">
          <button class="btn-cancel" @click="createdInvoiceId = null; router.back()">رجوع</button>
          <button class="btn-save" @click="viewInvoice">عرض الفاتورة</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute }   from 'vue-router'
import { useAuthStore }          from '@/stores/auth.js'
import { useSubscribersStore }   from '@/stores/subscribers.js'
import { useReadingsStore }      from '@/stores/readings.js'
import { useInvoicesStore }      from '@/stores/invoices.js'
import { useSettingsStore }      from '@/stores/settings.js'
import { useToast }              from '@/composables/useToast.js'

const router   = useRouter()
const route    = useRoute()
const auth     = useAuthStore()
const subStore = useSubscribersStore()
const readings = useReadingsStore()
const invoices = useInvoicesStore()
const settings = useSettingsStore()
const toast    = useToast()

const isEdit             = computed(() => !!route.params.id)
const isSaving           = ref(false)
const autoIssueInvoice   = ref(true)
const createdInvoiceId   = ref(null)
const selectedSubscriber = ref(null)
const previousReading    = ref(0)
const consumption        = ref(null)
const subSearch          = ref('')
const searchResults      = ref([])

const form = ref({
  subscriber_id:   null,
  current_reading: '',
  previous_reading: 0,
  reading_date:    new Date().toISOString().slice(0, 10),
  period_month:    new Date().toISOString().slice(0, 7),
  notes:           '',
})

const errors = ref({ subscriber_id: '', current_reading: '' })

onMounted(async () => {
  settings.loadSettings()
  await subStore.loadAll()

  // إذا جاء من صفحة المشترك
  const subId = route.query.subscriber
  if (subId) {
    const sub = await subStore.getById(subId)
    if (sub) await selectSubscriber(sub)
  }

  // تعديل قراءة موجودة
  if (isEdit.value) {
    const { db } = await import('@/database/db.js')
    const reading = await db.readings.get(Number(route.params.id))
    if (reading) {
      form.value = {
        subscriber_id:    reading.subscriber_id,
        current_reading:  reading.current_reading,
        previous_reading: reading.previous_reading,
        reading_date:     reading.reading_date,
        period_month:     reading.period_month,
        notes:            reading.notes ?? '',
      }
      previousReading.value = reading.previous_reading
      consumption.value     = reading.consumption
      const sub = await subStore.getById(reading.subscriber_id)
      if (sub) selectedSubscriber.value = sub
    }
  }
})

async function selectSubscriber(sub) {
  selectedSubscriber.value  = sub
  form.value.subscriber_id  = sub.id
  subSearch.value           = ''
  searchResults.value       = []

  // جلب آخر قراءة
  const lastR = await readings.getLastReading(sub.id)
  previousReading.value      = lastR?.current_reading ?? 0
  form.value.previous_reading = previousReading.value

  calculateConsumption()
}

function searchSubscribers() {
  if (!subSearch.value.trim()) {
    searchResults.value = []
    return
  }
  const q = subSearch.value.toLowerCase()
  searchResults.value = subStore.items
    .filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.meter_number?.toLowerCase().includes(q) ||
      s.phone?.includes(q)
    )
    .slice(0, 8)
}

function calculateConsumption() {
  const curr = parseFloat(form.value.current_reading)
  const prev = parseFloat(previousReading.value)
  if (!isNaN(curr) && !isNaN(prev)) {
    consumption.value = curr - prev
  } else {
    consumption.value = null
  }
}

function validate() {
  errors.value = { subscriber_id: '', current_reading: '' }
  let valid = true

  if (!form.value.subscriber_id) {
    errors.value.subscriber_id = 'يجب اختيار مشترك'
    valid = false
  }
  if (form.value.current_reading === '' || form.value.current_reading === null) {
    errors.value.current_reading = 'القراءة الجديدة مطلوبة'
    valid = false
  }
  if (consumption.value !== null && consumption.value < 0) {
    errors.value.current_reading = 'القراءة الجديدة أقل من القراءة السابقة'
    valid = false
  }
  return valid
}

function formatMoney(v) {
  return Number(v || 0).toLocaleString('ar-SA') + ' ' + settings.currency
}

async function handleSubmit() {
  if (!validate()) return

  isSaving.value = true
  try {
    if (isEdit.value) {
      await readings.update(route.params.id, {
        ...form.value,
        previous_reading: previousReading.value,
      }, auth.currentUser.id)
      toast.success('تم تعديل القراءة')
      router.back()
    } else {
      const readingId = await readings.create({
        ...form.value,
        previous_reading: previousReading.value,
      }, auth.currentUser.id)

      if (autoIssueInvoice.value) {
        const invoiceId = await invoices.createFromReading(readingId, auth.currentUser.id)
        createdInvoiceId.value = invoiceId
        toast.success('تم حفظ القراءة وإنشاء الفاتورة')
      } else {
        toast.success('تم حفظ القراءة')
        router.back()
      }
    }
  } catch (e) {
    toast.error(e.message || 'حدث خطأ')
  } finally {
    isSaving.value = false
  }
}

function viewInvoice() {
  router.replace(`/invoices/${createdInvoiceId.value}`)
}
</script>

<style scoped>
.reading-form-view {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

/* ─── رأس الصفحة ─────────────────────────────── */
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

.form-header h1 { font-size: 1.05rem; font-weight: 800; color: var(--text-primary); }

.back-btn {
  width: 38px; height: 38px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

/* ─── جسم النموذج ────────────────────────────── */
.form-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-bottom: 20px;
}

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

/* ─── الحقول ─────────────────────────────────── */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.error .form-input { border-color: #EF4444; }

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.required { color: #EF4444; }

.form-input, .form-textarea {
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
.form-input:focus { border-color: var(--primary, #3B82F6); }
.form-textarea { resize: vertical; min-height: 60px; }

.error-msg { font-size: 0.78rem; color: #EF4444; }

/* ─── المشترك المختار ────────────────────────── */
.selected-sub {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(59,130,246,0.08);
  border: 1.5px solid rgba(59,130,246,0.3);
  border-radius: 12px;
  cursor: pointer;
}

.sel-avatar {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1D4ED8, #7C3AED);
  color: white;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.sel-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.sel-name { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
.sel-meter { font-size: 0.75rem; color: var(--text-muted); font-family: monospace; }

.sel-change {
  font-size: 0.75rem;
  color: #60A5FA;
  flex-shrink: 0;
}

/* ─── نتائج البحث ────────────────────────────── */
.sub-search { position: relative; }

.search-results {
  position: absolute;
  top: 100%;
  right: 0; left: 0;
  z-index: 50;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  max-height: 220px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  transition: background 0.15s;
}
.search-result-item:hover { background: rgba(255,255,255,0.05); }
.search-result-item:last-child { border-bottom: none; }

.res-name { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
.res-meter { font-size: 0.72rem; color: var(--text-muted); font-family: monospace; }
.res-zone { font-size: 0.72rem; color: var(--text-muted); }

/* ─── بطاقة معلومات العداد ───────────────────── */
.meter-info-card {
  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.2);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meter-label { font-size: 0.8rem; color: var(--text-muted); }
.meter-value { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
.meter-value.accent { color: #FBBF24; }

/* ─── حقل القراءة ────────────────────────────── */
.reading-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.reading-input {
  font-size: 1.2rem !important;
  font-weight: 700;
  padding-left: 60px !important;
  text-align: center;
}

.reading-unit {
  position: absolute;
  left: 14px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* ─── بطاقة الاستهلاك ────────────────────────── */
.consumption-preview {
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.consumption-preview.success-state {
  background: rgba(16,185,129,0.08);
  border: 1px solid rgba(16,185,129,0.2);
}

.consumption-preview.error-state {
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
}

.cons-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
}
.cons-row span { color: var(--text-secondary); }
.cons-row strong { color: var(--text-primary); font-weight: 700; }

.cons-error { font-size: 0.8rem; color: #FCA5A5; margin-top: 4px; }

/* ─── خيار الفاتورة ──────────────────────────── */
.issue-invoice-section {
  margin: 0 8px;
  background: rgba(59,130,246,0.06);
  border: 1px solid rgba(59,130,246,0.2);
  border-radius: 14px;
  padding: 14px;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
}

.custom-checkbox {
  width: 20px; height: 20px;
  border-radius: 6px;
  border: 2px solid #475569;
  background: transparent;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-top: 2px;
}
.custom-checkbox.checked { background: #3B82F6; border-color: #3B82F6; }

.checkbox-text { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
.checkbox-hint { display: block; font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }

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
}

.btn-save {
  flex: 2;
  padding: 13px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #059669, #047857);
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
.btn-save:hover:not(:disabled) { transform: translateY(-2px); }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner-sm {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Modal الفاتورة المنشأة ─────────────────── */
.invoice-created-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 900;
  padding: 20px;
}

.invoice-created-card {
  background: var(--bg-secondary);
  border-radius: 24px;
  padding: 32px 24px;
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  border: 1px solid rgba(16,185,129,0.3);
  box-shadow: 0 0 40px rgba(16,185,129,0.2);
}

.created-icon { font-size: 3rem; }
.invoice-created-card h3 { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
.invoice-created-card p  { font-size: 0.85rem; color: var(--text-secondary); }

.created-actions {
  display: flex;
  gap: 8px;
  width: 100%;
  margin-top: 8px;
}
</style>