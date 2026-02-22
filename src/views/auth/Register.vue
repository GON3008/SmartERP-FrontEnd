<template>
  <div class="login-container">
    <div class="floating-shapes">
      <div class="shape cube-1"></div>
      <div class="shape cube-2"></div>
      <div class="shape hexagon-1"></div>
      <div class="shape hexagon-2"></div>
    </div>

    <div class="login-box">
      <!-- Logo -->
      <div class="login-header">
        <div class="logo-wrap">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="url(#lg1)"/>
            <path d="M9 18l5 5 13-13" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <defs>
              <linearGradient id="lg1" x1="0" y1="0" x2="36" y2="36">
                <stop offset="0%" stop-color="#38bdf8"/>
                <stop offset="100%" stop-color="#0284c7"/>
              </linearGradient>
            </defs>
          </svg>
          <h1 class="login-title">Smart<span class="title-accent">ERP</span></h1>
        </div>
        <p class="login-subtitle">Tạo tài khoản mới</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="name">
          <el-input
            v-model="form.name"
            placeholder="Họ và tên"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            placeholder="Email"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="Mật khẩu"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="password_confirmation">
          <el-input
            v-model="form.password_confirmation"
            type="password"
            placeholder="Xác nhận mật khẩu"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleRegister"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button"
            @click="handleRegister"
          >
            {{ loading ? 'Đang đăng ký...' : 'Đăng ký' }}
          </el-button>
        </el-form-item>
      </el-form>

      <p class="back-link">
        Đã có tài khoản?
        <router-link :to="{ name: 'Login' }">Đăng nhập</router-link>
      </p>

      <p class="login-footer">© 2025 SmartERP · Enterprise Resource Planning</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'
import { register as registerApi } from '@/api/auth'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const validateConfirm = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('Mật khẩu xác nhận không khớp'))
  } else {
    callback()
  }
}

const rules = {
  name: [{ required: true, message: 'Vui lòng nhập họ và tên', trigger: 'blur' }],
  email: [
    { required: true, message: 'Vui lòng nhập email', trigger: 'blur' },
    { type: 'email', message: 'Email không hợp lệ', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Vui lòng nhập mật khẩu', trigger: 'blur' },
    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự', trigger: 'blur' },
  ],
  password_confirmation: [
    { required: true, message: 'Vui lòng xác nhận mật khẩu', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

const handleRegister = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await registerApi(form)
        ElMessage.success('Đăng ký thành công! Vui lòng đăng nhập.')
        router.push({ name: 'Login' })
      } catch (error) {
        ElMessage.error(error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
$navy-dark:   #0c1929;
$navy-mid:    #0d2137;
$navy-light:  #162d47;
$cyan:        #0ea5e9;
$cyan-soft:   #38bdf8;

.login-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 100vh;
  padding: 20px 6% 20px 20px;
  position: relative;
  overflow: hidden;
  background-image: url('@/assets/images/login-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(105deg,
        rgba(8, 21, 32, 0.72) 0%,
        rgba(13, 33, 55, 0.65) 45%,
        rgba(10, 22, 38, 0.85) 100%
      ),
      radial-gradient(circle at 20% 50%, rgba(14, 165, 233, 0.07) 0%, transparent 55%);
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(14, 165, 233, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(14, 165, 233, 0.035) 1px, transparent 1px);
    background-size: 48px 48px;
    z-index: 2;
  }
}

.floating-shapes {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;

  .shape {
    position: absolute;
    border-radius: 20px;
    animation: float 24s infinite ease-in-out;
    opacity: 0.06;

    &.cube-1 { width: 320px; height: 320px; top: -80px; left: -80px; background: linear-gradient(135deg, $cyan, #0369a1); animation-delay: 0s; border-radius: 40px; }
    &.cube-2 { width: 200px; height: 200px; bottom: -40px; right: -40px; background: linear-gradient(135deg, $cyan-soft, $cyan); animation-delay: -8s; border-radius: 30px; }
    &.hexagon-1 { width: 150px; height: 150px; top: 50%; right: 10%; background: $cyan-soft; animation-delay: -4s; border-radius: 50%; }
    &.hexagon-2 { width: 100px; height: 100px; top: 20%; left: 15%; background: $cyan; animation-delay: -12s; border-radius: 50%; }
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  33%       { transform: translateY(-25px) rotate(4deg); }
  66%       { transform: translateY(-50px) rotate(-4deg); }
}

.login-box {
  width: 100%;
  max-width: 420px;
  background: rgba(22, 45, 71, 0.75);
  backdrop-filter: blur(24px) saturate(160%);
  border-radius: 20px;
  padding: 44px 40px;
  position: relative;
  z-index: 10;
  animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(56, 189, 248, 0.18);
  box-shadow: 0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(14,165,233,0.1) inset, 0 0 60px rgba(14,165,233,0.08);

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 10%; right: 10%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.6), transparent);
  }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(32px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 10px;
  svg { filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.6)); }
}

.login-title {
  font-size: 28px;
  font-weight: 800;
  color: #e0f4ff;
  letter-spacing: 0.5px;
  margin: 0;
}

.title-accent {
  color: $cyan-soft;
  text-shadow: 0 0 16px rgba(56, 189, 248, 0.7);
}

.login-subtitle {
  font-size: 14px;
  color: rgba(186, 220, 248, 0.6);
  font-weight: 400;
  margin: 0;
}

.login-form {
  .el-form-item { margin-bottom: 18px; }

  :deep(.el-input__wrapper) {
    background: rgba(12, 25, 41, 0.6) !important;
    box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.2) inset !important;
    border-radius: 10px;
    padding: 10px 14px;
    transition: all 0.25s ease;

    &:hover { box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.4) inset !important; }
    &.is-focus { box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.45) inset, 0 0 16px rgba(14, 165, 233, 0.15) !important; }
  }

  :deep(.el-input__inner) {
    color: #e0f4ff !important;
    font-size: 14px;
    &::placeholder { color: rgba(148, 200, 235, 0.45); }
  }

  :deep(.el-input__prefix .el-icon) { color: rgba(56, 189, 248, 0.6); }
  :deep(.el-form-item__error) { color: #f87171; font-size: 12px; }
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 15px;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  transition: all 0.25s ease;
  background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%) !important;
  box-shadow: 0 4px 20px rgba(14, 165, 233, 0.35);

  &:hover {
    background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%) !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(14, 165, 233, 0.5);
  }

  &:active { transform: translateY(0); }
}

.back-link {
  text-align: center;
  margin-top: 16px;
  font-size: 13.5px;
  color: rgba(186, 220, 248, 0.6);

  a {
    color: $cyan-soft;
    text-decoration: none;
    font-weight: 600;
    &:hover { text-decoration: underline; }
  }
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 12px;
  color: rgba(148, 200, 235, 0.35);
}

@media (max-width: 480px) {
  .login-box { padding: 32px 24px; border-radius: 16px; }
  .login-title { font-size: 24px; }
  .floating-shapes .shape { display: none; }
}
</style>
