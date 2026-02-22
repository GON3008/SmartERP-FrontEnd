<template>
  <div class="profile-page">
    <div class="page-header">
      <div class="page-header__title">
        <el-icon class="page-header__icon"><UserFilled /></el-icon>
        <div>
          <h2>Hồ sơ cá nhân</h2>
          <p>Quản lý thông tin tài khoản của bạn</p>
        </div>
      </div>
    </div>

    <div class="profile-grid">
      <!-- ─── Avatar card ─────────────────────────────── -->
      <div class="profile-card avatar-card">
        <div class="avatar-wrap">
          <el-avatar :size="96" :src="authStore.currentUser?.avatar" class="avatar">
            {{ avatarLetter }}
          </el-avatar>
          <div class="avatar-overlay">
            <el-icon><Camera /></el-icon>
          </div>
        </div>
        <h3 class="profile-name">{{ authStore.currentUser?.name || '—' }}</h3>
        <p class="profile-email">{{ authStore.currentUser?.email || '—' }}</p>

        <div class="profile-meta">
          <div class="meta-item">
            <el-icon><Calendar /></el-icon>
            <span>Tham gia {{ joinDate }}</span>
          </div>
          <div class="meta-item" v-if="authStore.currentUser?.roles?.length">
            <el-icon><Medal /></el-icon>
            <span>{{ authStore.currentUser.roles.join(', ') }}</span>
          </div>
        </div>
      </div>

      <!-- ─── Info form ────────────────────────────────── -->
      <div class="profile-card info-card">
        <div class="card-header">
          <el-icon><EditPen /></el-icon>
          <span>Thông tin cá nhân</span>
        </div>

        <el-form
          ref="infoFormRef"
          :model="infoForm"
          :rules="infoRules"
          label-position="top"
          class="profile-form"
        >
          <div class="form-row">
            <el-form-item label="Họ và tên" prop="name">
              <el-input v-model="infoForm.name" placeholder="Nhập họ và tên" size="large" :prefix-icon="User" />
            </el-form-item>
            <el-form-item label="Email" prop="email">
              <el-input v-model="infoForm.email" placeholder="Email" size="large" :prefix-icon="Message" disabled />
            </el-form-item>
          </div>
          <div class="form-row">
            <el-form-item label="Số điện thoại" prop="phone">
              <el-input v-model="infoForm.phone" placeholder="Nhập số điện thoại" size="large" :prefix-icon="Phone" />
            </el-form-item>
            <el-form-item label="Chức vụ" prop="position">
              <el-input v-model="infoForm.position" placeholder="Nhập chức vụ" size="large" :prefix-icon="Briefcase" />
            </el-form-item>
          </div>

          <div class="form-actions">
            <el-button type="primary" size="large" :loading="infoLoading" @click="handleUpdateInfo" class="save-btn">
              <el-icon><Check /></el-icon>
              Lưu thay đổi
            </el-button>
          </div>
        </el-form>
      </div>

      <!-- ─── Change Password ────────────────────────── -->
      <div class="profile-card password-card">
        <div class="card-header">
          <el-icon><Lock /></el-icon>
          <span>Đổi mật khẩu</span>
        </div>

        <el-form
          ref="pwFormRef"
          :model="pwForm"
          :rules="pwRules"
          label-position="top"
          class="profile-form"
        >
          <el-form-item label="Mật khẩu hiện tại" prop="current_password">
            <el-input
              v-model="pwForm.current_password"
              type="password"
              placeholder="Nhập mật khẩu hiện tại"
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          <div class="form-row">
            <el-form-item label="Mật khẩu mới" prop="password">
              <el-input
                v-model="pwForm.password"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                size="large"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <el-form-item label="Xác nhận mật khẩu mới" prop="password_confirmation">
              <el-input
                v-model="pwForm.password_confirmation"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                size="large"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>
          </div>

          <!-- Strength indicator -->
          <div class="strength-bar" v-if="pwForm.password">
            <div
              v-for="i in 4"
              :key="i"
              class="strength-segment"
              :class="{ active: passwordStrength >= i, [`level-${passwordStrength}`]: passwordStrength >= i }"
            />
            <span class="strength-label">{{ strengthLabel }}</span>
          </div>

          <div class="form-actions">
            <el-button type="primary" size="large" :loading="pwLoading" @click="handleChangePassword" class="save-btn">
              <el-icon><Check /></el-icon>
              Đổi mật khẩu
            </el-button>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  UserFilled, Camera, Calendar, Medal,
  EditPen, User, Message, Phone, Lock, Check, Briefcase
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { changePassword } from '@/api/auth'

const authStore = useAuthStore()

// ─── Avatar & Profile Data ────────────────────────────────────
const avatarLetter = computed(() =>
  (authStore.currentUser?.name || 'U').charAt(0).toUpperCase()
)

const joinDate = computed(() => {
  const createdAt = authStore.currentUser?.created_at
  if (!createdAt) return 'N/A'
  return new Date(createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
})

// ─── Info Form ─────────────────────────────────────────────────
const infoFormRef = ref(null)
const infoLoading = ref(false)

const infoForm = reactive({
  name: '',
  email: '',
  phone: '',
  position: '',
})

const infoRules = {
  name: [{ required: true, message: 'Vui lòng nhập họ và tên', trigger: 'blur' }],
}

onMounted(() => {
  const user = authStore.currentUser
  if (user) {
    infoForm.name = user.name || ''
    infoForm.email = user.email || ''
    infoForm.phone = user.phone || ''
    infoForm.position = user.position || ''
  }
})

const handleUpdateInfo = async () => {
  if (!infoFormRef.value) return
  await infoFormRef.value.validate(async (valid) => {
    if (valid) {
      infoLoading.value = true
      try {
        // TODO: Gọi API cập nhật profile khi backend có endpoint
        // await updateProfile(infoForm)
        // Cập nhật store
        authStore.user = { ...authStore.currentUser, ...infoForm }
        localStorage.setItem('user', JSON.stringify(authStore.user))
        ElMessage.success('Cập nhật thông tin thành công!')
      } catch (error) {
        ElMessage.error(error.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại.')
      } finally {
        infoLoading.value = false
      }
    }
  })
}

// ─── Password Form ─────────────────────────────────────────────
const pwFormRef = ref(null)
const pwLoading = ref(false)

const pwForm = reactive({
  current_password: '',
  password: '',
  password_confirmation: '',
})

// Password strength
const passwordStrength = computed(() => {
  const pw = pwForm.password
  if (!pw) return 0
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
})

const strengthLabel = computed(() => {
  return ['', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'][passwordStrength.value] || ''
})

const validateConfirm = (rule, value, callback) => {
  if (value !== pwForm.password) {
    callback(new Error('Mật khẩu xác nhận không khớp'))
  } else {
    callback()
  }
}

const pwRules = {
  current_password: [{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại', trigger: 'blur' }],
  password: [
    { required: true, message: 'Vui lòng nhập mật khẩu mới', trigger: 'blur' },
    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự', trigger: 'blur' },
  ],
  password_confirmation: [
    { required: true, message: 'Vui lòng xác nhận mật khẩu', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

const handleChangePassword = async () => {
  if (!pwFormRef.value) return
  await pwFormRef.value.validate(async (valid) => {
    if (valid) {
      pwLoading.value = true
      try {
        await changePassword({
          current_password: pwForm.current_password,
          password: pwForm.password,
          password_confirmation: pwForm.password_confirmation,
        })
        ElMessage.success('Đổi mật khẩu thành công!')
        pwFormRef.value.resetFields()
      } catch (error) {
        ElMessage.error(error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại.')
      } finally {
        pwLoading.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
// ─── Page Header ──────────────────────────────────────────────
.page-header {
  margin-bottom: 28px;

  &__title {
    display: flex;
    align-items: center;
    gap: 16px;

    h2 {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 4px;
    }

    p {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
    }
  }

  &__icon {
    font-size: 28px;
    color: var(--primary-color);
    background: rgba(14, 165, 233, 0.1);
    padding: 10px;
    border-radius: 12px;
  }
}

// ─── Grid Layout ──────────────────────────────────────────────
.profile-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: auto auto;
  gap: 24px;

  .avatar-card {
    grid-row: 1 / 3;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;

    .avatar-card {
      grid-row: auto;
    }
  }
}

// ─── Card Base ────────────────────────────────────────────────
.profile-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 28px 24px;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.25s ease;

  &:hover {
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);

  .el-icon {
    font-size: 18px;
    color: var(--primary-color);
  }
}

// ─── Avatar Card ──────────────────────────────────────────────
.avatar-card {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrap {
  position: relative;
  width: 96px;
  margin-bottom: 16px;
  cursor: pointer;

  &:hover .avatar-overlay {
    opacity: 1;
  }
}

.avatar {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #0ea5e9, #0369a1);
  color: #fff;
  box-shadow: 0 4px 16px rgba(14, 165, 233, 0.35);
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  color: #fff;
  font-size: 20px;
}

.profile-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px;
}

.profile-email {
  font-size: 13.5px;
  color: var(--text-secondary);
  margin: 0 0 24px;
}

.profile-meta {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: var(--text-secondary);
  padding: 10px 14px;
  background: var(--bg-page);
  border-radius: 10px;

  .el-icon {
    color: var(--primary-color);
    font-size: 15px;
  }
}

// ─── Profile Form ─────────────────────────────────────────────
.profile-form {
  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    padding-bottom: 6px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    transition: all 0.2s ease;
  }

  :deep(.el-form-item__error) {
    font-size: 12px;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.form-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  min-width: 160px;
  height: 44px;
  font-weight: 600;
  border-radius: 10px;
  background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%) !important;
  border: none !important;
  box-shadow: 0 4px 14px rgba(14, 165, 233, 0.35);
  transition: all 0.25s ease;

  &:hover {
    background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%) !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(14, 165, 233, 0.45);
  }

  &:active {
    transform: translateY(0);
  }
}

// ─── Password Strength ────────────────────────────────────────
.strength-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
}

.strength-segment {
  flex: 1;
  height: 4px;
  border-radius: 4px;
  background: var(--border-color);
  transition: background 0.3s ease;

  &.active {
    &.level-1 { background: #f87171; }
    &.level-2 { background: #fb923c; }
    &.level-3 { background: #facc15; }
    &.level-4 { background: #34d399; }
  }
}

.strength-label {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 60px;
  text-align: right;
  white-space: nowrap;
}
</style>
