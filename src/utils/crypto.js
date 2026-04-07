import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

/**
 * تشفير كلمة المرور
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * التحقق من كلمة المرور
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

/**
 * توليد رمز عشوائي
 */
export function generateToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => chars[byte % chars.length]).join('')
}

/**
 * تشفير بسيط للبيانات الحساسة في LocalStorage
 */
export function encryptData(data, key) {
  const json    = JSON.stringify(data)
  const encoded = btoa(unescape(encodeURIComponent(json)))
  return encoded
}

export function decryptData(encoded) {
  try {
    const json = decodeURIComponent(escape(atob(encoded)))
    return JSON.parse(json)
  } catch {
    return null
  }
}