import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { db } from '@/database/db.js'

export const useSettingsStore = defineStore('settings', () => {
  // ─── State ───────────────────────────────────
  const stationName    = ref('محطة الخبجي الكهربائية')
  const stationPhone   = ref('')
  const stationAddress = ref('')
  const stationLogo    = ref('')
  const unitPrice      = ref(1.00)
  const currency       = ref('ر.س')
  const taxRate        = ref(0)
  const invoicePrefix  = ref('INV')
  const invoiceCounter = ref(1)
  const footerMessage  = ref('شكرًا لكم، نسعد بخدمتكم دائمًا')
  const themeMode      = ref('dark')
  const themePrimary   = ref('#1E40AF')
  const themeSecondary = ref('#F59E0B')
  const fontSize       = ref('medium')
  const iconSize       = ref('medium')
  const githubToken    = ref('')
  const githubUsername = ref('')
  const githubRepo     = ref('')
  const githubFolder   = ref('backups')
  const autoBackup     = ref(false)
  const isLoaded       = ref(false)

  // ─── Getters ──────────────────────────────────
  const hasGithubConfig = computed(() =>
    !!githubToken.value && !!githubUsername.value && !!githubRepo.value
  )

  const themeVars = computed(() => ({
    '--primary':       themePrimary.value,
    '--primary-dark':  adjustColor(themePrimary.value, -20),
    '--secondary':     themeSecondary.value,
  }))

  // ─── Actions ──────────────────────────────────

  async function loadSettings() {
    if (isLoaded.value) return

    try {
      const all = await db.settings.toArray()
      const map = Object.fromEntries(all.map(s => [s.key, s.value]))

      stationName.value    = map.station_name    ?? stationName.value
      stationPhone.value   = map.station_phone   ?? ''
      stationAddress.value = map.station_address ?? ''
      stationLogo.value    = map.station_logo    ?? ''
      unitPrice.value      = parseFloat(map.unit_price ?? '1')
      currency.value       = map.currency        ?? 'ر.س'
      taxRate.value        = parseFloat(map.tax_rate ?? '0')
      invoicePrefix.value  = map.invoice_prefix  ?? 'INV'
      invoiceCounter.value = parseInt(map.invoice_counter ?? '1')
      footerMessage.value  = map.footer_message  ?? footerMessage.value
      themeMode.value      = map.theme_mode      ?? 'dark'
      themePrimary.value   = map.theme_primary   ?? '#1E40AF'
      themeSecondary.value = map.theme_secondary ?? '#F59E0B'
      fontSize.value       = map.font_size       ?? 'medium'
      iconSize.value       = map.icon_size       ?? 'medium'
      githubToken.value    = map.github_token    ?? ''
      githubUsername.value = map.github_username ?? ''
      githubRepo.value     = map.github_repo     ?? ''
      githubFolder.value   = map.github_folder   ?? 'backups'
      autoBackup.value     = map.auto_backup     === 'true'

      applyTheme()
      isLoaded.value = true
    } catch (e) {
      console.error('Settings load error:', e)
    }
  }

  async function saveSetting(key, value) {
    await db.settings.put({ key, value: String(value), updated_at: new Date().toISOString() })
  }

  async function saveAll(data) {
    const entries = Object.entries(data).map(([key, value]) => ({
      key, value: String(value ?? ''), updated_at: new Date().toISOString()
    }))
    await db.settings.bulkPut(entries)
    await loadSettings()
    isLoaded.value = false
    await loadSettings()
  }

  function applyTheme() {
    const root = document.documentElement

    // الوضع الليلي/النهاري
    root.classList.toggle('theme-dark',  themeMode.value === 'dark')
    root.classList.toggle('theme-light', themeMode.value === 'light')

    // الألوان الديناميكية
    root.style.setProperty('--primary',       themePrimary.value)
    root.style.setProperty('--primary-dark',  adjustColor(themePrimary.value, -20))
    root.style.setProperty('--secondary',     themeSecondary.value)

    // حجم الخط
    const fontSizes = { small: '13px', medium: '15px', large: '17px' }
    root.style.setProperty('--font-size-base', fontSizes[fontSize.value] ?? '15px')
  }

  async function generateInvoiceNumber() {
    const num    = invoiceCounter.value
    const padded = String(num).padStart(5, '0')
    const number = `${invoicePrefix.value}-${padded}`

    // تحديث العداد
    invoiceCounter.value = num + 1
    await saveSetting('invoice_counter', invoiceCounter.value)

    return number
  }

  // مساعد لتعديل اللون
  function adjustColor(hex, amount) {
    try {
      const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amount))
      const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amount))
      const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amount))
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    } catch {
      return hex
    }
  }

  return {
    stationName, stationPhone, stationAddress, stationLogo,
    unitPrice, currency, taxRate, invoicePrefix, invoiceCounter,
    footerMessage, themeMode, themePrimary, themeSecondary,
    fontSize, iconSize, githubToken, githubUsername, githubRepo,
    githubFolder, autoBackup, isLoaded, hasGithubConfig, themeVars,
    loadSettings, saveSetting, saveAll, applyTheme, generateInvoiceNumber
  }
})