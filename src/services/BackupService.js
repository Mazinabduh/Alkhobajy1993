export function useBackupService() {

  async function createFullBackup() {
    console.warn('[BackupService] createFullBackup stub')
    return '{}'
  }

  async function uploadToGitHub() {
    console.warn('[BackupService] uploadToGitHub stub')
    return false
  }

  async function restoreFromGitHub(filename) {
    console.warn('[BackupService] restoreFromGitHub stub', filename)
    return false
  }

  async function listGitHubBackups() {
    console.warn('[BackupService] listGitHubBackups stub')
    return []
  }

  async function backupLocally() {
    console.warn('[BackupService] backupLocally stub')
    return null
  }

  async function restoreFromFile(file) {
    console.warn('[BackupService] restoreFromFile stub', file)
    return false
  }

  async function importExternalJSON(file) {
    console.warn('[BackupService] importExternalJSON stub', file)
    return { imported: 0, skipped: 0, errors: [] }
  }

  return {
    createFullBackup,
    uploadToGitHub,
    restoreFromGitHub,
    listGitHubBackups,
    backupLocally,
    restoreFromFile,
    importExternalJSON,
  }
}
