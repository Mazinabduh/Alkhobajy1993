import { ref, computed } from 'vue'

export function useAuth() {
  const currentUser = ref(null)
  const isAuthenticated = computed(() => !!currentUser.value)
  const userRole = computed(() => currentUser.value?.role ?? '')
  const userName = computed(() => currentUser.value?.name ?? '')
  const isAdmin = computed(() => currentUser.value?.role === 'admin')

  async function login(username, password, remember = false) {
    console.warn('[useAuth] login stub', username, remember)
    return false
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem('__khubji_remember__')
    sessionStorage.removeItem('__khubji_session__')
  }

  async function initSession() {
    console.warn('[useAuth] initSession stub')
    return false
  }

  function hasPermission(permission) {
    if (!currentUser.value) return false
    if (currentUser.value.role === 'admin') return true
    const perms = JSON.parse(currentUser.value.permissions || '[]')
    return perms.includes(permission)
  }

  return {
    currentUser,
    isAuthenticated,
    userRole,
    userName,
    isAdmin,
    login,
    logout,
    initSession,
    hasPermission,
  }
}
