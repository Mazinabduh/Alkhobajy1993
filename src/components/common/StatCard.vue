<template>
  <div class="stat-card" :style="{ '--accent': stat.color }" @click="$emit('click')">
    <div class="stat-icon">{{ stat.icon }}</div>
    <div class="stat-body">
      <div class="stat-value">
        <span v-if="stat.isMoney" class="stat-currency">{{ currency }}</span>
        <animated-number :value="displayValue" />
      </div>
      <div class="stat-label">{{ stat.label }}</div>
    </div>
    <div class="stat-glow"></div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings.js'

const props = defineProps({
  stat: { type: Object, required: true }
})
defineEmits(['click'])

const settings     = useSettingsStore()
const currency     = computed(() => settings.currency)
const displayValue = computed(() => {
  if (props.stat.isMoney) return Number(props.stat.value || 0).toFixed(0)
  return props.stat.value ?? 0
})
</script>

<style scoped>
.stat-card {
  background: var(--card-bg, rgba(30,41,59,0.6));
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.3);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 80px; height: 80px;
  background: radial-gradient(circle, var(--accent, #3B82F6) 0%, transparent 70%);
  opacity: 0.12;
  border-radius: 0 16px 0 80px;
}

.stat-icon {
  font-size: 1.8rem;
  line-height: 1;
  filter: drop-shadow(0 0 8px var(--accent, #3B82F6));
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-primary, #F1F5F9);
  display: flex;
  align-items: baseline;
  gap: 4px;
  direction: ltr;
  justify-content: flex-end;
}

.stat-currency {
  font-size: 0.75rem;
  color: var(--accent, #3B82F6);
  font-weight: 600;
}

.stat-label {
  font-size: 0.78rem;
  color: var(--text-muted, #64748B);
  font-weight: 500;
  text-align: right;
}

.stat-glow {
  position: absolute;
  bottom: 0; right: 0;
  width: 100%; height: 3px;
  background: linear-gradient(90deg, transparent, var(--accent, #3B82F6));
  opacity: 0.6;
}
</style>