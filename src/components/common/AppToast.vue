<template>
  <div class="toast-container" dir="rtl">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="toast.type"
      >
        <span class="toast-icon">{{ icons[toast.type] }}</span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { toasts } from '@/composables/useToast.js'

const icons = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: calc(100% - 32px);
  max-width: 360px;
  pointer-events: none;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  pointer-events: all;
}

.toast-item.success { background: rgba(16, 185, 129, 0.95); }
.toast-item.error   { background: rgba(239, 68, 68, 0.95);  }
.toast-item.warning { background: rgba(245, 158, 11, 0.95); }
.toast-item.info    { background: rgba(59, 130, 246, 0.95); }

.toast-icon    { font-size: 1rem; flex-shrink: 0; }
.toast-message { flex: 1; }

/* Transition */
.toast-enter-active { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from   { opacity: 0; transform: translateY(-20px) scale(0.9); }
.toast-leave-to     { opacity: 0; transform: translateY(-10px); }
</style>