<template>
  <div class="sidebar-container">
    <div class="logo-container">
      <transition name="fade">
        <h2 v-if="!isCollapse" class="logo-title">SmartERP</h2>
        <h2 v-else class="logo-title-short">SE</h2>
      </transition>
    </div>
    
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapse"
      :collapse-transition="false"
      background-color="#001529"
      text-color="#rgba(255, 255, 255, 0.65)"
      active-text-color="#fff"
      router
    >
      <el-menu-item index="/">
        <el-icon><DataAnalysis /></el-icon>
        <template #title>Tổng quan</template>
      </el-menu-item>
      
      <el-menu-item index="/customers">
        <el-icon><User /></el-icon>
        <template #title>Khách hàng</template>
      </el-menu-item>
      
      <el-menu-item index="/products">
        <el-icon><Box /></el-icon>
        <template #title>Sản phẩm</template>
      </el-menu-item>
      
      <el-menu-item index="/orders">
        <el-icon><Document /></el-icon>
        <template #title>Đơn hàng</template>
      </el-menu-item>
      
      <el-sub-menu index="warehouse">
        <template #title>
          <el-icon><OfficeBuilding /></el-icon>
          <span>Kho hàng</span>
        </template>
        <el-menu-item index="/warehouses">Danh sách kho</el-menu-item>
        <el-menu-item index="/stock-in">Nhập kho</el-menu-item>
        <el-menu-item index="/stock-out">Xuất kho</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="hr">
        <template #title>
          <el-icon><Avatar /></el-icon>
          <span>Nhân sự</span>
        </template>
        <el-menu-item index="/employees">Nhân viên</el-menu-item>
        <el-menu-item index="/attendance">Chấm công</el-menu-item>
        <el-menu-item index="/salaries">Lương</el-menu-item>
      </el-sub-menu>
      
      <el-menu-item index="/reports">
        <el-icon><PieChart /></el-icon>
        <template #title>Báo cáo</template>
      </el-menu-item>
      
      <el-menu-item index="/settings">
        <el-icon><Setting /></el-icon>
        <template #title>Cài đặt</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  DataAnalysis,
  User,
  Box,
  Document,
  OfficeBuilding,
  Avatar,
  PieChart,
  Setting
} from '@element-plus/icons-vue'

defineProps({
  isCollapse: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped lang="scss">
.sidebar-container {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
}

.logo-title {
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
}

.logo-title-short {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.el-menu {
  border-right: none;
}

:deep(.el-menu-item) {
  &:hover {
    background-color: rgba(255, 255, 255, 0.08) !important;
  }
  
  &.is-active {
    background-color: var(--primary-color) !important;
  }
}

:deep(.el-sub-menu__title) {
  &:hover {
    background-color: rgba(255, 255, 255, 0.08) !important;
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
