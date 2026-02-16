<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <el-result
        icon="warning"
        title="404"
        sub-title="Xin lỗi, trang bạn tìm kiếm không tồn tại"
      >
        <template #extra>
          <el-button type="primary" @click="goHome">
            Về trang chủ
          </el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped lang="scss">
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
</style>
