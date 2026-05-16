<template>
  <nav class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-logo">⚡</div>
      <h2 class="sidebar-title">محطة الخبجي</h2>
    </div>

    <div class="sidebar-menu">
      <router-link v-for="item in menuItems" :key="item.path" :to="item.path" class="sidebar-link" @click="$emit('close')">
        <span class="link-icon">{{ item.icon }}</span>
        <span class="link-text">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
defineEmits(['close'])

const menuItems = [
  { path: '/', label: 'لوحة التحكم', icon: '📊' },
  { path: '/subscribers', label: 'المشتركون', icon: '👥' },
  { path: '/readings', label: 'القراءات', icon: '📈' },
  { path: '/invoices', label: 'الفواتير', icon: '📄' },
  { path: '/payments', label: 'التحصيلات', icon: '💰' },
  { path: '/arrears', label: 'المتأخرات', icon: '⚠️' },
  { path: '/meters', label: 'العدادات', icon: '⚡' },
  { path: '/inventory', label: 'المخزون', icon: '📦' },
  { path: '/expenses', label: 'النفقات', icon: '💸' },
  { path: '/reports', label: 'التقارير', icon: '📋' },
  { path: '/messages', label: 'الرسائل', icon: '💬' },
  { path: '/users', label: 'المستخدمون', icon: '👤' },
  { path: '/backup', label: 'النسخ الاحتياطي', icon: '💾' },
  { path: '/themes', label: 'المظاهر', icon: '🎨' },
  { path: '/settings', label: 'الإعدادات', icon: '⚙️' },
]
</script>

<style scoped>
.sidebar {
  width: 280px;
  height: 100%;
  background: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-logo {
  width: 40px;
  height: 40px;
  background: rgba(59,130,246,0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.sidebar-menu {
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.15s ease;
}

.sidebar-link:hover,
.sidebar-link.router-link-exact-active {
  background: rgba(59,130,246,0.1);
  color: var(--primary);
}

.link-icon {
  font-size: 1.1rem;
  width: 24px;
  text-align: center;
}
</style>
