export function useAuthService() {

  async function login(username, password, remember = false) {
    console.warn('[AuthService] login stub', username, remember)
    return { success: false, error: 'Service not implemented' }
  }

  async function logout() {
    console.warn('[AuthService] logout stub')
  }

  async function initSession() {
    console.warn('[AuthService] initSession stub')
    return false
  }

  function hasPermission(permission) {
    console.warn('[AuthService] hasPermission stub', permission)
    return false
  }

  async function changePassword(userId, oldPassword, newPassword) {
    console.warn('[AuthService] changePassword stub', userId)
    return { success: false, error: 'Service not implemented' }
  }

  async function resetPassword(userId, newPassword) {
    console.warn('[AuthService] resetPassword stub', userId)
    return { success: false, error: 'Service not implemented' }
  }

  return {
    login,
    logout,
    initSession,
    hasPermission,
    changePassword,
    resetPassword,
  }
}
