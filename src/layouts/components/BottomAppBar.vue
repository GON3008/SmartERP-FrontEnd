<template>
  <div class="bottom-app-bar" v-if="isMobile">
    <nav class="nav-container">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ 'is-active': isActive(item.path) }"
      >
        <el-icon :size="24">
          <component :is="item.icon" />
        </el-icon>
        <span class="nav-label">{{ $t(item.label) }}</span>
      </router-link>

      <!-- More menu -->
      <el-dropdown trigger="click" placement="top" @command="handleCommand">
        <div class="nav-item" :class="{ 'is-active': isMoreActive }">
          <el-icon :size="24">
            <MoreFilled />
          </el-icon>
          <span class="nav-label">{{ $t('nav.more') }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="/warehouses">
              <el-icon><OfficeBuilding /></el-icon>
              {{ $t('nav.warehouse') }}
            </el-dropdown-item>
            <el-dropdown-item command="/employees">
              <el-icon><Avatar /></el-icon>
              {{ $t('nav.hr') }}
            </el-dropdown-item>
            <el-dropdown-item command="/reports">
              <el-icon><PieChart /></el-icon>
              {{ $t('nav.reports') }}
            </el-dropdown-item>
            <el-dropdown-item command="/settings">
              <el-icon><Setting /></el-icon>
              {{ $t('nav.settings') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  DataAnalysis,
  User,
  Box,
  Document,
  MoreFilled,
  OfficeBuilding,
  Avatar,
  PieChart,
  Setting
} from '@element-plus/icons-vue'
import { useResponsive } from '@/composables/useResponsive'

const router = useRouter()
const route = useRoute()
const { isMobile } = useResponsive()

const navItems = [
  { path: '/', label: 'nav.dashboard', icon: DataAnalysis },
  { path: '/customers', label: 'nav.customers', icon: User },
  { path: '/products', label: 'nav.products', icon: Box },
  { path: '/orders', label: 'nav.orders', icon: Document }
]

const moreRoutes = ['/warehouses', '/employees', '/reports', '/settings']

const isActive = (path) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const isMoreActive = computed(() => {
  return moreRoutes.some(path => route.path.startsWith(path))
})

const handleCommand = (command) => {
  router.push(command)
}
</script>

<style scoped lang="scss">
.bottom-app-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffffff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 56px;
  padding: 0 8px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 12px;
  border-radius: 12px;
  color: rgba(0, 0, 0, 0.54);
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  min-width: 64px;
  cursor: pointer;

  &:active {
    transform: scale(0.95);
  }

  .nav-label {
    font-size: 11px;
    font-weight: 500;
    line-height: 1;
  }

  &.is-active {
    color: #7c3aed;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 32px;
      height: 3px;
      background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
      border-radius: 0 0 3px 3px;
    }

    .el-icon {
      filter: drop-shadow(0 0 6px rgba(124, 58, 237, 0.4));
    }
  }
}

// Small mobile - hide labels
@media (max-width: 375px) {
  .nav-label {
    display: none;
  }
  
  .nav-item {
    min-width: 48px;
    padding: 8px;
  }
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
}
</style>
