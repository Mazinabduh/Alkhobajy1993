import { ref, computed } from 'vue'

const PERMISSIONS_MAP = {
  admin: ['*'],
  accountant: ['invoices.read', 'invoices.write', 'payments.read', 'payments.write', 'subscribers.read', 'reports.read'],
  reader: ['invoices.read', 'subscribers.read', 'readings.read', 'reports.read'],
}

export function usePermissions() {
  const userRole = ref(localStorage.getItem('user-role') || '')
  const customPermissions = ref([])

  const permissions = computed(() => {
    const rolePerms = PERMISSIONS_MAP[userRole.value] || []
    if (rolePerms.includes('*')) return ['*']
    return [...new Set([...rolePerms, ...customPermissions.value])]
  })

  const isAdmin = computed(() => userRole.value === 'admin')

  function hasPermission(permission) {
    if (permissions.value.includes('*')) return true
    return permissions.value.includes(permission)
  }

  function hasAnyPermission(permList) {
    if (permissions.value.includes('*')) return true
    return permList.some(p => permissions.value.includes(p))
  }

  function hasAllPermissions(permList) {
    if (permissions.value.includes('*')) return true
    return permList.every(p => permissions.value.includes(p))
  }

  function setRole(role) {
    userRole.value = role
    localStorage.setItem('user-role', role)
  }

  function setCustomPermissions(perms) {
    customPermissions.value = perms
  }

  function clearPermissions() {
    userRole.value = ''
    customPermissions.value = []
    localStorage.removeItem('user-role')
  }

  return {
    userRole,
    permissions,
    isAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    setRole,
    setCustomPermissions,
    clearPermissions,
  }
}
