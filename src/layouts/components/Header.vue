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
      <!-- Notification Bell -->
      <el-popover
        v-if="!isSmallMobile"
        trigger="click"
        placement="bottom-end"
        :width="340"
        popper-class="notif-popover"
        @show="onOpenNotif"
      >
        <template #reference>
          <el-badge
            :value="notif.count.value > 0 ? notif.count.value : ''"
            :max="99"
            class="notification-badge"
          >
            <el-icon class="header-icon bell-icon" :class="{ ringing: notif.count.value > 0 }">
              <Bell />
            </el-icon>
          </el-badge>
        </template>

        <!-- Dropdown panel -->
        <div class="notif-panel">
          <div class="notif-header">
            <span class="notif-title">Thông báo</span>
            <el-tag v-if="notif.count.value > 0" type="danger" size="small" round>{{ notif.count.value }} mới</el-tag>
          </div>

          <div v-loading="notif.loading.value" class="notif-list">
            <template v-if="notif.items.value.length">
              <div
                v-for="item in notif.items.value"
                :key="item.id ?? item.title"
                class="notif-item"
                :class="item.type"
              >
                <el-icon class="notif-icon">
                  <component :is="notifIcon(item.type)" />
                </el-icon>
                <div class="notif-body">
                  <p class="notif-msg">{{ item.message ?? item.title }}</p>
                  <span class="notif-time">{{ item.product_name ?? item.created_at ?? '' }}</span>
                </div>
              </div>
            </template>
            <el-empty v-else :image-size="50" description="Không có thông báo mới" />
          </div>

          <div class="notif-footer">
            <el-button link type="primary" @click="goToNotifications">Xem tất cả</el-button>
          </div>
        </div>
      </el-popover>

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
  Expand, Fold, Menu, Bell, ArrowDown, User,
  Setting, SwitchButton, Warning, ShoppingCart, Box
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useResponsive } from '@/composables/useResponsive'
import { useNotifications } from '@/composables/useNotifications'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const { t } = useI18n()

const props = defineProps({
  isCollapse: { type: Boolean, default: false },
  isMobile:   { type: Boolean, default: false }
})
const emit = defineEmits(['toggle-sidebar', 'toggle-mobile-drawer'])

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const { isSmallMobile } = useResponsive()
const notif = useNotifications(60_000)

const userName    = computed(() => authStore.currentUser?.name || 'Admin')
const userAvatar  = computed(() => authStore.currentUser?.avatar || '')
const currentRoute = computed(() => route.meta.title || '')

const notifIconMap = { warning: Warning, order: ShoppingCart, stock: Box }
const notifIcon = (type) => notifIconMap[type] ?? Warning

const goToNotifications = () => router.push('/notifications')

const onOpenNotif = async () => {
  await notif.refresh()
  notif.clearCount()
}

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

.notification-badge { cursor: pointer; }

.bell-icon {
  font-size: 20px; cursor: pointer; transition: var(--transition-fast);
  &:hover { color: var(--primary-color); }
  &.ringing { animation: ring 1s ease infinite; transform-origin: 50% 0; }
}
@keyframes ring {
  0%,100% { transform: rotate(0deg); }
  20%      { transform: rotate(15deg); }
  40%      { transform: rotate(-12deg); }
  60%      { transform: rotate(8deg); }
  80%      { transform: rotate(-5deg); }
}

// Notification popover (global because it's teleported)
:global(.notif-popover) {
  padding: 0 !important;
  .notif-panel {
    .notif-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid var(--el-border-color-lighter);
      .notif-title { font-weight: 700; font-size: 15px; }
    }
    .notif-list {
      max-height: 340px; overflow-y: auto;
      .notif-item {
        display: flex; gap: 10px; padding: 10px 16px;
        cursor: pointer; transition: background 0.15s;
        border-bottom: 1px solid var(--el-border-color-extra-light);
        &:hover { background: var(--el-fill-color-light); }
        &:last-child { border-bottom: none; }
        .notif-icon { font-size: 18px; flex-shrink: 0; margin-top: 2px; color: var(--el-color-warning); }
        &.order .notif-icon  { color: var(--el-color-primary); }
        &.stock .notif-icon  { color: var(--el-color-danger); }
        .notif-body {
          .notif-msg  { font-size: 13px; margin: 0 0 2px; line-height: 1.4; }
          .notif-time { font-size: 11px; color: var(--el-text-color-secondary); }
        }
      }
    }
    .notif-footer {
      padding: 8px 16px; text-align: center;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }
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
