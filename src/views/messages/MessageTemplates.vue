<template>
  <div class="messages-view" dir="rtl">

    <div class="page-header">
      <div class="header-top">
        <h1>💬 رسائل SMS</h1>
        <button class="btn-secondary" @click="router.push('/messages/templates')">
          📝 القوالب
        </button>
      </div>
    </div>

    <!-- التبويبات -->
    <div class="tabs-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >{{ tab.label }}</button>
    </div>

    <!-- رسالة فردية -->
    <div v-if="activeTab === 'single'" class="tab-content">

      <!-- اختيار المشترك -->
      <div class="form-section">
        <h2 class="section-title">👤 اختيار المشترك</h2>

        <div v-if="selectedSub" class="selected-sub-bar">
          <div class="ssb-avatar">{{ selectedSub.name.charAt(0) }}</div>
          <div class="ssb-info">
            <strong>{{ selectedSub.name }}</strong>
            <span>{{ selectedSub.phone }}</span>
          </div>
          <button class="ssb-change" @click="selectedSub = null">تغيير</button>
        </div>

        <div v-else class="sub-search-wrap">
          <input
            v-model="subSearch"
            type="search"
            placeholder="ابحث عن مشترك..."
            class="form-input"
            @input="searchSubs"
          />
          <div v-if="subSearch && searchResults.length > 0" class="search-dropdown">
            <div
              v-for="sub in searchResults"
              :key="sub.id"
              class="search-item"
              @click="selectSub(sub)"
            >
              <strong>{{ sub.name }}</strong>
              <span>{{ sub.phone || 'لا يوجد هاتف' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- إعداد الرسالة -->
      <div class="form-section">
        <div class="section-header-row">
          <h2 class="section-title">📝 نص الرسالة</h2>
          <button class="btn-use-template" @click="showTemplates = true">استخدام قالب</button>
        </div>

        <!-- أزرار الحقول -->
        <div class="field-chips">
          <span class="chips-label">أضف حقل:</span>
          <button
            v-for="field in availableFields"
            :key="field.key"
            class="field-chip"
            @click="insertField(field.key)"
          >{{ field.label }}</button>
        </div>

        <textarea
          ref="msgTextarea"
          v-model="messageText"
          class="message-textarea"
          rows="5"
          placeholder="اكتب نص الرسالة هنا..."
          maxlength="640"
        ></textarea>

        <div class="msg-footer-row">
          <span class="char-count">{{ messageText.length }} / 640 حرف</span>
          <span class="sms-count">{{ Math.ceil(messageText.length / 160) }} رسالة</span>
        </div>
      </div>

      <!-- معاينة الرسالة -->
      <div v-if="previewText" class="preview-section">
        <h3>👁️ المعاينة</h3>
        <div class="message-bubble">{{ previewText }}</div>
      </div>

      <!-- إرسال -->
      <div class="send-section">
        <button
          class="btn-send"
          :disabled="!selectedSub || !selectedSub.phone || !messageText.trim()"
          @click="sendSingle"
        >
          <span>📱</span>
          إرسال الرسالة
        </button>
        <p v-if="selectedSub && !selectedSub.phone" class="no-phone-warn">
          ⚠️ المشترك لا يملك رقم هاتف
        </p>
      </div>
    </div>

    <!-- رسائل جماعية -->
    <div v-if="activeTab === 'bulk'" class="tab-content">

      <div class="form-section">
        <h2 class="section-title">🎯 تحديد المستلمين</h2>
        <div class="recipient-options">
          <label class="option-card" :class="{ selected: bulkTarget === 'all' }">
            <input type="radio" v-model="bulkTarget" value="all" hidden />
            <span class="opt-icon">👥</span>
            <span class="opt-label">جميع المشتركين</span>
            <span class="opt-count">{{ subscribers.length }}</span>
          </label>
          <label class="option-card" :class="{ selected: bulkTarget === 'unpaid' }">
            <input type="radio" v-model="bulkTarget" value="unpaid" hidden />
            <span class="opt-icon">⏰</span>
            <span class="opt-label">أصحاب المتأخرات</span>
            <span class="opt-count">{{ unpaidCount }}</span>
          </label>
          <label class="option-card" :class="{ selected: bulkTarget === 'zone' }">
            <input type="radio" v-model="bulkTarget" value="zone" hidden />
            <span class="opt-icon">📍</span>
            <span class="opt-label">منطقة محددة</span>
          </label>
        </div>

        <select v-if="bulkTarget === 'zone'" v-model="bulkZone" class="form-select">
          <option value="">اختر المنطقة</option>
          <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
        </select>
      </div>

      <div class="form-section">
        <h2 class="section-title">📝 نص الرسالة الجماعية</h2>
        <div class="field-chips">
          <span class="chips-label">أضف حقل:</span>
          <button
            v-for="field in availableFields"
            :key="field.key"
            class="field-chip"
            @click="insertBulkField(field.key)"
          >{{ field.label }}</button>
        </div>
        <textarea
          ref="bulkTextarea"
          v-model="bulkMessageText"
          class="message-textarea"
          rows="5"
          placeholder="نص الرسالة الجماعية..."
          maxlength="640"
        ></textarea>
        <div class="msg-footer-row">
          <span class="char-count">{{ bulkMessageText.length }} / 640 حرف</span>
        </div>
      </div>

      <div class="bulk-summary" v-if="bulkRecipients.length > 0">
        <span>📤 سيتم الإرسال إلى {{ bulkRecipients.length }} مشترك</span>
      </div>

      <div class="send-section">
        <button
          class="btn-send"
          :disabled="!bulkMessageText.trim() || bulkRecipients.length === 0"
          @click="sendBulk"
        >
          <span>📡</span>
          إرسال للجميع ({{ bulkRecipients.length }})
        </button>
      </div>
    </div>

    <!-- سجل الرسائل -->
    <div v-if="activeTab === 'log'" class="tab-content">
      <div class="log-list">
        <div v-if="messageLogs.length === 0" class="center-state">
          <span>📭</span>
          <p>لا توجد رسائل مرسلة</p>
        </div>
        <div v-for="log in messageLogs" :key="log.id" class="log-item">
          <div class="log-phone">📱 {{ log.phone }}</div>
          <div class="log-msg">{{ log.message.slice(0, 80) }}{{ log.message.length > 80 ? '...' : '' }}</div>
          <div class="log-date">{{ formatDate(log.sent_at || log.created_at) }}</div>
        </div>
      </div>
    </div>

    <!-- قوالب الرسائل -->
    <MessageTemplatesSheet
      v-if="showTemplates"
      @close="showTemplates = false"
      @select="onTemplateSelected"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute }      from 'vue-router'
import { useSubscribersStore }      from '@/stores/subscribers.js'
import { useSettingsStore }         from '@/stores/settings.js'
import { db }                       from '@/database/db.js'
import MessageTemplatesSheet        from '@/components/messages/MessageTemplatesSheet.vue'

const router   = useRouter()
const route    = useRoute()
const subStore = useSubscribersStore()
const settings = useSettingsStore()

const activeTab       = ref('single')
const selectedSub     = ref(null)
const subSearch       = ref('')
const searchResults   = ref([])
const messageText     = ref('')
const bulkMessageText = ref('')
const bulkTarget      = ref('all')
const bulkZone        = ref('')
const showTemplates   = ref(false)
const msgTextarea     = ref(null)
const bulkTextarea    = ref(null)
const messageLogs     = ref([])

const tabs = [
  { key: 'single', label: 'رسالة فردية' },
  { key: 'bulk',   label: 'رسائل جماعية' },
  { key: 'log',    label: 'السجل' },
]

const availableFields = [
  { key: '{الاسم}',          label: 'الاسم' },
  { key: '{العداد}',         label: 'رقم العداد' },
  { key: '{الاستهلاك}',     label: 'الاستهلاك' },
  { key: '{المبلغ}',         label: 'المبلغ' },
  { key: '{المتأخرات}',     label: 'المتأخرات' },
  { key: '{الإجمالي}',      label: 'الإجمالي' },
  { key: '{اسم_الشركة}',    label: 'اسم الشركة' },
  { key: '{رقم_التواصل}',   label: 'رقم التواصل' },
]

const subscribers = computed(() => subStore.items)
const zones       = computed(() => subStore.zones)

const unpaidCount = computed(async () => {
  const unpaid = await db.invoices.where('status').anyOf(['unpaid','partial']).toArray()
  const subIds  = [...new Set(unpaid.map(i => i.subscriber_id))]
  return subIds.length
})

const bulkRecipients = computed(() => {
  let list = subStore.items.filter(s => s.phone && s.status === 'active')
  if (bulkTarget.value === 'zone' && bulkZone.value)
    list = list.filter(s => String(s.zone_id) === String(bulkZone.value))
  return list
})

const previewText = computed(() => {
  if (!selectedSub.value || !messageText.value) return ''
  return renderMessage(messageText.value, selectedSub.value)
})

onMounted(async () => {
  await subStore.loadAll()
  settings.loadSettings()
  messageLogs.value = await db.message_logs.orderBy('created_at').reverse().limit(50).toArray()

  // إذا جاء من صفحة المشترك
  const subId = route.query.subscriber
  if (subId) {
    const sub = await subStore.getById(subId)
    if (sub) selectedSub.value = sub
    activeTab.value = 'single'
  }
})

function searchSubs() {
  if (!subSearch.value.trim()) { searchResults.value = []; return }
  const q = subSearch.value.toLowerCase()
  searchResults.value = subStore.items.filter(s =>
    s.name?.toLowerCase().includes(q) || s.phone?.includes(q)
  ).slice(0, 6)
}

function selectSub(sub) {
  selectedSub.value   = sub
  subSearch.value     = ''
  searchResults.value = []
}

function insertField(field) {
  const el  = msgTextarea.value
  const pos = el?.selectionStart ?? messageText.value.length
  messageText.value = messageText.value.slice(0, pos) + field + messageText.value.slice(pos)
}

function insertBulkField(field) {
  const el  = bulkTextarea.value
  const pos = el?.selectionStart ?? bulkMessageText.value.length
  bulkMessageText.value = bulkMessageText.value.slice(0, pos) + field + bulkMessageText.value.slice(pos)
}

function renderMessage(template, sub) {
  return template
    .replace('{الاسم}',        sub.name ?? '')
    .replace('{العداد}',       sub.meter_number ?? '')
    .replace('{اسم_الشركة}',  settings.stationName)
    .replace('{رقم_التواصل}', settings.stationPhone ?? '')
}

async function sendSingle() {
  if (!selectedSub.value?.phone) return
  const text = renderMessage(messageText.value, selectedSub.value)
  const href = `sms:${selectedSub.value.phone}?body=${encodeURIComponent(text)}`
  window.location.href = href

  await db.message_logs.add({
    subscriber_id: selectedSub.value.id,
    phone:         selectedSub.value.phone,
    message:       text,
    status:       'sent',
    sent_at:      new Date().toISOString().slice(0,10),
    created_at:   new Date().toISOString(),
  })

  messageLogs.value = await db.message_logs.orderBy('created_at').reverse().limit(50).toArray()
}

async function sendBulk() {
  const recipients = bulkRecipients.value
  if (recipients.length === 0) return

  for (let i = 0; i < recipients.length; i++) {
    const sub  = recipients[i]
    const text = renderMessage(bulkMessageText.value, sub)

    await db.message_logs.add({
      subscriber_id: sub.id,
      phone:         sub.phone,
      message:       text,
      status:       'pending',
      sent_at:      null,
      created_at:   new Date().toISOString(),
    })

    // فتح SMS لكل مشترك
    if (i === 0) {
      window.location.href = `sms:${sub.phone}?body=${encodeURIComponent(text)}`
    }
  }
}

function onTemplateSelected(template) {
  messageText.value  = template.content
  showTemplates.value = false
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('ar-SA', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : ''
}
</script>

<style scoped>
.messages-view { display: flex; flex-direction: column; min-height: 100%; }

.page-header {
  background: var(--bg-secondary); padding: 14px;
  border-bottom: 1px solid var(--border-color);
  position: sticky; top: 0; z-index: 10;
}
.header-top { display: flex; align-items: center; justify-content: space-between; }
.header-top h1 { font-size: 1.2rem; font-weight: 800; color: var(--text-primary); }

.btn-secondary {
  padding: 9px 14px; background: rgba(255,255,255,0.05);
  border: 1px solid var(--border-color); border-radius: 10px;
  color: var(--text-secondary); font-family: 'Cairo', sans-serif;
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
}

.tabs-bar {
  display: flex; background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}
.tab-btn {
  flex: 1; padding: 12px; border: none; background: transparent;
  color: var(--text-muted); font-family: 'Cairo', sans-serif;
  font-size: 0.85rem; font-weight: 600; cursor: pointer;
  border-bottom: 2px solid transparent; transition: all 0.2s;
}
.tab-btn.active { color: var(--primary,#3B82F6); border-bottom-color: var(--primary,#3B82F6); }

.tab-content { display: flex; flex-direction: column; gap: 0; padding-bottom: 20px; }

.form-section {
  background: var(--bg-secondary); margin: 8px;
  border-radius: 14px; padding: 14px;
  border: 1px solid var(--border-color);
  display: flex; flex-direction: column; gap: 12px;
}

.section-title { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
.section-header-row { display: flex; align-items: center; justify-content: space-between; }

.btn-use-template {
  font-size: 0.78rem; color: #60A5FA; background: rgba(59,130,246,0.08);
  border: 1px solid rgba(59,130,246,0.2); border-radius: 8px;
  padding: 5px 10px; cursor: pointer; font-family: 'Cairo', sans-serif;
}

/* المشترك المختار */
.selected-sub-bar {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  background: rgba(59,130,246,0.06); border: 1.5px solid rgba(59,130,246,0.2);
  border-radius: 11px;
}
.ssb-avatar {
  width: 34px; height: 34px; border-radius: 9px;
  background: linear-gradient(135deg,#1D4ED8,#7C3AED);
  color: white; display: flex; align-items: center; justify-content: center;
  font-weight: 700; flex-shrink: 0;
}
.ssb-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.ssb-info strong { font-size: 0.875rem; color: var(--text-primary); }
.ssb-info span   { font-size: 0.72rem; color: var(--text-muted); }
.ssb-change { font-size: 0.78rem; color: #60A5FA; background: none; border: none; cursor: pointer; font-family: 'Cairo', sans-serif; }

/* بحث */
.sub-search-wrap { position: relative; }
.form-input {
  width: 100%; padding: 11px 14px; background: var(--bg-input);
  border: 1.5px solid var(--border-input); border-radius: 11px;
  color: var(--text-primary); font-family: 'Cairo', sans-serif;
  font-size: 0.9rem; outline: none; -webkit-appearance: none;
  transition: border-color 0.2s;
}
.form-input:focus { border-color: var(--primary,#3B82F6); }

.search-dropdown {
  position: absolute; top: 100%; right: 0; left: 0; z-index: 50;
  background: var(--bg-secondary); border: 1px solid var(--border-color);
  border-radius: 11px; overflow: hidden; box-shadow: var(--shadow-lg);
  max-height: 200px; overflow-y: auto;
}
.search-item {
  padding: 10px 14px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.04);
  display: flex; flex-direction: column; gap: 2px; transition: background 0.15s;
}
.search-item:hover { background: rgba(255,255,255,0.04); }
.search-item strong { font-size: 0.875rem; color: var(--text-primary); }
.search-item span   { font-size: 0.72rem; color: var(--text-muted); }

/* حقول الرسالة */
.field-chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.chips-label { font-size: 0.75rem; color: var(--text-muted); }
.field-chip {
  padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(59,130,246,0.3);
  background: rgba(59,130,246,0.08); color: #60A5FA; font-family: 'Cairo', sans-serif;
  font-size: 0.75rem; cursor: pointer; transition: all 0.15s;
}
.field-chip:hover { background: rgba(59,130,246,0.15); }

.message-textarea {
  width: 100%; padding: 12px 14px; background: var(--bg-input);
  border: 1.5px solid var(--border-input); border-radius: 11px;
  color: var(--text-primary); font-family: 'Cairo', sans-serif;
  font-size: 0.9rem; outline: none; resize: vertical; min-height: 100px;
  transition: border-color 0.2s;
}
.message-textarea:focus { border-color: var(--primary,#3B82F6); }

.msg-footer-row { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); }

/* معاينة */
.preview-section { margin: 0 8px; padding: 14px; background: var(--bg-secondary); border-radius: 14px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px; }
.preview-section h3 { font-size: 0.875rem; font-weight: 700; color: var(--text-primary); }
.message-bubble {
  padding: 12px 14px; background: rgba(59,130,246,0.08);
  border: 1px solid rgba(59,130,246,0.2); border-radius: 12px 12px 12px 0;
  font-size: 0.875rem; color: var(--text-primary); line-height: 1.6; white-space: pre-wrap;
}

/* خيارات جماعي */
.recipient-options { display: flex; flex-direction: column; gap: 8px; }
.option-card {
  display: flex; align-items: center; gap: 10px; padding: 12px 14px;
  border-radius: 11px; border: 1.5px solid var(--border-color);
  cursor: pointer; transition: all 0.2s;
}
.option-card.selected { border-color: var(--primary,#3B82F6); background: rgba(59,130,246,0.06); }
.opt-icon { font-size: 1.3rem; }
.opt-label { flex: 1; font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
.opt-count {
  font-size: 0.8rem; font-weight: 700; color: var(--primary,#3B82F6);
  background: rgba(59,130,246,0.1); padding: 2px 8px; border-radius: 99px;
}

.form-select {
  width: 100%; padding: 11px 14px; background: var(--bg-input);
  border: 1.5px solid var(--border-input); border-radius: 11px;
  color: var(--text-primary); font-family: 'Cairo', sans-serif;
  font-size: 0.9rem; outline: none; -webkit-appearance: none;
}

.bulk-summary {
  margin: 0 8px; padding: 10px 14px;
  background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.2);
  border-radius: 10px; font-size: 0.875rem; color: #34D399;
}

/* إرسال */
.send-section { padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.btn-send {
  width: 100%; padding: 14px; border: none; border-radius: 13px;
  background: linear-gradient(135deg,#059669,#047857); color: white;
  font-family: 'Cairo', sans-serif; font-size: 1rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all 0.2s; box-shadow: 0 4px 16px rgba(5,150,105,0.3);
}
.btn-send:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-send:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(5,150,105,0.4); }

.no-phone-warn { font-size: 0.8rem; color: #FBBF24; text-align: center; }

/* سجل الرسائل */
.log-list { padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.center-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px; color: var(--text-muted); font-size: 0.875rem; }
.center-state span { font-size: 2rem; }

.log-item {
  background: var(--card-bg); border: 1px solid var(--border-color);
  border-radius: 12px; padding: 12px;
  display: flex; flex-direction: column; gap: 4px;
}
.log-phone { font-size: 0.8rem; font-weight: 600; color: #60A5FA; }
.log-msg   { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; }
.log-date  { font-size: 0.7rem; color: var(--text-muted); }
</style>