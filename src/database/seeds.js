import { db }          from './db.js'
import { hashPassword } from '../utils/crypto.js'

export async function seedDatabase() {
  // التحقق إذا كانت قاعدة البيانات ممتلئة
  const userCount = await db.users.count()
  if (userCount > 0) return

  console.log('🌱 تهيئة قاعدة البيانات...')

  // ─── المستخدم الافتراضي ─────────────────────
  const hashedPassword = await hashPassword('mazin')
  await db.users.add({
    name:        'مازن عبدالوهاب',
    username:    'mazin',
    password:    hashedPassword,
    role:        'admin',
    avatar:      null,
    phone:       '',
    is_active:   1,
    permissions: JSON.stringify([]),   // admin لديه كل شيء
    created_at:  new Date().toISOString(),
    updated_at:  new Date().toISOString()
  })

  // ─── الإعدادات الافتراضية ────────────────────
  const defaultSettings = [
    { key: 'station_name',      value: 'محطة الخبجي الكهربائية' },
    { key: 'station_phone',     value: '' },
    { key: 'station_address',   value: '' },
    { key: 'station_logo',      value: '' },
    { key: 'unit_price',        value: '1.00' },
    { key: 'currency',          value: 'ر.س' },
    { key: 'tax_rate',          value: '0' },
    { key: 'invoice_prefix',    value: 'INV' },
    { key: 'invoice_counter',   value: '1' },
    { key: 'theme_mode',        value: 'dark' },
    { key: 'theme_primary',     value: '#1E40AF' },
    { key: 'theme_secondary',   value: '#F59E0B' },
    { key: 'font_size',         value: 'medium' },
    { key: 'icon_size',         value: 'medium' },
    { key: 'footer_message',    value: 'شكرًا لكم، نسعد بخدمتكم دائمًا' },
    { key: 'github_token',      value: '' },
    { key: 'github_username',   value: '' },
    { key: 'github_repo',       value: '' },
    { key: 'github_folder',     value: 'backups' },
    { key: 'auto_backup',       value: 'false' },
    { key: 'remember_login',    value: 'false' },
    { key: 'app_version',       value: '1.0.0' },
  ]

  await db.settings.bulkPut(defaultSettings)

  // ─── تصنيفات المخزون ────────────────────────
  await db.inventory_categories.bulkAdd([
    { name: 'عدادات',     created_at: new Date().toISOString() },
    { name: 'أسلاك',      created_at: new Date().toISOString() },
    { name: 'وقود',       created_at: new Date().toISOString() },
    { name: 'مواد صيانة', created_at: new Date().toISOString() },
    { name: 'مواد أخرى',  created_at: new Date().toISOString() },
  ])

  // ─── تصنيفات النفقات ────────────────────────
  await db.expense_categories.bulkAdd([
    { name: 'نفقات عامة', created_at: new Date().toISOString() },
    { name: 'وقود',        created_at: new Date().toISOString() },
    { name: 'رواتب',      created_at: new Date().toISOString() },
    { name: 'صيانة',      created_at: new Date().toISOString() },
  ])

  // ─── مناطق افتراضية ─────────────────────────
  await db.zones.bulkAdd([
    { name: 'المنطقة الرئيسية', description: '', created_at: new Date().toISOString() },
    { name: 'المنطقة الشمالية', description: '', created_at: new Date().toISOString() },
    { name: 'المنطقة الجنوبية', description: '', created_at: new Date().toISOString() },
  ])

  // ─── قالب رسالة افتراضي ─────────────────────
  await db.message_templates.add({
    name:       'رسالة الفاتورة الشهرية',
    content:    'عزيزي {subscriber_name}، فاتورة شهر {period}: الاستهلاك {consumption} كيلوواط، المبلغ {total_amount}، المتأخرات {arrears}. {station_name}',
    fields:     JSON.stringify(['subscriber_name', 'period', 'consumption', 'total_amount', 'arrears', 'station_name']),
    is_active:  1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  console.log('✅ تم تهيئة قاعدة البيانات بنجاح')
}