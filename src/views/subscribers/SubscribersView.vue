<template>
  <div class="subscribers-view" dir="rtl">

    <!-- رأس الصفحة -->
    <div class="page-header">
      <div class="header-top">
        <h1>المشتركون</h1>
        <button
          v-if="auth.hasPermission('subscribers.create')"
          class="btn-primary btn-add"
          @click="router.push('/subscribers/new')"
        >
          <span class="btn-icon">+</span>
          إضافة
        </button>
      </div>

      <!-- إحصائيات سريعة -->
      <div class="quick-stats">
        <div class="qs-item">
          <span class="qs-val">{{ store.items.length }}</span>
          <span class="qs-lbl">الإجمالي</span>
        </div>
        <div class="qs-divider"></div>
        <div class="qs-item active">
          <span class="qs-val">{{ store.activeCount }}</span>
          <span class="qs-lbl">نشط</span>
        </div>
        <div class="qs-divider"></div>
        <div class="qs-item inactive">
          <span class="qs-val">{{ store.disconnectedCount }}</span>
          <span class="qs-lbl">مفصول</span>
        </div>
      </div>

      <!-- شريط البحث -->
      <div class="search-bar">
        <div class="search-input-wrapper">
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
          </svg>
          <input
            v-model="store.searchQuery"
            type="search"
            placeholder="بحث بالاسم أو الهاتف أو رقم العداد..."
            class="search-input"
            @input="store.currentPage = 1"
          />
          <button
            v-if="store.searchQuery"
            class="clear-search"
            @click="store.searchQuery = ''; store.currentPage = 1"
          >✕</button>
        </div>
      </div>

      <!-- الفلاتر -->
      <div class="filters-row">
        <select v-model="store.filterZone" class="filter-select" @change="store.currentPage = 1">
          <option value="">كل المناطق</option>
          <option v-for="z in store.zones" :key="z.id" :value="z.id">{{ z.name }}</option>
        </select>

        <select v-model="store.filterStatus" class="filter-select" @change="store.currentPage = 1">
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="disconnected">مفصول</option>
        </select>

        <button
          v-if="store.searchQuery || store.filterZone || store.filterStatus"
          class="btn-clear-filter"
          @click="store.resetFilters()"
        >
          مسح الفلاتر
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="loading-state">
      <div class="spinner"></div>
      <span>جاري التحميل...</span>
    </div>

    <!-- حالة فارغة -->
    <div v-else-if="store.filtered.length === 0" class="empty-state">
      <div class="empty-icon">👥</div>
      <h3>لا يوجد مشتركون</h3>
      <p v-if="store.searchQuery || store.filterZone || store.filterStatus">
        حاول تغيير معايير البحث
      </p>
      <p v-else>ابدأ بإضافة أول مشترك</p>
      <button
        v-if="auth.hasPermission('subscribers.create') && !store.searchQuery"
        class="btn-primary"
        @click="router.push('/subscribers/new')"
      >
        إضافة مشترك
      </button>
    </div>

    <!-- قائمة المشتركين -->
    <div v-else class="subscribers-list">
      <TransitionGroup name="list">
        <div
          v-for="sub in store.paginated"
          :key="sub.id"
          class="subscriber-card"
          @click="goToDetail(sub.id)"
        >
          <!-- رأس البطاقة -->
          <div class="card-header">
            <div class="sub-avatar" :style="{ background: getAvatarColor(sub.name) }">
              {{ sub.name.charAt(0) }}
            </div>
            <div class="sub-info">
              <h3 class="sub-name">{{ sub.name }}</h3>
              <div class="sub-meta">
                <span class="meta-item">
                  <span>📱</span> {{ sub.phone || 'لا يوجد' }}
                </span>
                <span class="meta-divider">·</span>
                <span class="meta-item">
                  <span>⚡</span> {{ sub.meter_number }}
                </span>
              </div>
            </div>
            <div class="status-badge" :class="sub.status">
              {{ sub.status === 'active' ? 'نشط' : 'مفصول' }}
            </div>
          </div>

          <!-- تفاصيل سريعة -->
          <div class="card-details">
            <div class="detail-item">
              <span class="detail-label">المنطقة</span>
              <span class="detail-value">{{ sub.zone_name || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">الرصيد</span>
              <span class="detail-value" :class="sub.balance < 0 ? 'text-danger' : 'text-success'">
                {{ formatMoney(sub.balance) }}
              </span>
            </div>
          </div>

          <!-- الأزرار السريعة -->
          <div class="quick-actions" @click.stop>
            <button
              v-if="auth.hasPermission('subscribers.payment')"
              class="qa-btn success"
              title="سداد"
              @click.stop="openPayment(sub)"
            >💰 سداد</button>

            <button
              v-if="auth.hasPermission('subscribers.disconnect') && sub.status === 'active'"
              class="qa-btn danger"
              title="فصل"
              @click.stop="toggleStatus(sub)"
            >🔌 فصل</button>

            <button
              v-if="auth.hasPermission('subscribers.reconnect') && sub.status === 'disconnected'"
              class="qa-btn warning"
              title="تشغيل"
              @click.stop="toggleStatus(sub)"
            >✅ تشغيل</button>

            <button
              v-if="sub.phone"
              class="qa-btn info"
              title="اتصال"
              @click.stop="callSubscriber(sub)"
            >📞</button>

            <button
              v-if="sub.phone && auth.hasPermission('subscribers.sms')"
              class="qa-btn info"
              title="رسالة"
              @click.stop="openSMS(sub)"
            >💬</button>

            <button
              class="qa-btn more"
              title="المزيد"
              @click.stop="openMore(sub)"
            >⋮</button>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Pagination -->
    <div v-if="store.totalPages > 1" class="pagination">
      <button
        class="page-btn"
        :disabled="store.currentPage === 1"
        @click="store.currentPage--"
      >→</button>

      <span class="page-info">
        {{ store.currentPage }} / {{ store.totalPages }}
      </span>

      <button
        class="page-btn"
        :disabled="store.currentPage === store.totalPages"
        @click="store.currentPage++"
      >←</button>
    </div>

    <!-- Modal السداد السريع -->
    <QuickPaymentModal
      v-if="showPaymentModal"
      :subscriber="selectedSub"
      @close="showPaymentModal = false"
      @paid="onPaid"
    />

    <!-- Modal المزيد من الخيارات -->
    <SubscriberActionsModal
      v-if="showMoreModal"
      :subscriber="selectedSub"
      @close="showMoreModal = false"
      @action="handleAction"
    />

    <!-- تأكيد الحذف -->
    <AppConfirm
      v-if="showDeleteConfirm"
      title="حذف المشترك"
      :message="`هل أنت متأكد من حذف المشترك ${selectedSub?.name}؟ لا يمكن التراجع.`"
      confirm-label="حذف"
      type="danger"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />

  </div>
</template>

<script setup>
import { ref, onMounted }     from 'vue'
import { useRouter }          from 'vue-router'
import { useAuthStore }       from '@/stores/auth.js'
import { useSubscribersStore } from '@/stores/subscribers.js'
import { useSettingsStore }   from '@/stores/settings.js'
import { useToast }           from '@/composables/useToast.js'
import QuickPaymentModal      from '@/components/subscribers/QuickPaymentModal.vue'
import SubscriberActionsModal from '@/components/subscribers/SubscriberActionsModal.vue'
import AppConfirm             from '@/components/common/AppConfirm.vue'

const router   = useRouter()
const auth     = useAuthStore()
const store    = useSubscribersStore()
const settings = useSettingsStore()
const toast    = useToast()

const showPaymentModal  = ref(false)
const showMoreModal     = ref(false)
const showDeleteConfirm = ref(false)
const selectedSub       = ref(null)

onMounted(async () => {
  await store.loadAll()
  settings.loadSettings()
})

function goToDetail(id) { router.push(`/subscribers/${id}`) }

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString('ar-SA') + ' ' + settings.currency
}

function getAvatarColor(name) {
  const colors = [
    'linear-gradient(135deg,#1D4ED8,#7C3AED)',
    'linear-gradient(135deg,#059669,#0891B2)',
    'linear-gradient(135deg,#D97706,#DC2626)',
    'linear-gradient(135deg,#7C3AED,#DB2777)',
    'linear-gradient(135deg,#0891B2,#059669)',
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

function callSubscriber(sub) {
  if (sub.phone) window.location.href = `tel:${sub.phone}`
}

function openSMS(sub) {
  router.push(`/messages?subscriber=${sub.id}`)
}

function openPayment(sub) {
  selectedSub.value     = sub
  showPaymentModal.value = true
}

function openMore(sub) {
  selectedSub.value   = sub
  showMoreModal.value = true
}

async function toggleStatus(sub) {
  const newStatus = sub.status === 'active' ? 'disconnected' : 'active'
  const label     = newStatus === 'active' ? 'تم تشغيل' : 'تم فصل'
  await store.setStatus(sub.id, newStatus)
  toast.success(`${label} المشترك: ${sub.name}`)
}

function onPaid() {
  showPaymentModal.value = false
  toast.success('تم تسجيل السداد بنجاح')
  store.loadAll()
}

async function handleAction(action) {
  showMoreModal.value = false
  if (action === 'edit')    router.push(`/subscribers/${selectedSub.value.id}/edit`)
  if (action === 'delete')  showDeleteConfirm.value = true
  if (action === 'statement') router.push(`/subscribers/${selectedSub.value.id}/statement`)
  if (action === 'reading') router.push(`/readings/new?subscriber=${selectedSub.value.id}`)
  if (action === 'print')   router.push(`/subscribers/${selectedSub.value.id}/statement?print=1`)
}

async function confirmDelete() {
  showDeleteConfirm.value = false
  try {
    await store.remove(selectedSub.value.id)
    toast.success('تم حذف المشترك')
  } catch (e) {
    toast.error(e.message)
  }
}
</script>

<style scoped>
.subscribers-view {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 100%;
}

/* ─── رأس الصفحة ─────────────────────────────── */
.page-header {
  background: var(--bg-secondary, #1E293B);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-top h1 {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-primary);
}

/* ─── إحصائيات سريعة ─────────────────────────── */
.quick-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,0.03);
  border-radius: 10px;
  padding: 10px 14px;
}

.qs-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
}

.qs-val {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.qs-lbl {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.qs-item.active  .qs-val { color: #34D399; }
.qs-item.inactive .qs-val { color: #F87171; }

.qs-divider {
  width: 1px;
  height: 30px;
  background: var(--border-color);
}

/* ─── البحث ──────────────────────────────────── */
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  right: 12px;
  width: 18px; height: 18px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 11px 40px 11px 36px;
  background: var(--bg-input, rgba(15,23,42,0.6));
  border: 1.5px solid var(--border-input);
  border-radius: 12px;
  color: var(--text-primary);
  font-family: 'Cairo', sans-serif;
  font-size: 0.9rem;
  outline: none;
  direction: rtl;
  transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--primary, #3B82F6); }

.clear-search {
  position: absolute;
  left: 12px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 4px;
}

/* ─── الفلاتر ────────────────────────────────── */
.filters-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-select {
  flex: 1;
  padding: 8px 10px;
  background: var(--bg-input);
  border: 1.5px solid var(--border-input);
  border-radius: 10px;
  color: var(--text-secondary);
  font-family: 'Cairo', sans-serif;
  font-size: 0.82rem;
  outline: none;
  -webkit-appearance: none;
}

.btn-clear-filter {
  padding: 8px 12px;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 10px;
  color: #FCA5A5;
  font-family: 'Cairo', sans-serif;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
}

/* ─── الأزرار ────────────────────────────────── */
.btn-primary {
  padding: 10px 18px;
  background: linear-gradient(135deg, #1D4ED8, #1E40AF);
  border: none;
  border-radius: 12px;
  color: white;
  font-family: 'Cairo', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(29,78,216,0.3);
}

.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(29,78,216,0.4); }
.btn-icon { font-size: 1.2rem; font-weight: 400; }

/* ─── الحالات ────────────────────────────────── */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text-muted);
  text-align: center;
}

.spinner {
  width: 32px; height: 32px;
  border: 3px solid rgba(59,130,246,0.2);
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-icon { font-size: 3rem; }
.empty-state h3 { font-size: 1rem; color: var(--text-secondary); }
.empty-state p  { font-size: 0.85rem; }

/* ─── قائمة المشتركين ────────────────────────── */
.subscribers-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 8px;
}

/* ─── بطاقة المشترك ──────────────────────────── */
.subscriber-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.subscriber-card:hover {
  border-color: rgba(59,130,246,0.3);
  transform: translateX(-2px);
}
.subscriber-card:active { transform: scale(0.99); }

/* رأس البطاقة */
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sub-avatar {
  width: 44px; height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.sub-info { flex: 1; min-width: 0; }

.sub-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.meta-item {
  font-size: 0.72rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 3px;
}

.meta-divider { color: var(--text-muted); font-size: 0.7rem; }

/* شارة الحالة */
.status-badge {
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 600;
  flex-shrink: 0;
}
.status-badge.active       { background: rgba(16,185,129,0.15); color: #34D399; }
.status-badge.disconnected { background: rgba(239,68,68,0.15);  color: #FCA5A5; }

/* تفاصيل سريعة */
.card-details {
  display: flex;
  gap: 16px;
  padding: 8px 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.detail-label {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.detail-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.text-success { color: #34D399 !important; }
.text-danger  { color: #F87171 !important; }

/* الأزرار السريعة */
.quick-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.qa-btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  font-family: 'Cairo', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.qa-btn.success { background: rgba(16,185,129,0.15); color: #34D399; }
.qa-btn.danger  { background: rgba(239,68,68,0.15);  color: #FCA5A5; }
.qa-btn.warning { background: rgba(245,158,11,0.15); color: #FCD34D; }
.qa-btn.info    { background: rgba(59,130,246,0.15); color: #93C5FD; }
.qa-btn.more    { background: rgba(255,255,255,0.05); color: var(--text-secondary); font-size: 1.2rem; padding: 4px 10px; }

.qa-btn:hover { filter: brightness(1.2); transform: translateY(-1px); }

/* ─── Pagination ─────────────────────────────── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
}

.page-btn {
  width: 38px; height: 38px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1rem;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.page-btn:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.page-info { font-size: 0.85rem; color: var(--text-muted); }

/* ─── Transitions ────────────────────────────── */
.list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from { opacity: 0; transform: translateX(20px); }
.list-leave-to   { opacity: 0; transform: translateX(-20px); }
</style>