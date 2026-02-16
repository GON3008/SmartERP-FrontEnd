<template>
  <div class="orders-container">
    <div class="page-header flex-between">
      <div>
        <h1 class="page-title">Quản lý đơn hàng</h1>
        <p class="page-description">Danh sách tất cả đơn hàng trong hệ thống</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        Tạo đơn hàng
      </el-button>
    </div>
    
    <el-card>
      <el-empty description="Module đơn hàng đang được phát triển" />
    </el-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()

const handleCreate = () => {
  router.push('/orders/create')
}
</script>
