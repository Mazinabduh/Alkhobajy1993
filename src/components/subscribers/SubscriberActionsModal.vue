<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="actions-sheet">

        <!-- مقبض السحب -->
        <div class="sheet-handle"></div>

        <!-- معلومات المشترك -->
        <div class="sheet-header">
          <div class="sub-avatar">{{ subscriber.name.charAt(0) }}</div>
          <div>
            <div class="sub-name">{{ subscriber.name }}</div>
            <div class="sub-meter">{{ subscriber.meter_number }}</div>
          </div>
        </div>

        <!-- الإجراءات -->
        <div class="actions-list">
          <button
            v-for="action in availableActions"
            :key="action.key"
            class="action-item"
            :class="action.color"
            @click="$emit('action', action.key); $emit('close')"
          >
            <span class="action-item-icon">{{ action.icon }}</span>
            <span class="action-item-label">{{ action.label }}</span>
            <svg class="action-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
        </div>

        <!-- إغلاق -->
        <div class="sheet-footer">
          <button class="btn-close-sheet" @click="$emit('close')">إغلاق</button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.js'

const props = defineProps({ subscriber: { type: Object, required: true } })
defineEmits(['close', 'action'])

const auth = useAuthStore()

const allActions = [
  { key: 'edit',      label: 'تعديل البيانات',      icon: '✏️', color: 'info',    perm: 'subscribers.edit' },
  { key: 'reading',   label: 'إضافة قراءة',          icon: '⚡', color: 'primary', perm: 'readings.create' },
  { key: 'statement', label: 'كشف الحساب',           icon: '📊', color: 'info',    perm: 'subscribers.statement' },
  { key: 'print',     label: 'طباعة كشف الحساب',     icon: '🖨️', color: 'neutral', perm: 'subscribers.print' },
  { key: 'delete',    label: 'حذف المشترك',          icon: '🗑️', color: 'danger',  perm: 'subscribers.delete' },
]

const availableActions = computed(() =>
  allActions.filter(a => auth.hasPermission(a.perm))
)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 800;
}

.actions-sheet {
  background: var(--bg-secondary, #1E293B);
  border-radius: 24px 24px 0 0;
  padding: 0 0 env(safe-area-inset-bottom);
  width: 100%;
  max-width: 480px;
  border-top: 1px solid var(--border-color);
  box-shadow: 0 -10px 40px rgba(0,0,0,0.4);
  animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

.sheet-handle {
  width: 36px; height: 4px;
  border-radius: 99px;
  background: rgba(255,255,255,0.15);
  margin: 10px auto;
}

.sheet-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px 14px;
  border-bottom: 1px solid var(--border-color);
}

.sub-avatar {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg,#1D4ED8,#7C3AED);
  color: white;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700;
}

.sub-name  { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
.sub-meter { font-size: 0.72rem; color: var(--text-muted); font-family: monospace; }

.actions-list {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: right;
  width: 100%;
  transition: all 0.15s;
}

.action-item:hover { background: rgba(255,255,255,0.05); }

.action-item-icon { font-size: 1.3rem; }
.action-item-label { flex: 1; font-family: 'Cairo', sans-serif; font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }

.action-arrow { width: 16px; height: 16px; color: var(--text-muted); }

.action-item.danger .action-item-label { color: #FCA5A5; }
.action-item.info   .action-item-label { color: #60A5FA; }

.sheet-footer {
  padding: 12px 20px 6px;
  border-top: 1px solid var(--border-color);
}

.btn-close-sheet {
  width: 100%;
  padding: 13px;
  border-radius: 12px;
  border: 1.5px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  font-family: 'Cairo', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-close-sheet:hover { background: rgba(255,255,255,0.04); }
</style>