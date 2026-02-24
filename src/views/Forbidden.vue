<template>
  <div class="forbidden-page">
    <div class="forbidden-content">
      <div class="lock-icon">🔒</div>
      <h1 class="code">403</h1>
      <h2 class="title">Không có quyền truy cập</h2>
      <p class="desc">Trang này chỉ dành cho <strong>Super Admin</strong>.<br>Tài khoản của bạn không có quyền truy cập.</p>
      <div class="actions">
        <el-button type="primary" @click="$router.push('/')">Về trang chủ</el-button>
        <el-button @click="$router.back()">Quay lại</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.forbidden-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: var(--bg-page, #f5f7fa);
}
.forbidden-content {
  text-align: center; padding: 40px;
  .lock-icon { font-size: 64px; margin-bottom: 8px; }
  .code  { font-size: 80px; font-weight: 900; color: var(--el-color-danger); margin: 0; line-height: 1; }
  .title { font-size: 22px; font-weight: 700; margin: 8px 0; }
  .desc  { color: var(--text-secondary, #666); font-size: 15px; line-height: 1.7; margin-bottom: 24px; }
  .actions { display: flex; gap: 12px; justify-content: center; }
}
</style>
