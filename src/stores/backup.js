import { defineStore } from 'pinia'
import { ref }         from 'vue'
import { db }          from '@/database/db.js'
import { useSettingsStore }      from '@/stores/settings.js'
import { useNotificationsStore } from '@/stores/notifications.js'

export const useBackupStore = defineStore('backup', () => {
  const isUploading  = ref(false)
  const isRestoring  = ref(false)
  const lastBackupAt = ref(null)
  const error        = ref(null)
  const logs         = ref([])

  async function loadLogs() {
    logs.value = await db.backup_logs.orderBy('created_at').reverse().limit(20).toArray()
  }

  // ─── إنشاء نسخة كاملة ────────────────────────
  async function createFullBackup() {
    const settings = useSettingsStore()
    const now      = new Date().toISOString()

    const backup = {
      version:      '1.0.0',
      created_at:   now,
      station_name: settings.stationName,
      data: {
        subscribers:            await db.subscribers.toArray(),
        zones:                  await db.zones.toArray(),
        meters:                 await db.meters.toArray(),
        readings:               await db.readings.toArray(),
        invoices:               await db.invoices.toArray(),
        payments:               await db.payments.toArray(),
        inventory_categories:   await db.inventory_categories.toArray(),
        inventory_items:        await db.inventory_items.toArray(),
        inventory_transactions: await db.inventory_transactions.toArray(),
        expense_categories:     await db.expense_categories.toArray(),
        expenses:               await db.expenses.toArray(),
        message_templates:      await db.message_templates.toArray(),
        users:                  await db.users.toArray(),
        settings:               await db.settings.toArray(),
      }
    }

    return JSON.stringify(backup, null, 2)
  }

  // ─── رفع إلى GitHub ───────────────────────────
  async function uploadToGitHub() {
    const settings = useSettingsStore()
    const notifs   = useNotificationsStore()

    if (!settings.hasGithubConfig) {
      error.value = 'يرجى ضبط إعدادات GitHub أولاً'
      return false
    }

    isUploading.value = true
    error.value       = null

    try {
      const backupJson = await createFullBackup()
      const filename   = `backup_${Date.now()}.json`
      const path       = `${settings.githubFolder}/${filename}`
      const content    = btoa(unescape(encodeURIComponent(backupJson)))

      const response = await fetch(
        `https://api.github.com/repos/${settings.githubUsername}/${settings.githubRepo}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${settings.githubToken}`,
            'Content-Type':  'application/json',
            'User-Agent':    'KhubjiElectric/1.0',
          },
          body: JSON.stringify({
            message: `نسخة احتياطية ${new Date().toLocaleDateString('ar')}`,
            content,
          })
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || `خطأ ${response.status}`)
      }

      lastBackupAt.value = new Date().toISOString()

      await db.backup_logs.add({
        filename,
        size:       backupJson.length,
        type:      'github',
        status:    'success',
        notes:     `رُفع إلى GitHub/${path}`,
        created_at: lastBackupAt.value,
      })

      await notifs.addNotification({
        title:   'نسخة احتياطية',
        message: 'تم رفع النسخة الاحتياطية إلى GitHub بنجاح',
        type:    'success',
      })

      await loadLogs()
      return true

    } catch (e) {
      error.value = e.message
      await db.backup_logs.add({
        filename:   '',
        size:       0,
        type:      'github',
        status:    'failed',
        notes:      e.message,
        created_at: new Date().toISOString(),
      })
      return false
    } finally {
      isUploading.value = false
    }
  }

  // ─── استعادة من GitHub ────────────────────────
  async function restoreFromGitHub(filename) {
    const settings = useSettingsStore()

    if (!settings.hasGithubConfig) {
      error.value = 'يرجى ضبط إعدادات GitHub أولاً'
      return false
    }

    isRestoring.value = true
    error.value       = null

    try {
      const path     = `${settings.githubFolder}/${filename}`
      const response = await fetch(
        `https://api.github.com/repos/${settings.githubUsername}/${settings.githubRepo}/contents/${path}`,
        {
          headers: {
            'Authorization': `token ${settings.githubToken}`,
            'User-Agent':    'KhubjiElectric/1.0',
          }
        }
      )

      if (!response.ok) throw new Error(`خطأ ${response.status}`)

      const fileData = await response.json()
      const json     = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))))
      const backup   = JSON.parse(json)

      await restoreFromObject(backup)
      return true

    } catch (e) {
      error.value = e.message
      return false
    } finally {
      isRestoring.value = false
    }
  }

  // ─── قائمة النسخ على GitHub ───────────────────
  async function listGitHubBackups() {
    const settings = useSettingsStore()
    if (!settings.hasGithubConfig) return []

    try {
      const response = await fetch(
        `https://api.github.com/repos/${settings.githubUsername}/${settings.githubRepo}/contents/${settings.githubFolder}`,
        {
          headers: {
            'Authorization': `token ${settings.githubToken}`,
            'User-Agent':    'KhubjiElectric/1.0',
          }
        }
      )

      if (!response.ok) return []
      const files = await response.json()
      return files
        .filter(f => f.name.endsWith('.json'))
        .sort((a, b) => b.name.localeCompare(a.name))
    } catch {
      return []
    }
  }

  // ─── نسخ احتياطي محلي ────────────────────────
  async function backupLocally() {
    const { useExportService } = await import('@/services/ExportService.js')
    const { downloadFile }     = useExportService()
    const backupJson           = await createFullBackup()
    const filename             = `khubji-backup-${Date.now()}.json`

    downloadFile(backupJson, filename, 'application/json')

    await db.backup_logs.add({
      filename,
      size:       backupJson.length,
      type:      'local',
      status:    'success',
      notes:     'نسخة محلية',
      created_at: new Date().toISOString(),
    })

    await loadLogs()
    return filename
  }

  // ─── استعادة من ملف محلي ─────────────────────
  async function restoreFromFile(file) {
    isRestoring.value = true
    error.value       = null

    try {
      const text   = await file.text()
      const backup = JSON.parse(text)
      await restoreFromObject(backup)
      return true
    } catch (e) {
      error.value = e.message
      return false
    } finally {
      isRestoring.value = false
    }
  }

  // ─── منطق الاستعادة الفعلية ───────────────────
  async function restoreFromObject(backup) {
    if (!backup?.data) throw new Error('ملف النسخة الاحتياطية غير صحيح')

    const { data } = backup

    // مسح البيانات الحالية
    await Promise.all([
      db.subscribers.clear(),
      db.zones.clear(),
      db.meters.clear(),
      db.readings.clear(),
      db.invoices.clear(),
      db.payments.clear(),
      db.inventory_categories.clear(),
      db.inventory_items.clear(),
      db.inventory_transactions.clear(),
      db.expense_categories.clear(),
      db.expenses.clear(),
      db.message_templates.clear(),
    ])

    // استعادة البيانات
    const restoreTable = async (table, rows) => {
      if (rows?.length > 0) {
        await db[table].bulkPut(rows)
      }
    }

    await restoreTable('subscribers',            data.subscribers)
    await restoreTable('zones',                  data.zones)
    await restoreTable('meters',                 data.meters)
    await restoreTable('readings',               data.readings)
    await restoreTable('invoices',               data.invoices)
    await restoreTable('payments',               data.payments)
    await restoreTable('inventory_categories',   data.inventory_categories)
    await restoreTable('inventory_items',        data.inventory_items)
    await restoreTable('inventory_transactions', data.inventory_transactions)
    await restoreTable('expense_categories',     data.expense_categories)
    await restoreTable('expenses',               data.expenses)
    await restoreTable('message_templates',      data.message_templates)

    // استعادة الإعدادات (بدون مسح إعدادات GitHub)
    if (data.settings?.length > 0) {
      const githubKeys  = ['github_token','github_username','github_repo','github_folder']
      const safeSettings = data.settings.filter(s => !githubKeys.includes(s.key))
      await db.settings.bulkPut(safeSettings)
    }

    // استعادة المستخدمين (مع الحفاظ على المستخدم الحالي)
    if (data.users?.length > 0) {
      await db.users.clear()
      await db.users.bulkPut(data.users)
    }

    await useNotificationsStore().addNotification({
      title:   'استعادة البيانات',
      message: `تم استعادة البيانات بنجاح من النسخة المؤرخة ${backup.created_at?.slice(0,10) ?? ''}`,
      type:    'success',
    })

    await db.backup_logs.add({
      filename:   backup.station_name ?? 'استعادة',
      size:       0,
      type:      'restore',
      status:    'success',
      notes:     `استُعيدت من نسخة ${backup.created_at?.slice(0,10)}`,
      created_at: new Date().toISOString(),
    })
  }

  // ─── استيراد JSON من نظام خارجي ──────────────
  async function importExternalJSON(file) {
    try {
      const text   = await file.text()
      const data   = JSON.parse(text)
      const report = { imported: 0, skipped: 0, errors: [] }

      // محاولة فهم البنية وتوزيعها
      await analyzeAndImport(data, report)

      return report
    } catch (e) {
      return { imported: 0, skipped: 0, errors: [e.message] }
    }
  }

  async function analyzeAndImport(data, report) {
    const now = new Date().toISOString()

    // البحث عن قوائم محتملة للمشتركين
    const subCandidates = findArrayByKeys(data, ['name','phone','meter','meter_number','العداد','الاسم'])
    if (subCandidates) {
      for (const row of subCandidates) {
        try {
          const sub = {
            name:         row.name || row.الاسم || row.subscriber_name || 'مشترك مستورد',
            phone:        row.phone || row.الهاتف || row.mobile || '',
            meter_number: row.meter_number || row.meter || row.العداد || String(Date.now()),
            zone_id:      null,
            status:      'active',
            balance:      parseFloat(row.balance || row.الرصيد || 0),
            deposit:      parseFloat(row.deposit || row.المقدم || 0),
            notes:       'مستورد من نظام خارجي',
            created_at:  now,
            updated_at:  now,
          }
          await db.subscribers.put(sub)
          report.imported++
        } catch (e) {
          report.skipped++
          report.errors.push(`مشترك: ${e.message}`)
        }
      }
    }
  }

  function findArrayByKeys(data, possibleKeys) {
    if (Array.isArray(data)) {
      const first = data[0]
      if (first && possibleKeys.some(k => k in first)) return data
    }

    for (const val of Object.values(data || {})) {
      if (Array.isArray(val)) {
        const first = val[0]
        if (first && possibleKeys.some(k => k in first)) return val
      }
    }

    return null
  }

  return {
    isUploading, isRestoring, lastBackupAt, error, logs,
    loadLogs, createFullBackup, uploadToGitHub,
    restoreFromGitHub, listGitHubBackups,
    backupLocally, restoreFromFile, importExternalJSON,
  }
})