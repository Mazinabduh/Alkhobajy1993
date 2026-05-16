export function useGitHubService() {

  async function getRepoContents(path = '') {
    console.warn('[GitHubService] getRepoContents stub', path)
    return []
  }

  async function uploadFile(path, content, message = '') {
    console.warn('[GitHubService] uploadFile stub', path, message)
    return null
  }

  async function downloadFile(path) {
    console.warn('[GitHubService] downloadFile stub', path)
    return null
  }

  async function deleteFile(path, message = '') {
    console.warn('[GitHubService] deleteFile stub', path, message)
    return null
  }

  async function listBackups(folder = 'backups') {
    console.warn('[GitHubService] listBackups stub', folder)
    return []
  }

  return {
    getRepoContents,
    uploadFile,
    downloadFile,
    deleteFile,
    listBackups,
  }
}
