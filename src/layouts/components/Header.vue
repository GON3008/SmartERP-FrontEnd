<template>
  <div class="header-container">
    <div class="header-left">
      <!-- Mobile: Hamburger for drawer, Desktop: Collapse toggle -->
      <el-icon class="menu-icon" @click="handleToggle">
        <Menu v-if="isMobile" />
        <Expand v-else-if="isCollapse" />
        <Fold v-else />
      </el-icon>
      
      <!-- Hide breadcrumbs on small mobile -->
      <el-breadcrumb v-if="!isSmallMobile" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">{{ $t('nav.home') }}</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentRoute">{{ currentRoute }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div class="header-right">
      <el-badge :value="3" class="notification-badge" v-if="!isSmallMobile">
        <el-icon class="header-icon">
          <Bell />
        </el-icon>
      </el-badge>

      <!-- Language Switcher -->
      <LanguageSwitcher v-if="!isSmallMobile" />
      
      <el-dropdown @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :src="userAvatar">
            {{ userName.charAt(0) }}
          </el-avatar>
          <span class="user-name" v-if="!isMobile">{{ userName }}</span>
          <el-icon v-if="!isMobile"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              {{ $t('header.profile') }}
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              {{ $t('nav.settings') }}
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              {{ $t('header.logout') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  Expand,
  Fold,
  Menu,
  Bell,
  ArrowDown,
  User,
  Setting,
  SwitchButton
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useResponsive } from '@/composables/useResponsive'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const { t } = useI18n()

const props = defineProps({
  isCollapse: {
    type: Boolean,
    default: false
  },
  isMobile: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-sidebar', 'toggle-mobile-drawer'])

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isSmallMobile } = useResponsive()

const userName = computed(() => authStore.currentUser?.name || 'Admin')
const userAvatar = computed(() => authStore.currentUser?.avatar || '')
const currentRoute = computed(() => route.meta.title || '')

const handleToggle = () => {
  if (props.isMobile) {
    emit('toggle-mobile-drawer')
  } else {
    emit('toggle-sidebar')
  }
}

const handleCommand = async (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          t('header.logoutConfirm'),
          t('common.confirm'),
          {
            confirmButtonText: t('header.logout'),
            cancelButtonText: t('common.cancel'),
            type: 'warning'
          }
        )
        
        await authStore.logout()
        ElMessage.success(t('header.logoutSuccess'))
        router.push('/login')
      } catch (error) {
        // User cancelled
      }
      break
  }
}
</script>

<style scoped lang="scss">
.header-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  
  @media (max-width: 640px) {
    gap: 12px;
  }
}

.menu-icon {
  font-size: 20px;
  cursor: pointer;
  transition: var(--transition-fast);
  
  &:hover {
    color: var(--primary-color);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
  
  @media (max-width: 767px) {
    gap: 12px;
  }
}

.notification-badge {
  cursor: pointer;
}

.header-icon {
  font-size: 20px;
  cursor: pointer;
  transition: var(--transition-fast);
  
  &:hover {
    color: var(--primary-color);
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-base);
  transition: var(--transition-fast);
  
  &:hover {
    background-color: var(--bg-page);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.user-name {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-breadcrumb) {
  @media (max-width: 640px) {
    font-size: 13px;
  }
}
</style>
