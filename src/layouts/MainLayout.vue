<template>
  <el-container class="main-layout">
    <el-aside :width="isCollapse ? '64px' : '240px'" class="sidebar">
      <Sidebar :is-collapse="isCollapse" />
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <Header @toggle-sidebar="toggleSidebar" :is-collapse="isCollapse" />
      </el-header>
      
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'

const isCollapse = ref(false)

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
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
}

.main-content {
  background-color: var(--bg-page);
  padding: 24px;
  min-height: calc(100vh - 60px);
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
