<template>
  <div class="inventory-view" dir="rtl">

    <!-- رأس الصفحة -->
    <div class="page-header">
      <div class="header-top">
        <h1>المخزون</h1>
        <button class="btn-primary" @click="router.push('/inventory/new')">
          <span>+</span> إضافة صنف
        </button>
      </div>

      <!-- إحصائيات -->
      <div class="stats-row">
        <div class="stat-chip">
          <span class="chip-icon">📦</span>
          <span class="chip-val">{{ store.items.length }}</span>
          <span class="chip-lbl">إجمالي الأصناف</span>
        </div>
        <div class="stat-chip warning">
          <span class="chip-icon">⚠️</span>
          <span class="chip-val">{{ store.lowStockItems.length }}</span>
          <span class="chip-lbl">مخزون منخفض</span>
        </div>
        <div class="stat-chip success">
          <span class="chip-icon">💰</span>
          <span class="chip-val">{{ formatMoney(store.totalValue) }}</span>
          <span class="chip-lbl">قيمة المخزون</span>
        </div>
      </div>

      <!-- تنبيه المخزون المنخفض -->
      <div v-if="store.lowStockItems.length > 0" class="low-stock-alert">
        <span>⚠️</span>
        <span>{{ store.lowStockItems.length }} أصناف تحتاج إعادة تخزين</span>
        <button @click="store.filterCategory = ''; showLowOnly = !showLowOnly">
          {{ showLowOnly ? 'عرض الكل' : 'عرض المنخفض فقط' }}
        </button>
      </div>

      <!-- بحث وفلتر -->
      <div class="filters-row">
        <div class="search-wrap">
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
          </svg>
          <input
            v-model="store.searchQuery"
            type="search"
            placeholder="بحث في المخزون..."
            class="search-input"
          />
        </div>
        <select v-model="store.filterCategory" class="filter-select">
          <option value="">كل التصنيفات</option>
          <option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
    </div>

    <!-- loading -->
    <div v-if="store.isLoading" class="center-state">
      <div class="spinner"></div>
    </div>

    <!-- فارغ -->
    <div v-else-if="displayList.length === 0" class="center-state">
      <span class="empty-icon">📦</span>
      <h3>لا توجد أصناف</h3>
      <button class="btn-primary" @click="router.push('/inventory/new')">إضافة صنف</button>
    </div>

    <!-- القائمة -->
    <div v-else class="inventory-list">
      <div
        v-for="item in displayList"
        :key="item.id"
        class="inventory-card"
        :class="{ 'low-stock': item.min_quantity > 0 && item.quantity <= item.min_quantity }"
      >
        <div class="item-header">
          <div class="item-icon-wrap">
            <span class="item-icon">{{ getCategoryIcon(item.category_name) }}</span>
          </div>
          <div class="item-info">
            <h3>{{ item.name }}</h3>
            <span class="item-category">{{ item.category_name || 'غير مصنف' }}</span>
          </div>
          <div class="item-quantity-badge" :class="getQuantityClass(item)">
            <span class="qty-val">{{ item.quantity }}</span>
            <span class="qty-unit">{{ item.unit }}</span>
          </div>
        </div>

        <div class="item-prices">
          <div class="price-item">
            <span class="price-lbl">سعر الشراء</span>
            <span class="price-val">{{ formatMoney(item.purchase_price) }}</span>
          </div>
          <div class="price-divider"></div>
          <div class="price-item">
            <span class="price-lbl">سعر البيع</span>
            <span class="price-val success">{{ formatMoney(item.selling_price) }}</span>
          </div>
          <div class="price-divider"></div>
          <div class="price-item">
            <span class="price-lbl">القيمة الكلية</span>
            <span class="price-val primary">{{ formatMoney(item.quantity * item.purchase_price) }}</span>
          </div>
        </div>

        <!-- أزرار الإجراءات -->
        <div class="item-actions">
          <button class="ia-btn success" @click="openTransaction(item, 'purchase')">
            📥 وارد
          </button>
          <button class="ia-btn danger" @click="openTransaction(item, 'consumption')">
            📤 صادر
          </button>
          <button class="ia-btn info" @click="router.push(`/inventory/${item.id}/transactions`)">
            📋 الحركة
          </button>
          <button class="ia-btn neutral" @click="router.push(`/inventory/${item.id}/edit`)">
            ✏️
          </button>
          <button class="ia-btn danger-ghost" @click="confirmDelete(item)">
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- نافذة الحركة السريعة -->
    <InventoryTransactionModal
      v-if="showTransactionModal"
      :item="selectedItem"
      :type="transactionType"
      @close="showTransactionModal = false"
      @saved="onTransactionSaved"
    />

    <!-- تأكيد الحذف -->
    <AppConfirm
      v-if="showDeleteConfirm"
      title="حذف الصنف"
      :message="`هل تريد حذف ${selectedItem?.name}؟`"
      confirm-label="حذف"
      type="danger"
      @confirm="doDelete"
      @cancel="showDeleteConfirm = false"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter }          from 'vue-router'
import { useInventoryStore }  from '@/stores/inventory.js'
import { useSettingsStore }   from '@/stores/settings.js'
import { useToast }           from '@/composables/useToast.js'
import InventoryTransactionModal from '@/components/inventory/InventoryTransactionModal.vue'
import AppConfirm             from '@/components/common/AppConfirm.vue'

const router = useRouter()
const store  = useInventoryStore()
const settings = useSettingsStore()
const toast  = useToast()

const showLowOnly           = ref(false)
const showTransactionModal  = ref(false)
const showDeleteConfirm     = ref(false)
const selectedItem          = ref(null)
const transactionType       = ref('purchase')

const displayList = computed(() => {
  if (showLowOnly.value) return store.lowStockItems
  return store.filtered
})

onMounted(async () => {
  await store.loadAll()
  settings.loadSettings()
})

function formatMoney(v) {
  return Number(v||0).toLocaleString('ar-SA') + ' ' + settings.currency
}

function getCategoryIcon(cat) {
  const icons = {
    'عدادات': '🔌', 'أسلاك': '🔗', 'وقود': '⛽',
    'مواد صيانة': '🔧', 'مواد أخرى': '📦',
  }
  return icons[cat] ?? '📦'
}

function getQuantityClass(item) {
  if (item.min_quantity > 0 && item.quantity <= item.min_quantity) return 'qty-danger'
  if (item.quantity === 0) return 'qty-empty'
  return 'qty-ok'
}

function openTransaction(item, type) {
  selectedItem.value    = item
  transactionType.value = type
  showTransactionModal.value = true
}

function confirmDelete(item) {
  selectedItem.value    = item
  showDeleteConfirm.value = true
}

async function doDelete() {
  showDeleteConfirm.value = false
  await store.remove(selectedItem.value.id)
  toast.success('تم حذف الصنف')
}

function onTransactionSaved() {
  showTransactionModal.value = false
  toast.success('تم تسجيل حركة المخزون')
  store.loadAll()
}
</script>

<style scoped>
.inventory-view { display: flex; flex-direction: column; min-height: 100%; }

.page-header {
  background: var(--bg-secondary);
  padding: 14px;
  display: flex; flex-direction: column; gap: 10px;
  border-bottom: 1px solid var(--border-color);
  position: sticky; top: 0; z-index: 10;
}

.header-top { display: flex; align-items: center; justify-content: space-between; }
.header-top h1 { font-size: 1.2rem; font-weight: 800; color: var(--text-primary); }

.btn-primary {
  padding: 9px 16px;
  background: linear-gradient(135deg,#1D4ED8,#1E40AF);
  border: none; border-radius: 11px; color: white;
  font-family: 'Cairo', sans-serif; font-size: 0.88rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; gap: 4px;
  box-shadow: 0 4px 12px rgba(29,78,216,0.3);
}

.stats-row {
  display: flex; gap: 8px;
}

.stat-chip {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  gap: 2px; padding: 10px 6px; border-radius: 12px;
  background: rgba(255,255,255,0.03); border: 1px solid var(--border-color);
}

.chip-icon { font-size: 1.3rem; }
.chip-val  { font-size: 0.95rem; font-weight: 800; color: var(--text-primary); }
.chip-lbl  { font-size: 0.65rem; color: var(--text-muted); text-align: center; }

.stat-chip.warning .chip-val { color: #FBBF24; }
.stat-chip.success .chip-val { color: #34D399; font-size: 0.78rem; }

.low-stock-alert {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.3);
  border-radius: 10px; font-size: 0.85rem; color: #FBBF24;
}
.low-stock-alert button {
  margin-right: auto; font-size: 0.78rem; color: #FBBF24;
  background: none; border: none; cursor: pointer; text-decoration: underline;
  font-family: 'Cairo', sans-serif;
}

.filters-row { display: flex; gap: 8px; }

.search-wrap { flex: 1; position: relative; display: flex; align-items: center; }
.search-icon {
  position: absolute; right: 10px; width: 16px; height: 16px;
  color: var(--text-muted); pointer-events: none;
}
.search-input {
  width: 100%; padding: 9px 34px 9px 12px;
  background: var(--bg-input); border: 1.5px solid var(--border-input);
  border-radius: 10px; color: var(--text-primary);
  font-family: 'Cairo', sans-serif; font-size: 0.85rem; outline: none;
}

.filter-select {
  padding: 9px 10px; background: var(--bg-input);
  border: 1.5px solid var(--border-input); border-radius: 10px;
  color: var(--text-secondary); font-family: 'Cairo', sans-serif;
  font-size: 0.8rem; outline: none; -webkit-appearance: none; min-width: 90px;
}

.center-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 60px 20px;
  color: var(--text-muted); text-align: center;
}
.spinner {
  width: 32px; height: 32px; border: 3px solid rgba(59,130,246,0.2);
  border-top-color: #3B82F6; border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { font-size: 3rem; }
.center-state h3 { font-size: 1rem; color: var(--text-secondary); }

/* ─── القائمة ─────────────────────────────────── */
.inventory-list {
  display: flex; flex-direction: column; gap: 8px; padding: 8px;
}

.inventory-card {
  background: var(--card-bg); border: 1px solid var(--border-color);
  border-radius: 14px; padding: 14px;
  display: flex; flex-direction: column; gap: 10px;
  transition: all 0.2s;
}

.inventory-card.low-stock { border-color: rgba(245,158,11,0.4); }

.item-header { display: flex; align-items: center; gap: 10px; }

.item-icon-wrap {
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; flex-shrink: 0;
}

.item-info { flex: 1; min-width: 0; }
.item-info h3 {
  font-size: 0.95rem; font-weight: 700; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.item-category { font-size: 0.72rem; color: var(--text-muted); }

.item-quantity-badge {
  display: flex; flex-direction: column; align-items: center;
  padding: 6px 10px; border-radius: 10px; flex-shrink: 0;
}
.item-quantity-badge.qty-ok     { background: rgba(16,185,129,0.12); }
.item-quantity-badge.qty-danger { background: rgba(245,158,11,0.12); }
.item-quantity-badge.qty-empty  { background: rgba(239,68,68,0.12);  }

.qty-val {
  font-size: 1.1rem; font-weight: 800;
}
.qty-ok     .qty-val { color: #34D399; }
.qty-danger .qty-val { color: #FBBF24; }
.qty-empty  .qty-val { color: #F87171; }

.qty-unit { font-size: 0.65rem; color: var(--text-muted); }

/* الأسعار */
.item-prices {
  display: flex; align-items: center; gap: 0;
  background: rgba(255,255,255,0.02); border-radius: 10px; overflow: hidden;
  border: 1px solid var(--border-color);
}

.price-item {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  gap: 2px; padding: 8px 4px;
}
.price-lbl  { font-size: 0.65rem; color: var(--text-muted); }
.price-val  { font-size: 0.8rem; font-weight: 700; color: var(--text-primary); }
.price-val.success { color: #34D399; }
.price-val.primary { color: #60A5FA; }

.price-divider { width: 1px; background: var(--border-color); align-self: stretch; }

/* الأزرار */
.item-actions { display: flex; gap: 6px; flex-wrap: wrap; }

.ia-btn {
  padding: 7px 12px; border-radius: 8px; border: none;
  font-family: 'Cairo', sans-serif; font-size: 0.75rem; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; gap: 4px;
  transition: all 0.15s; white-space: nowrap;
}
.ia-btn.success      { background: rgba(16,185,129,0.15); color: #34D399; }
.ia-btn.danger       { background: rgba(239,68,68,0.15);  color: #FCA5A5; }
.ia-btn.info         { background: rgba(59,130,246,0.15);  color: #60A5FA; }
.ia-btn.neutral      { background: rgba(100,116,139,0.12); color: #94A3B8; }
.ia-btn.danger-ghost { background: transparent; color: #F87171; }
.ia-btn:hover        { filter: brightness(1.2); }
</style>