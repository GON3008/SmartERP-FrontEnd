<template>
  <div class="login-container">
    <div class="floating-shapes">
      <div class="shape cube-1"></div>
      <div class="shape cube-2"></div>
      <div class="shape hexagon-1"></div>
      <div class="shape hexagon-2"></div>
    </div>
    
    <div class="login-box">
      <div class="login-header">
        <h1 class="login-title">{{ appTitle }}</h1>
        <p class="login-subtitle">Đăng nhập vào hệ thống</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="Email hoặc tên đăng nhập"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="Mật khẩu"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="loginForm.remember">
            Ghi nhớ đăng nhập
          </el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const appTitle = import.meta.env.VITE_APP_TITLE
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  email: '',
  password: '',
  remember: false
})

const loginRules = {
  email: [
    { required: true, message: 'Vui lòng nhập email hoặc tên đăng nhập', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Vui lòng nhập mật khẩu', trigger: 'blur' },
    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự', trigger: 'blur' }
  ]
}

// Load remembered credentials khi component được mount
onMounted(() => {
  const remembered = authStore.getRememberedCredentials()
  if (remembered.rememberMe) {
    loginForm.email = remembered.email
    loginForm.remember = true
  }
})

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await authStore.login({
          email: loginForm.email,
          password: loginForm.password,
          remember: loginForm.remember
        })
        ElMessage.success('Đăng nhập thành công!')
        const redirect = route.query.redirect || '/'
        router.push(redirect)
      } catch (error) {
        console.error('Login error:', error)
        ElMessage.error(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 3%;
  min-height: 100vh;
  padding: 20px;
  position: relative;
  overflow: hidden;

  // ✅ Background image - lưu ảnh tại src/assets/images/login-bg.png
  background-image: url('@/assets/images/login-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  // ✅ Gradient overlay giữ theme ERP tím-xanh
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(135deg,
        rgba(30, 58, 138, 0.82) 0%,
        rgba(91, 33, 182, 0.72) 35%,
        rgba(124, 58, 237, 0.62) 60%,
        rgba(13, 148, 136, 0.72) 100%
      ),
      radial-gradient(circle at 15% 30%, rgba(124, 58, 237, 0.35) 0%, transparent 45%),
      radial-gradient(circle at 85% 70%, rgba(13, 148, 136, 0.30) 0%, transparent 45%);
    animation: gradientPulse 20s ease-in-out infinite;
    z-index: 1;
  }

  // ✅ Grid + hexagon pattern
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(30deg, rgba(255, 255, 255, 0.04) 12%, transparent 12.5%, transparent 87%, rgba(255, 255, 255, 0.04) 87.5%),
      linear-gradient(150deg, rgba(255, 255, 255, 0.04) 12%, transparent 12.5%, transparent 87%, rgba(255, 255, 255, 0.04) 87.5%),
      linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
      linear-gradient(0deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
    background-size: 80px 140px, 80px 140px, 40px 40px, 40px 40px;
    background-position: 0 0, 40px 70px, 0 0, 0 0;
    z-index: 2;
  }
}

// ✅ Floating shapes
.floating-shapes {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;

  .shape {
    position: absolute;
    animation: float 20s infinite ease-in-out;

    &.cube-1 {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(13, 148, 136, 0.25));
      top: 10%;
      left: 10%;
      transform: rotate(45deg);
      animation-delay: 0s;
      border-radius: 10px;
      opacity: 0.2;
    }

    &.cube-2 {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, rgba(30, 58, 138, 0.25), rgba(124, 58, 237, 0.25));
      top: 60%;
      right: 15%;
      transform: rotate(25deg);
      animation-delay: 5s;
      border-radius: 8px;
      opacity: 0.2;
    }

    &.hexagon-1 {
      width: 120px;
      height: 120px;
      background: linear-gradient(135deg, rgba(13, 148, 136, 0.2), rgba(6, 182, 212, 0.2));
      top: 70%;
      left: 20%;
      clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
      animation-delay: 10s;
      opacity: 0.25;
    }

    &.hexagon-2 {
      width: 90px;
      height: 90px;
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(30, 58, 138, 0.2));
      top: 20%;
      right: 20%;
      clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
      animation-delay: 15s;
      opacity: 0.25;
    }
  }
}

@keyframes gradientPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-30px) rotate(5deg); }
  50% { transform: translateY(-60px) rotate(-5deg); }
  75% { transform: translateY(-30px) rotate(3deg); }
}

.login-box {
  width: 100%;
  max-width: 440px;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(30px) saturate(180%);
  border-radius: 24px;
  padding: 48px;
  box-shadow:
    0 25px 70px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.2) inset,
    0 0 100px rgba(124, 58, 237, 0.2);
  position: relative;
  z-index: 10;
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);

  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(13, 148, 136, 0.3));
    border-radius: 24px;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::before {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-title {
  font-size: 34px;
  font-weight: 800;
  background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #0d9488 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
  letter-spacing: -1px;
}

.login-subtitle {
  font-size: 15px;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.login-form {
  .el-form-item {
    margin-bottom: 24px;
  }

  :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.25) inset;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 12px;
    padding: 12px 16px;

    &:hover {
      box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.4) inset;
      background: rgba(124, 58, 237, 0.02);
    }

    &.is-focus {
      box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.5) inset;
      background: rgba(124, 58, 237, 0.03);
    }
  }
}

.login-button {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #7c3aed 0%, #0d9488 100%);
  border: none;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s ease;
  }

  &:hover {
    background: linear-gradient(135deg, #8b5cf6 0%, #14b8a6 100%);
    transform: translateY(-3px);
    box-shadow: 0 12px 30px rgba(124, 58, 237, 0.5);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
  }
}

@media (max-width: 480px) {
  .login-box {
    padding: 36px 28px;
    max-width: 100%;
    border-radius: 20px;
  }

  .login-title { font-size: 28px; }
  .login-subtitle { font-size: 14px; }

  .floating-shapes .shape {
    display: none;
  }
}
</style>