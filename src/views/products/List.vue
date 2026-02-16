<template>
  <div class="products-container">
    <div class="page-header flex-between">
      <div>
        <h1 class="page-title">Quản lý sản phẩm</h1>
        <p class="page-description">Danh sách tất cả sản phẩm trong hệ thống</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        Thêm sản phẩm
      </el-button>
    </div>
    
    <el-card>
      <el-empty description="Module sản phẩm đang được phát triển" />
    </el-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()

const handleCreate = () => {
  router.push('/products/create')
}
</script>
