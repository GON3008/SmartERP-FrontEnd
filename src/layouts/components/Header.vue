<template>
  <div class="header-container">
    <div class="header-left">
      <el-icon class="menu-icon" @click="handleToggleSidebar">
        <Expand v-if="isCollapse" />
        <Fold v-else />
      </el-icon>
      
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">Trang chủ</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentRoute">{{ currentRoute }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    
    <div class="header-right">
      <el-badge :value="3" class="notification-badge">
        <el-icon class="header-icon">
          <Bell />
        </el-icon>
      </el-badge>
      
      <el-dropdown @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :src="userAvatar">
            {{ userName.charAt(0) }}
          </el-avatar>
          <span class="user-name">{{ userName }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              Hồ sơ cá nhân
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>
              Cài đặt
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              Đăng xuất
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
import {
  Expand,
  Fold,
  Bell,
  ArrowDown,
  User,
  Setting,
  SwitchButton
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  isCollapse: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-sidebar'])

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const userName = computed(() => authStore.currentUser?.name || 'Admin')
const userAvatar = computed(() => authStore.currentUser?.avatar || '')
const currentRoute = computed(() => route.meta.title || '')

const handleToggleSidebar = () => {
  emit('toggle-sidebar')
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
          'Bạn có chắc chắn muốn đăng xuất?',
          'Xác nhận',
          {
            confirmButtonText: 'Đăng xuất',
            cancelButtonText: 'Hủy',
            type: 'warning'
          }
        )
        
        await authStore.logout()
        ElMessage.success('Đăng xuất thành công')
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
}

.menu-icon {
  font-size: 20px;
  cursor: pointer;
  transition: var(--transition-fast);
  
  &:hover {
    color: var(--primary-color);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
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
</style>
