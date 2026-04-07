import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

// Lazy loading لجميع الصفحات
const SplashScreen    = () => import('@/views/SplashScreen.vue')
const LoginView       = () => import('@/views/LoginView.vue')
const AppLayout       = () => import('@/components/layout/AppLayout.vue')
const DashboardView   = () => import('@/views/DashboardView.vue')

// المشتركون
const SubscribersView    = () => import('@/views/subscribers/SubscribersView.vue')
const SubscriberForm     = () => import('@/views/subscribers/SubscriberForm.vue')
const SubscriberDetail   = () => import('@/views/subscribers/SubscriberDetail.vue')
const SubscriberStatement = () => import('@/views/subscribers/SubscriberStatement.vue')

// القراءات
const ReadingsView = () => import('@/views/readings/ReadingsView.vue')
const ReadingForm  = () => import('@/views/readings/ReadingForm.vue')

// الفواتير
const InvoicesView  = () => import('@/views/invoices/InvoicesView.vue')
const InvoiceDetail = () => import('@/views/invoices/InvoiceDetail.vue')
const InvoicePrint  = () => import('@/views/invoices/InvoicePrint.vue')

// التحصيل والمتأخرات
const PaymentsView = () => import('@/views/payments/PaymentsView.vue')
const ArrearsView  = () => import('@/views/arrears/ArrearsView.vue')

// المخزون
const InventoryView         = () => import('@/views/inventory/InventoryView.vue')
const InventoryForm         = () => import('@/views/inventory/InventoryForm.vue')
const InventoryTransactions = () => import('@/views/inventory/InventoryTransactions.vue')

// العدادات
const MetersView = () => import('@/views/meters/MetersView.vue')
const MeterForm  = () => import('@/views/meters/MeterForm.vue')

// النفقات
const ExpensesView = () => import('@/views/expenses/ExpensesView.vue')
const ExpenseForm  = () => import('@/views/expenses/ExpenseForm.vue')

// التقارير
const ReportsView  = () => import('@/views/reports/ReportsView.vue')
const ReportDetail = () => import('@/views/reports/ReportDetail.vue')

// الرسائل
const MessagesView   = () => import('@/views/messages/MessagesView.vue')
const MessageTemplates = () => import('@/views/messages/MessageTemplates.vue')

// المستخدمون والصلاحيات
const UsersView       = () => import('@/views/users/UsersView.vue')
const UserForm        = () => import('@/views/users/UserForm.vue')
const PermissionsView = () => import('@/views/users/PermissionsView.vue')

// أخرى
const BackupView   = () => import('@/views/backup/BackupView.vue')
const ThemesView   = () => import('@/views/themes/ThemesView.vue')
const SettingsView = () => import('@/views/settings/SettingsView.vue')

const routes = [
  { path: '/splash', name: 'splash', component: SplashScreen },
  { path: '/login',  name: 'login',  component: LoginView },

  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '',           name: 'dashboard',   component: DashboardView },

      // المشتركون
      { path: 'subscribers',                  name: 'subscribers',         component: SubscribersView },
      { path: 'subscribers/new',              name: 'subscriber-new',      component: SubscriberForm },
      { path: 'subscribers/:id/edit',         name: 'subscriber-edit',     component: SubscriberForm },
      { path: 'subscribers/:id',              name: 'subscriber-detail',   component: SubscriberDetail },
      { path: 'subscribers/:id/statement',    name: 'subscriber-statement',component: SubscriberStatement },

      // القراءات
      { path: 'readings',             name: 'readings',     component: ReadingsView },
      { path: 'readings/new',         name: 'reading-new',  component: ReadingForm },
      { path: 'readings/:id/edit',    name: 'reading-edit', component: ReadingForm },

      // الفواتير
      { path: 'invoices',             name: 'invoices',       component: InvoicesView },
      { path: 'invoices/:id',         name: 'invoice-detail', component: InvoiceDetail },
      { path: 'invoices/:id/print',   name: 'invoice-print',  component: InvoicePrint },

      // التحصيل والمتأخرات
      { path: 'payments', name: 'payments', component: PaymentsView },
      { path: 'arrears',  name: 'arrears',  component: ArrearsView },

      // المخزون
      { path: 'inventory',                    name: 'inventory',          component: InventoryView },
      { path: 'inventory/new',                name: 'inventory-new',      component: InventoryForm },
      { path: 'inventory/:id/edit',           name: 'inventory-edit',     component: InventoryForm },
      { path: 'inventory/:id/transactions',   name: 'inventory-txn',      component: InventoryTransactions },

      // العدادات
      { path: 'meters',           name: 'meters',     component: MetersView },
      { path: 'meters/new',       name: 'meter-new',  component: MeterForm },
      { path: 'meters/:id/edit',  name: 'meter-edit', component: MeterForm },

      // النفقات
      { path: 'expenses',             name: 'expenses',     component: ExpensesView },
      { path: 'expenses/new',         name: 'expense-new',  component: ExpenseForm },
      { path: 'expenses/:id/edit',    name: 'expense-edit', component: ExpenseForm },

      // التقارير
      { path: 'reports',          name: 'reports',       component: ReportsView },
      { path: 'reports/:type',    name: 'report-detail', component: ReportDetail },

      // الرسائل
      { path: 'messages',             name: 'messages',          component: MessagesView },
      { path: 'messages/templates',   name: 'message-templates', component: MessageTemplates },

      // المستخدمون
      { path: 'users',                name: 'users',       component: UsersView },
      { path: 'users/new',            name: 'user-new',    component: UserForm },
      { path: 'users/:id/edit',       name: 'user-edit',   component: UserForm },
      { path: 'users/permissions',    name: 'permissions', component: PermissionsView },

      // أخرى
      { path: 'backup',   name: 'backup',   component: BackupView },
      { path: 'themes',   name: 'themes',   component: ThemesView },
      { path: 'settings', name: 'settings', component: SettingsView },
    ]
  },

  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// حماية المسارات
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.name === 'splash') return true
  if (to.name === 'login')  return true

  if (to.meta.requiresAuth) {
    if (!auth.isLoggedIn) {
      const restored = await auth.initSession()
      if (!restored) return { name: 'login' }
    }
  }

  return true
})

export default router