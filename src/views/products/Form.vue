<template>
  <div class="product-form-container">
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới' }}</h1>
    </div>
    
    <el-card>
      <el-empty description="Form sản phẩm đang được phát triển" />
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isEdit = computed(() => !!route.params.id)
</script>
