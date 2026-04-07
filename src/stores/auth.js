import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db }                    from '@/database/db.js'
import { hashPassword, verifyPassword, generateToken, encryptData, decryptData } from '@/utils/crypto.js'

const SESSION_KEY  = '__khubji_session__'
const REMEMBER_KEY = '__khubji_remember__'

export const useAuthStore = defineStore('auth', () => {
  // ─── State ───────────────────────────────────
  const currentUser  = ref(null)
  const sessionToken = ref(null)
  const isLoading    = ref(false)
  const error        = ref(null)

  // ─── Getters ──────────────────────────────────
  const isLoggedIn = computed(() => !!currentUser.value)
  const isAdmin    = computed(() => currentUser.value?.role === 'admin')
  const userName   = computed(() => currentUser.value?.name ?? '')
  const userAvatar = computed(() => currentUser.value?.avatar ?? null)
  const userRole   = computed(() => currentUser.value?.role ?? '')

  // ─── Actions ──────────────────────────────────

  /** تهيئة الجلسة من التخزين المحلي */
  async function initSession() {
    const remembered = localStorage.getItem(REMEMBER_KEY)
    if (remembered) {
      const data = decryptData(remembered)
      if (data?.userId) {
        const user = await db.users.get(data.userId)
        if (user && user.is_active) {
          currentUser.value  = sanitizeUser(user)
          sessionToken.value = data.token
          return true
        }
      }
    }

    const session = sessionStorage.getItem(SESSION_KEY)
    if (session) {
      const data = decryptData(session)
      if (data?.userId) {
        const user = await db.users.get(data.userId)
        if (user && user.is_active) {
          currentUser.value  = sanitizeUser(user)
          sessionToken.value = data.token
          return true
        }
      }
    }

    return false
  }

  /** تسجيل الدخول */
  async function login(username, password, remember = false) {
    isLoading.value = true
    error.value     = null

    try {
      // البحث عن المستخدم
      const user = await db.users
        .where('username').equalsIgnoreCase(username)
        .first()

      if (!user) {
        error.value = 'اسم المستخدم أو كلمة المرور غير صحيحة'
        return false
      }

      if (!user.is_active) {
        error.value = 'هذا الحساب معطل، تواصل مع المدير'
        return false
      }

      // التحقق من كلمة المرور
      const valid = await verifyPassword(password, user.password)
      if (!valid) {
        error.value = 'اسم المستخدم أو كلمة المرور غير صحيحة'
        return false
      }

      // توليد Token
      const token = generateToken()
      const sessionData = encryptData({ userId: user.id, token, role: user.role })

      if (remember) {
        localStorage.setItem(REMEMBER_KEY, sessionData)
        sessionStorage.removeItem(SESSION_KEY)
      } else {
        sessionStorage.setItem(SESSION_KEY, sessionData)
        localStorage.removeItem(REMEMBER_KEY)
      }

      currentUser.value  = sanitizeUser(user)
      sessionToken.value = token
      return true

    } catch (e) {
      console.error('Login error:', e)
      error.value = 'حدث خطأ أثناء تسجيل الدخول'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /** تسجيل الخروج */
  function logout() {
    currentUser.value  = null
    sessionToken.value = null
    localStorage.removeItem(REMEMBER_KEY)
    sessionStorage.removeItem(SESSION_KEY)
  }

  /** التحقق من صلاحية معينة */
  function hasPermission(permission) {
    if (!currentUser.value) return false
    if (currentUser.value.role === 'admin') return true

    const perms = JSON.parse(currentUser.value.permissions || '[]')
    return perms.includes(permission)
  }

  /** إزالة البيانات الحساسة من كائن المستخدم */
  function sanitizeUser(user) {
    const { password, ...safeUser } = user
    return safeUser
  }

  return {
    currentUser, sessionToken, isLoading, error,
    isLoggedIn, isAdmin, userName, userAvatar, userRole,
    initSession, login, logout, hasPermission
  }
})