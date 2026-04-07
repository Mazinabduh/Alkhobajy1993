<template>
  <Teleport to="body">
    <div class="confirm-overlay" @click.self="$emit('cancel')">
      <div class="confirm-card" :class="type">
        <div class="confirm-icon">{{ icons[type] }}</div>
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="$emit('cancel')">إلغاء</button>
          <button class="btn-confirm" :class="type" @click="$emit('confirm')">
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  title:        { type: String, default: 'تأكيد' },
  message:      { type: String, default: 'هل أنت متأكد؟' },
  confirmLabel: { type: String, default: 'تأكيد' },
  type:         { type: String, default: 'danger' },
})
defineEmits(['confirm', 'cancel'])

const icons = { danger: '⚠️', warning: '🔔', info: 'ℹ️', success: '✅' }
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.confirm-card {
  background: var(--bg-secondary, #1E293B);
  border-radius: 20px;
  padding: 28px 24px;
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}

.confirm-icon { font-size: 2.5rem; }

.confirm-card h3 {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary, #F1F5F9);
}

.confirm-card p {
  font-size: 0.875rem;
  color: var(--text-secondary, #94A3B8);
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 6px;
}

.btn-cancel {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: 1.5px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  font-family: 'Cairo', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel:hover { border-color: var(--text-secondary); }

.btn-confirm {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: none;
  font-family: 'Cairo', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  color: white;
  transition: all 0.2s;
}

.btn-confirm.danger  { background: linear-gradient(135deg,#DC2626,#B91C1C); box-shadow: 0 4px 12px rgba(220,38,38,0.4); }
.btn-confirm.warning { background: linear-gradient(135deg,#D97706,#B45309); }
.btn-confirm.info    { background: linear-gradient(135deg,#2563EB,#1D4ED8); }
.btn-confirm.success { background: linear-gradient(135deg,#059669,#047857); }

.btn-confirm:hover { transform: translateY(-1px); filter: brightness(1.1); }
</style>