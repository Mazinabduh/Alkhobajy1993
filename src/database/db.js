import Dexie from 'dexie'

export const db = new Dexie('KhubjiElectric')

db.version(1).stores({
  // الإعدادات
  settings: 'key',

  // المستخدمون
  users: '++id, username, role, is_active',

  // المناطق
  zones: '++id, name',

  // المشتركون
  subscribers: '++id, name, phone, meter_number, zone_id, status, created_at',

  // العدادات
  meters: '++id, serial_number, status, subscriber_id',

  // القراءات
  readings: '++id, subscriber_id, meter_id, reading_date, period_month, status',

  // الفواتير
  invoices: '++id, invoice_number, subscriber_id, reading_id, period_month, status, created_at',

  // المدفوعات
  payments: '++id, invoice_id, subscriber_id, payment_date',

  // تصنيفات المخزون
  inventory_categories: '++id, name',

  // المخزون
  inventory_items: '++id, name, category_id, status',

  // حركة المخزون
  inventory_transactions: '++id, item_id, transaction_type, transaction_date',

  // تصنيفات النفقات
  expense_categories: '++id, name',

  // النفقات
  expenses: '++id, category_id, expense_date, created_by',

  // الإشعارات
  notifications: '++id, is_read, created_at',

  // قوالب الرسائل
  message_templates: '++id, name, is_active',

  // سجل الرسائل
  message_logs: '++id, subscriber_id, sent_at',

  // سجل النسخ الاحتياطية
  backup_logs: '++id, type, status, created_at'
})

export default db