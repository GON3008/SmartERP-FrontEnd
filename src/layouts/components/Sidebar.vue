<template>
  <div class="sidebar-container">
    <div class="logo-container">
      <transition name="fade">
        <div v-if="!isCollapse" class="logo-full">
          <div class="logo-icon">⚡</div>
          <h2 class="logo-title">SmartERP</h2>
        </div>
        <div v-else class="logo-short">
          <div class="logo-icon">⚡</div>
        </div>
      </transition>
    </div>

    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapse"
      :collapse-transition="false"
      background-color="transparent"
      text-color="rgba(255, 255, 255, 0.7)"
      active-text-color="#ffffff"
      router
      class="sidebar-menu"
      @select="handleMenuClick"
    >
      <el-menu-item index="/">
        <el-icon><DataAnalysis /></el-icon>
        <template #title>{{ $t('nav.dashboard') }}</template>
      </el-menu-item>

      <el-menu-item index="/customers">
        <el-icon><User /></el-icon>
        <template #title>{{ $t('nav.customers') }}</template>
      </el-menu-item>

      <el-menu-item index="/products">
        <el-icon><Box /></el-icon>
        <template #title>{{ $t('nav.products') }}</template>
      </el-menu-item>

      <el-menu-item index="/orders">
        <el-icon><Document /></el-icon>
        <template #title>{{ $t('nav.orders') }}</template>
      </el-menu-item>

      <el-sub-menu index="warehouse">
        <template #title>
          <el-icon><OfficeBuilding /></el-icon>
          <span>{{ $t('nav.warehouse') }}</span>
        </template>
        <el-menu-item index="/warehouses">{{ $t('nav.warehouseList') }}</el-menu-item>
        <el-menu-item index="/stock-in">{{ $t('nav.stockIn') }}</el-menu-item>
        <el-menu-item index="/stock-out">{{ $t('nav.stockOut') }}</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="hr">
        <template #title>
          <el-icon><Avatar /></el-icon>
          <span>{{ $t('nav.hr') }}</span>
        </template>
        <el-menu-item index="/employees">{{ $t('nav.employees') }}</el-menu-item>
        <el-menu-item index="/attendance">{{ $t('nav.attendance') }}</el-menu-item>
        <el-menu-item index="/salaries">{{ $t('nav.salaries') }}</el-menu-item>
      </el-sub-menu>

      <el-menu-item index="/reports">
        <el-icon><PieChart /></el-icon>
        <template #title>{{ $t('nav.reports') }}</template>
      </el-menu-item>

      <el-menu-item index="/settings">
        <el-icon><Setting /></el-icon>
        <template #title>{{ $t('nav.settings') }}</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  DataAnalysis, User, Box, Document,
  OfficeBuilding, Avatar, PieChart, Setting
} from '@element-plus/icons-vue'

defineProps({
  isCollapse: { type: Boolean, default: false }
})

const emit = defineEmits(['menu-click'])

const route = useRoute()
const activeMenu = computed(() => route.path)

// Emit event when menu item is clicked (for mobile drawer)
const handleMenuClick = () => {
  emit('menu-click')
}
</script>

<style scoped lang="scss">
.sidebar-container {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  
  // ✅ Gradient navy → tím sang trọng
  background: linear-gradient(180deg,
    #0f172a 0%,
    #1e1b4b 30%,
    #1e1035 65%,
    #0f172a 100%
  );
  
  // Subtle glow effect bên phải
  box-shadow: 4px 0 24px rgba(124, 58, 237, 0.15);
  position: relative;
  
  // Decorative gradient line bên phải
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 1px;
    height: 100%;
    background: linear-gradient(180deg,
      transparent 0%,
      rgba(124, 58, 237, 0.6) 30%,
      rgba(99, 102, 241, 0.6) 70%,
      transparent 100%
    );
  }

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(124, 58, 237, 0.4);
    border-radius: 2px;
  }
}

// ✅ Logo area
.logo-container {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 8px;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: linear-gradient(90deg,
      transparent,
      rgba(124, 58, 237, 0.6),
      rgba(99, 102, 241, 0.6),
      transparent
    );
  }
}

.logo-full {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 22px;
  filter: drop-shadow(0 0 8px rgba(124, 58, 237, 0.8));
}

.logo-title {
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 1.5px;
  background: linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #67e8f9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-short {
  display: flex;
  align-items: center;
  justify-content: center;
}

// ✅ Menu styling
.sidebar-menu {
  border-right: none !important;
  background: transparent !important;
  padding: 8px 10px;
}

:deep(.el-menu) {
  background: transparent !important;
}

:deep(.el-menu-item) {
  border-radius: 10px;
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.65) !important;
  transition: all 0.25s ease;
  height: 46px;
  line-height: 46px;

  .el-icon {
    font-size: 18px;
    transition: all 0.25s ease;
  }

  &:hover {
    background: rgba(124, 58, 237, 0.15) !important;
    color: rgba(255, 255, 255, 0.95) !important;
    
    .el-icon {
      color: #a78bfa !important;
      filter: drop-shadow(0 0 6px rgba(167, 139, 250, 0.6));
    }
  }

  &.is-active {
    background: linear-gradient(135deg,
      rgba(124, 58, 237, 0.5) 0%,
      rgba(99, 102, 241, 0.4) 100%
    ) !important;
    color: #ffffff !important;
    box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3),
                inset 0 0 0 1px rgba(167, 139, 250, 0.3);

    .el-icon {
      color: #a78bfa !important;
      filter: drop-shadow(0 0 8px rgba(167, 139, 250, 0.8));
    }

    // Active indicator line bên trái
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 60%;
      background: linear-gradient(180deg, #a78bfa, #818cf8);
      border-radius: 0 3px 3px 0;
    }
  }
}

:deep(.el-sub-menu__title) {
  border-radius: 10px;
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.65) !important;
  transition: all 0.25s ease;
  height: 46px;
  line-height: 46px;

  .el-icon {
    font-size: 18px;
    transition: all 0.25s ease;
  }

  .el-sub-menu__icon-arrow {
    color: rgba(255, 255, 255, 0.4) !important;
  }

  &:hover {
    background: rgba(124, 58, 237, 0.15) !important;
    color: rgba(255, 255, 255, 0.95) !important;

    .el-icon {
      color: #a78bfa !important;
    }
  }
}

// Sub-menu popup background
:deep(.el-sub-menu .el-menu) {
  background: rgba(15, 23, 42, 0.8) !important;
  backdrop-filter: blur(10px);
  padding: 4px 0;
  
  .el-menu-item {
    height: 40px;
    line-height: 40px;
    padding-left: 52px !important;
    font-size: 13px;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.55) !important;

    &:hover {
      background: rgba(124, 58, 237, 0.15) !important;
      color: rgba(255, 255, 255, 0.9) !important;
    }

    &.is-active {
      color: #a78bfa !important;
      background: rgba(124, 58, 237, 0.2) !important;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>