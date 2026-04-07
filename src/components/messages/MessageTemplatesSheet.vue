<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-header">
          <h3>📝 قوالب الرسائل</h3>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <div class="templates-list">
          <div
            v-for="tpl in templates"
            :key="tpl.id"
            class="template-item"
            @click="$emit('select', tpl); $emit('close')"
          >
            <div class="tpl-info">
              <strong>{{ tpl.name }}</strong>
              <p>{{ tpl.content.slice(0, 80) }}{{ tpl.content.length > 80 ? '...' : '' }}</p>
            </div>
            <svg class="tpl-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </div>

          <div v-if="templates.length === 0" class="empty">
            <span>📭</span>
            <p>لا توجد قوالب</p>
            <button class="btn-add-tpl" @click="$emit('close'); router.push('/messages/templates')">
              إضافة قالب
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter }      from 'vue-router'
import { db }             from '@/database/db.js'

defineEmits(['close', 'select'])
const router    = useRouter()
const templates = ref([])

onMounted(async () => {
  templates.value = await db.message_templates.where('is_active').equals(1).toArray()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  backdrop-filter: blur(6px); display: flex; align-items: flex-end;
  justify-content: center; z-index: 800;
}

.sheet {
  background: var(--bg-secondary); border-radius: 24px 24px 0 0;
  width: 100%; max-width: 480px; max-height: 70vh;
  border: 1px solid var(--border-color); box-shadow: 0 -10px 40px rgba(0,0,0,0.4);
  display: flex; flex-direction: column; animation: slideUp 0.3s ease;
}
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

.sheet-handle {
  width: 36px; height: 4px; border-radius: 99px;
  background: rgba(255,255,255,0.15); margin: 10px auto;
}

.sheet-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 20px 12px; border-bottom: 1px solid var(--border-color);
}
.sheet-header h3 { font-size: 1rem; font-weight: 800; color: var(--text-primary); }

.close-btn {
  width: 30px; height: 30px; border-radius: 8px;
  border: 1px solid var(--border-color); background: transparent;
  color: var(--text-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

.templates-list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 6px; }

.template-item {
  display: flex; align-items: center; gap: 12px; padding: 12px 14px;
  border-radius: 11px; border: 1px solid var(--border-color);
  cursor: pointer; transition: all 0.2s;
}
.template-item:hover { border-color: rgba(59,130,246,0.3); background: rgba(59,130,246,0.04); }

.tpl-info { flex: 1; min-width: 0; }
.tpl-info strong { font-size: 0.875rem; font-weight: 700; color: var(--text-primary); display: block; margin-bottom: 3px; }
.tpl-info p      { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.tpl-arrow { width: 16px; height: 16px; color: var(--text-muted); flex-shrink: 0; }

.empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 32px; color: var(--text-muted); text-align: center;
}
.empty span { font-size: 2rem; }
.empty p    { font-size: 0.85rem; }

.btn-add-tpl {
  padding: 8px 18px; border-radius: 10px; border: 1px solid rgba(59,130,246,0.3);
  background: rgba(59,130,246,0.08); color: #60A5FA;
  font-family: 'Cairo', sans-serif; font-size: 0.85rem; cursor: pointer;
}
</style>