import { ref, computed, watch } from 'vue'

export function useTheme() {
  const mode = ref(localStorage.getItem('theme-mode') || 'dark')
  const primaryColor = ref(localStorage.getItem('theme-primary') || '#1E40AF')
  const secondaryColor = ref(localStorage.getItem('theme-secondary') || '#F59E0B')

  const isDark = computed(() => mode.value === 'dark')
  const isLight = computed(() => mode.value === 'light')

  function applyTheme() {
    const root = document.documentElement
    root.classList.toggle('theme-dark', mode.value === 'dark')
    root.classList.toggle('theme-light', mode.value === 'light')
    root.style.setProperty('--primary', primaryColor.value)
    root.style.setProperty('--secondary', secondaryColor.value)
  }

  function toggleMode() {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
  }

  function setMode(newMode) {
    mode.value = newMode
  }

  function setPrimaryColor(color) {
    primaryColor.value = color
  }

  function setSecondaryColor(color) {
    secondaryColor.value = color
  }

  watch(mode, (val) => {
    localStorage.setItem('theme-mode', val)
    applyTheme()
  })

  watch(primaryColor, (val) => {
    localStorage.setItem('theme-primary', val)
    applyTheme()
  })

  watch(secondaryColor, (val) => {
    localStorage.setItem('theme-secondary', val)
    applyTheme()
  })

  return {
    mode,
    primaryColor,
    secondaryColor,
    isDark,
    isLight,
    applyTheme,
    toggleMode,
    setMode,
    setPrimaryColor,
    setSecondaryColor,
  }
}
