<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">المظاهر</h1>
    </div>

    <div class="themes-grid">
      <div
        v-for="theme in themes"
        :key="theme.id"
        class="theme-card"
        :class="{ active: currentTheme === theme.id }"
        @click="selectTheme(theme.id)"
      >
        <div class="theme-preview" :style="{ background: theme.bg }">
          <div class="preview-header" :style="{ background: theme.headerBg }"></div>
          <div class="preview-content">
            <div class="preview-line" :style="{ background: theme.accent }"></div>
            <div class="preview-line" style="width:70%"></div>
            <div class="preview-line" style="width:50%"></div>
          </div>
        </div>
        <div class="theme-info">
          <span class="theme-name">{{ theme.name }}</span>
          <span v-if="currentTheme === theme.id" class="active-badge">نشط</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const currentTheme = ref('dark')

const themes = [
  { id: 'dark', name: 'داكن', bg: '#0F172A', headerBg: '#1E293B', accent: '#3B82F6', text: '#F1F5F9' },
  { id: 'light', name: 'فاتح', bg: '#F8FAFC', headerBg: '#FFFFFF', accent: '#1E40AF', text: '#0F172A' },
  { id: 'blue', name: 'أزرق', bg: '#0C1445', headerBg: '#162447', accent: '#1D4ED8', text: '#E0E7FF' },
  { id: 'green', name: 'أخضر', bg: '#052E16', headerBg: '#14532D', accent: '#10B981', text: '#D1FAE5' },
]

onMounted(() => {
  const saved = localStorage.getItem('khubji_theme') || 'dark'
  currentTheme.value = saved
})

function selectTheme(id) {
  currentTheme.value = id
  document.documentElement.className = `theme-${id}`
  localStorage.setItem('khubji_theme', id)
}
</script>

<style scoped>
.page-container { padding: 16px; max-width: 800px; margin: 0 auto; }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.themes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
.theme-card { background: var(--card-bg); border: 2px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden; cursor: pointer; transition: all 0.2s; }
.theme-card:hover { border-color: var(--primary); transform: translateY(-2px); }
.theme-card.active { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(59,130,246,0.3); }
.theme-preview { height: 120px; padding: 8px; display: flex; flex-direction: column; gap: 8px; }
.preview-header { height: 16px; border-radius: 4px; }
.preview-content { flex: 1; display: flex; flex-direction: column; gap: 6px; justify-content: center; padding: 0 4px; }
.preview-line { height: 6px; border-radius: 3px; background: rgba(255,255,255,0.15); width: 90%; }
.theme-info { padding: 10px; display: flex; justify-content: space-between; align-items: center; }
.theme-name { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
.active-badge { background: var(--primary); color: white; padding: 2px 8px; border-radius: 99px; font-size: 0.7rem; font-weight: 600; }
</style>
