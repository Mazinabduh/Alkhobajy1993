<template>
  <div class="backup-view" dir="rtl">

    <div class="page-header">
      <h1>💾 النسخ الاحتياطي</h1>
    </div>

    <!-- حالة الاتصال -->
    <div class="connection-banner" :class="isOnline ? 'online' : 'offline'">
      <span>{{ isOnline ? '🟢' : '🔴' }}</span>
      <span>{{ isOnline ? 'متصل بالإنترنت - يمكن المزامنة مع GitHub' : 'غير متصل - النسخ المحلي متاح فقط' }}</span>
    </div>

    <!-- النسخ المحلي -->
    <div class="backup-section">
      <h2 class="sec-title">💻 النسخ الاحتياطي المحلي</h2>

      <div class="action-cards">
        <div class="action-card" @click="doLocalBackup">
          <div class="ac-icon">📥</div>
          <div class="ac-body">
            <strong>تصدير نسخة احتياطية</strong>
            <span>حفظ ملف JSON في جهازك</span>
          </div>
          <div class="ac-arrow">←</div>
        </div>

        <div class="action-card" @click="triggerImport">
          <div class="ac-icon">📤</div>
          <div class="ac-body">
            <strong>استيراد نسخة احتياطية</strong>
            <span>استعادة من ملف JSON محلي</span>
          </div>
          <div class="ac-arrow">←</div>
        </div>

        <input ref="importFileRef" type="file" accept=".json" hidden @change="onImportFile" />
      </div>
    </div>

    <!-- إعدادات GitHub -->
    <div class="backup-section">
      <div class="sec-header">
        <h2 class="sec-title">🐙 إعدادات GitHub</h2>
        <button class="btn-edit-github" @click="showGithubSettings = !showGithubSettings">
          {{ showGithubSettings ? 'إخفاء' : 'تعديل' }}
        </button>
      </div>

      <div v-if="showGithubSettings" class="github-form">
        <div class="form-group">
          <label>Personal Access Token</label>
          <div class="pwd-wrap">
            <input
              v-model="githubForm.token"
              :type="showToken ? 'text' : 'password'"
              class="form-input"
              placeholder="ghp_xxxxxxxxxxxx"
              dir="ltr"
            />
            <button type="button" class="pwd-toggle" @click="showToken = !showToken">{{ showToken ? '🙈' : '👁️' }}</button>
          </div>
        </div>
        <div class="form-group">
          <label>اسم المستخدم في GitHub</label>
          <input v-model="githubForm.username" type="text" class="form-input" placeholder="username" dir="ltr" />
        </div>
        <div class="form-group">
          <label>اسم المستودع (Repository)</label>
          <input v-model="githubForm.repo" type="text" class="form-input" placeholder="my-backup-repo" dir="ltr" />
        </div>
        <div class="form-group">
          <label>المجلد</label>
          <input v-model="githubForm.folder" type="text" class="form-input" placeholder="backups" dir="ltr" />
        </div>
        <button class="btn-save-github" @click="saveGithubSettings" :disabled="savingGithub">
          <span v-if="savingGithub" class="spinner-sm"></span>
          💾 حفظ الإعدادات
        </button>
      </div>

      <!-- حالة إعدادات GitHub -->
      <div class="github-status" :class="settings.hasGithubConfig ? 'configured' : 'not-configured'">
        <span>{{ settings.hasGithubConfig ? '✅ تم ضبط إعدادات GitHub' : '⚠️ لم يتم ضبط إعدادات GitHub' }}</span>
        <span v-if="settings.hasGithubConfig" class="github-repo-name">
          {{ settings.githubUsername }}/{{ settings.githubRepo }}
        </span>
      </div>
    </div>

    <!-- مزامنة GitHub -->
    <div class="backup-section" v-if="settings.hasGithubConfig">
      <h2 class="sec-title">🔄 مزامنة GitHub</h2>

      <div class="action-cards">
        <div class="action-card" :class="{ disabled: !isOnline || backup.isUploading }" @click="doUpload">
          <div class="ac-icon">{{ backup.isUploading ? '⏳' : '☁️' }}</div>
          <div class="ac-body">
            <strong>رفع نسخة إلى GitHub</strong>
            <span>{{ backup.isUploading ? 'جاري الرفع...' : 'رفع البيانات الحالية' }}</span>
          </div>
          <div v-if="backup.isUploading" class="spinner-sm dark"></div>
          <div v-else class="ac-arrow">←</div>
        </div>

        <div class="action-card" :class="{ disabled: !isOnline }" @click="loadGithubBackups">
          <div class="ac-icon">📋</div>
          <div class="ac-body">
            <strong>عرض النسخ على GitHub</strong>
            <span>استعراض واستعادة نسخة سابقة</span>
          </div>
          <div class="ac-arrow">←</div>
        </div>
      </div>

      <!-- قائمة النسخ على GitHub -->
      <div v-if="githubBackupsList.length > 0" class="github-backups-list">
        <h3 class="list-title">النسخ المتوفرة على GitHub</h3>
        <div
          v-for="file in githubBackupsList"
          :key="file.name"
          class="backup-file-item"
        >
          <div class="file-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatSize(file.size) }}</span>
          </div>
          <button
            class="btn-restore"
            @click="confirmRestore(file.name)"
            :disabled="backup.isRestoring"
          >
            {{ backup.isRestoring ? 'جاري الاستعادة...' : '🔄 استعادة' }}
          </button>
        </div>
      </div>
    </div>

    <!-- استيراد JSON خارجي -->
    <div class="backup-section">
      <h2 class="sec-title">📂 استيراد من نظام خارجي</h2>
      <p class="sec-desc">يمكنك استيراد بيانات من أنظمة أخرى بصيغة JSON وسيحاول النظام فهمها وتوزيعها تلقائياً</p>
      <button class="btn-import-external" @click="triggerExternalImport">
        📂 اختيار ملف JSON
      </button>
      <input ref="externalImportRef" type="file" accept=".json" hidden @change="onExternalImport" />
      <div v-if="importReport" class="import-report">
        <div class="report-row success">✅ تم استيراد {{ importReport.imported }} سجل</div>
        <div class="report-row warning" v-if="importReport.skipped > 0">⚠️ تم تخطي {{ importReport.skipped }} سجل</div>
        <div v-for="err in importReport.errors" :key="err" class="report-row error">❌ {{ err }}</div>
      </div>
    </div>

    <!-- سجل النسخ الاحتياطية -->
    <div class="backup-section">
      <h2 class="sec-title">📋 سجل العمليات</h2>
      <div v-if="backup.logs.length === 0" class="empty-logs">لا توجد عمليات مسجلة</div>
      <div v-else class="logs-list">
        <div v-for="log in backup.logs" :key="log.id" class="log-item" :class="log.status">
          <div class="log-icon">{{ log.status === 'success' ? '✅' : '❌' }}</div>
          <div class="log-info">
            <span class="log-type">{{ logTypeLabel(log.type) }}</span>
            <span class="log-notes">{{ log.notes }}</span>
            <span class="log-date">{{ formatDate(log.created_at) }}</span>
          </div>
          <span class="log-size" v-if="log.size">{{ formatSize(log.size) }}</span>
        </div>
      </div>
    </div>

    <!-- تأكيد الاستعادة -->
    <AppConfirm
      v-if="showRestoreConfirm"
      title="تأكيد الاستعادة"
      message="سيتم استبدال جميع البيانات الحالية بالنسخة المختارة. هل أنت متأكد؟"
      confirm-label="استعادة"
      type="warning"
      @confirm="doRestore"
      @cancel="showRestoreConfirm = false"
    />

  </div>
</template>

<script setup>
import { ref, onMounted }    from 'vue'
import { useBackupStore }    from '@/stores/backup.js'
import { useSettingsStore }  from '@/stores/settings.js'
import { useOnlineStatus }   from '@/composables/useOnlineStatus.js'
import { useToast }          from '@/composables/useToast.js'
import AppConfirm            from '@/components/common/AppConfirm.vue'

const backup   = useBackupStore()
const settings = useSettingsStore()
const toast    = useToast()
const { isOnline } = useOnlineStatus()

const showGithubSettings = ref(false)
const showToken          = ref(false)
const savingGithub       = ref(false)
const githubBackupsList  = ref([])
const showRestoreConfirm = ref(false)
const restoringFilename  = ref('')
const importReport       = ref(null)
const importFileRef      = ref(null)
const externalImportRef  = ref(null)

const githubForm = ref({
  token:    '',
  username: '',
  repo:     '',
  folder:   'backups',
})

onMounted(async () => {
  await settings.loadSettings()
  await backup.loadLogs()
  githubForm.value = {
    token:    settings.githubToken,
    username: settings.githubUsername,
    repo:     settings.githubRepo,
    folder:   settings.githubFolder || 'backups',
  }
})

async function doLocalBackup() {
  const filename = await backup.backupLocally()
  toast.success(`تم حفظ النسخة: ${filename}`)
}

function triggerImport() { importFileRef.value?.click() }

async function onImportFile(e) {
  const file = e.target.files[0]
  if (!file) return
  const ok = await backup.restoreFromFile(file)
  if (ok) toast.success('تم استعادة البيانات بنجاح')
  else    toast.error('فشل في استعادة البيانات: ' + backup.error)
  e.target.value = ''
}

async function saveGithubSettings() {
  savingGithub.value = true
  try {
    await settings.saveAll({
      github_token:    githubForm.value.token,
      github_username: githubForm.value.username,
      github_repo:     githubForm.value.repo,
      github_folder:   githubForm.value.folder,
    })
    showGithubSettings.value = false
    toast.success('تم حفظ إعدادات GitHub')
  } finally {
    savingGithub.value = false
  }
}

async function doUpload() {
  if (!isOnline.value) return
  const ok = await backup.uploadToGitHub()
  if (ok) toast.success('تم الرفع إلى GitHub بنجاح')
  else    toast.error('فشل الرفع: ' + backup.error)
}

async function loadGithubBackups() {
  if (!isOnline.value) return
  githubBackupsList.value = await backup.listGitHubBackups()
  if (githubBackupsList.value.length === 0)
    toast.info('لا توجد نسخ على GitHub')
}

function confirmRestore(filename) {
  restoringFilename.value = filename
  showRestoreConfirm.value = true
}

async function doRestore() {
  showRestoreConfirm.value = false
  const ok = await backup.restoreFromGitHub(restoringFilename.value)
  if (ok) toast.success('تم استعادة البيانات من GitHub')
  else    toast.error('فشل الاستعادة: ' + backup.error)
}

function triggerExternalImport() { externalImportRef.value?.click() }

async function onExternalImport(e) {
  const file = e.target.files[0]
  if (!file) return
  importReport.value = await backup.importExternalJSON(file)
  if (importReport.value.imported > 0)
    toast.success(`تم استيراد ${importReport.value.imported} سجل`)
  else
    toast.warning('لم يتم استيراد أي بيانات')
  e.target.value = ''
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024)       return bytes + ' B'
  if (bytes < 1024*1024)  return (bytes/1024).toFixed(1) + ' KB'
  return (bytes/1024/1024).toFixed(1) + ' MB'
}

function formatDate(d) {
  return d ? new Date(d).toLocaleString('ar-SA') : ''
}

function logTypeLabel(t) {
  return { github:'GitHub', local:'محلي', restore:'استعادة' }[t] ?? t
}
</script>

<style scoped>
.backup-view { display: flex; flex-direction: column; min-height: 100%; gap: 0; }

.page-header {
  background: var(--bg-secondary); padding: 14px;
  border-bottom: 1px solid var(--border-color);
}
.page-header h1 { font-size: 1.2rem; font-weight: 800; color: var(--text-primary); }

.connection-banner {
  display: flex; align-items: center; gap: 8px; padding: 10px 14px;
  font-size: 0.85rem; font-weight: 600;
}
.connection-banner.online  { background: rgba(16,185,129,0.08); color: #34D399; }
.connection-banner.offline { background: rgba(239,68,68,0.08);  color: #F87171; }

.backup-section {
  background: var(--bg-secondary); margin: 8px; border-radius: 14px;
  padding: 14px; border: 1px solid var(--border-color);
  display: flex; flex-direction: column; gap: 12px;
}

.sec-header { display: flex; align-items: center; justify-content: space-between; }
.sec-title  { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
.sec-desc   { font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; }

.btn-edit-github {
  font-size: 0.8rem; color: #60A5FA; background: rgba(59,130,246,0.08);
  border: 1px solid rgba(59,130,246,0.2); border-radius: 8px;
  padding: 5px 12px; cursor: pointer; font-family: 'Cairo', sans-serif;
}

/* بطاقات الإجراءات */
.action-cards { display: flex; flex-direction: column; gap: 8px; }

.action-card {
  display: flex; align-items: center; gap: 12px; padding: 14px;
  background: rgba(255,255,255,0.03); border: 1px solid var(--border-color);
  border-radius: 12px; cursor: pointer; transition: all 0.2s;
}
.action-card:hover { border-color: rgba(59,130,246,0.3); transform: translateX(-2px); }
.action-card.disabled { opacity: 0.5; cursor: not-allowed; }
.action-card.disabled:hover { transform: none; border-color: var(--border-color); }

.ac-icon { font-size: 1.5rem; flex-shrink: 0; }
.ac-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.ac-body strong { font-size: 0.875rem; font-weight: 700; color: var(--text-primary); }
.ac-body span   { font-size: 0.72rem; color: var(--text-muted); }
.ac-arrow { font-size: 1.1rem; color: var(--text-muted); }

/* نموذج GitHub */
.github-form { display: flex; flex-direction: column; gap: 12px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); }

.form-input {
  width: 100%; padding: 11px 14px; background: var(--bg-input);
  border: 1.5px solid var(--border-input); border-radius: 11px;
  color: var(--text-primary); font-family: 'Cairo', sans-serif;
  font-size: 0.875rem; outline: none; -webkit-appearance: none;
  transition: border-color 0.2s;
}
.form-input:focus { border-color: var(--primary,#3B82F6); }

.pwd-wrap { position: relative; display: flex; align-items: center; }
.pwd-wrap .form-input { padding-left: 44px; }
.pwd-toggle {
  position: absolute; left: 12px; background: none; border: none;
  cursor: pointer; font-size: 1rem; line-height: 1;
}

.btn-save-github {
  padding: 12px; border: none; border-radius: 11px;
  background: linear-gradient(135deg,#1D4ED8,#1E40AF); color: white;
  font-family: 'Cairo', sans-serif; font-size: 0.9rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
}
.btn-save-github:disabled { opacity: 0.5; }

.github-status {
  display: flex; flex-direction: column; gap: 2px; padding: 10px 14px;
  border-radius: 10px; border: 1px solid;
}
.github-status.configured     { background: rgba(16,185,129,0.06); border-color: rgba(16,185,129,0.2); color: #34D399; }
.github-status.not-configured { background: rgba(245,158,11,0.06); border-color: rgba(245,158,11,0.2); color: #FBBF24; }
.github-repo-name { font-size: 0.75rem; font-family: monospace; opacity: 0.7; }

/* قائمة نسخ GitHub */
.github-backups-list { display: flex; flex-direction: column; gap: 6px; }
.list-title { font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); }

.backup-file-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; background: rgba(255,255,255,0.02);
  border: 1px solid var(--border-color); border-radius: 10px;
}
.file-info { display: flex; flex-direction: column; gap: 2px; }
.file-name { font-size: 0.8rem; font-family: monospace; color: var(--text-primary); }
.file-size { font-size: 0.7rem; color: var(--text-muted); }

.btn-restore {
  padding: 7px 14px; border-radius: 8px; border: 1px solid rgba(59,130,246,0.3);
  background: rgba(59,130,246,0.08); color: #60A5FA; font-family: 'Cairo', sans-serif;
  font-size: 0.8rem; cursor: pointer; white-space: nowrap;
  transition: all 0.15s;
}
.btn-restore:disabled { opacity: 0.5; cursor: not-allowed; }

/* استيراد خارجي */
.btn-import-external {
  padding: 12px; border: 1.5px dashed rgba(59,130,246,0.4);
  border-radius: 11px; background: rgba(59,130,246,0.04); color: #60A5FA;
  font-family: 'Cairo', sans-serif; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; text-align: center; width: 100%; transition: all 0.2s;
}
.btn-import-external:hover { background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.6); }

.import-report { display: flex; flex-direction: column; gap: 4px; }
.report-row {
  padding: 8px 12px; border-radius: 8px; font-size: 0.82rem;
}
.report-row.success { background: rgba(16,185,129,0.08); color: #34D399; }
.report-row.warning { background: rgba(245,158,11,0.08); color: #FBBF24; }
.report-row.error   { background: rgba(239,68,68,0.08);  color: #FCA5A5; }

/* سجل النسخ */
.empty-logs { font-size: 0.82rem; color: var(--text-muted); text-align: center; padding: 16px; }
.logs-list  { display: flex; flex-direction: column; gap: 6px; }

.log-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border-radius: 10px; border: 1px solid var(--border-color);
}
.log-item.success { border-color: rgba(16,185,129,0.2); }
.log-item.failed  { border-color: rgba(239,68,68,0.2); }

.log-icon  { font-size: 1.2rem; flex-shrink: 0; }
.log-info  { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.log-type  { font-size: 0.82rem; font-weight: 700; color: var(--text-primary); }
.log-notes { font-size: 0.72rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.log-date  { font-size: 0.68rem; color: var(--text-muted); }
.log-size  { font-size: 0.72rem; color: var(--text-muted); flex-shrink: 0; }

.spinner-sm {
  width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite;
}
.spinner-sm.dark {
  border: 2px solid rgba(59,130,246,0.2); border-top-color: #3B82F6;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>