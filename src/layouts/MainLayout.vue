<template>
  <el-container class="main-layout">
    <!-- Desktop/Tablet Sidebar -->
    <el-aside
      v-if="!isMobile"
      :width="isCollapse ? '64px' : '240px'"
      class="sidebar"
    >
      <Sidebar :is-collapse="isCollapse" />
    </el-aside>

    <!-- Mobile Drawer -->
    <el-drawer
      v-model="mobileDrawerVisible"
      :with-header="false"
      direction="ltr"
      size="280px"
      class="mobile-drawer"
    >
      <Sidebar :is-collapse="false" @menu-click="closeMobileDrawer" />
    </el-drawer>
    
    <el-container>
      <el-header class="header">
        <Header
          @toggle-sidebar="toggleSidebar"
          @toggle-mobile-drawer="toggleMobileDrawer"
          :is-collapse="isCollapse"
          :is-mobile="isMobile"
        />
      </el-header>
      
      <el-main class="main-content" :class="{ 'has-bottom-bar': isMobile }">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>

      <!-- Bottom App Bar for Mobile -->
      <BottomAppBar />
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import BottomAppBar from './components/BottomAppBar.vue'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()

const isCollapse = ref(false)
const mobileDrawerVisible = ref(false)

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

const toggleMobileDrawer = () => {
  mobileDrawerVisible.value = !mobileDrawerVisible.value
}

const closeMobileDrawer = () => {
  mobileDrawerVisible.value = false
}
</script>

<style scoped lang="scss">
.main-layout {
  min-height: 100vh;
}

.sidebar {
  background-color: #001529;
  transition: width 0.3s ease;
  overflow: hidden;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid var(--border-base);
  padding: 0 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  
  @media (max-width: 767px) {
    padding: 0 16px;
    height: 56px;
  }
}

.main-content {
  background-color: var(--bg-page);
  padding: 24px;
  min-height: calc(100vh - 60px);
  
  &.has-bottom-bar {
    padding-bottom: calc(56px + env(safe-area-inset-bottom) + 24px);
    min-height: calc(100vh - 56px - 56px);
  }
  
  @media (max-width: 767px) {
    padding: 16px;
    min-height: calc(100vh - 56px);
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

// Mobile drawer styling
:deep(.mobile-drawer) {
  .el-drawer__body {
    padding: 0;
    background: linear-gradient(180deg,
      #0f172a 0%,
      #1e1b4b 30%,
      #1e1035 65%,
      #0f172a 100%
    );
  }
}
</style>
