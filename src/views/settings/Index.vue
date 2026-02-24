<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="settings-header">
      <div class="header-left">
        <el-icon class="header-icon"><Setting /></el-icon>
        <div>
          <h1 class="page-title">Cài đặt hệ thống</h1>
          <p class="page-sub">Chỉ Super Admin mới có thể truy cập và thay đổi cài đặt này</p>
        </div>
      </div>
      <el-tag type="danger" effect="dark" size="large" round>
        <el-icon><Lock /></el-icon> Super Admin
      </el-tag>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="settings-tabs" type="border-card">

      <!-- ① Hệ thống -->
      <el-tab-pane label="🖥 Hệ thống" name="system">
        <div class="section-grid">
          <el-card class="section-card">
            <template #header><span class="section-title">Thông tin ứng dụng</span></template>
            <el-descriptions :column="1" border label-class-name="desc-label">
              <el-descriptions-item label="Tên hệ thống">SmartERP</el-descriptions-item>
              <el-descriptions-item label="Phiên bản">v1.0.0</el-descriptions-item>
              <el-descriptions-item label="Môi trường">
                <el-tag :type="isDev ? 'warning' : 'success'" size="small">{{ isDev ? 'Development' : 'Production' }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="API Base URL">{{ apiBase }}</el-descriptions-item>
              <el-descriptions-item label="Timezone">Asia/Ho_Chi_Minh (UTC+7)</el-descriptions-item>
              <el-descriptions-item label="Ngôn ngữ mặc định">Tiếng Việt</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card class="section-card">
            <template #header>
              <div style="display:flex;align-items:center;justify-content:space-between">
                <span class="section-title">Trạng thái hệ thống</span>
                <el-button size="small" :icon="Refresh" circle :loading="statusLoading" @click="loadStatus" />
              </div>
            </template>
            <div class="status-grid" v-loading="statusLoading">
              <el-empty v-if="!statusLoading && systemStatus.length === 0" description="Chưa tải" :image-size="50" />
              <div v-for="s in systemStatus" :key="s.label" class="status-item">
                <el-icon :class="s.ok ? 'ok' : 'err'"><component :is="s.ok ? CircleCheck : CircleClose" /></el-icon>
                <span class="status-label">{{ s.label }}</span>
                <span class="status-val">{{ s.value }}</span>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- ② Công ty -->
      <el-tab-pane label="🏢 Công ty" name="company">
        <el-card class="section-card" v-loading="loading">
          <template #header><span class="section-title">Thông tin công ty</span></template>
          <el-form :model="company" label-width="160px" class="settings-form">
            <el-form-item label="Tên công ty">
              <el-input v-model="company.name" placeholder="VD: Công ty TNHH SmartERP" />
            </el-form-item>
            <el-form-item label="Mã số thuế">
              <el-input v-model="company.tax_code" placeholder="0123456789" />
            </el-form-item>
            <el-form-item label="Địa chỉ">
              <el-input v-model="company.address" type="textarea" :rows="2" placeholder="Số nhà, đường, quận, thành phố" />
            </el-form-item>
            <el-form-item label="Số điện thoại">
              <el-input v-model="company.phone" placeholder="0909 000 000" />
            </el-form-item>
            <el-form-item label="Email liên hệ">
              <el-input v-model="company.email" placeholder="contact@company.com" />
            </el-form-item>
            <el-form-item label="Website">
              <el-input v-model="company.website" placeholder="https://company.com" />
            </el-form-item>
            <el-form-item label="Tiền tệ mặc định">
              <el-select v-model="company.currency" style="width:200px">
                <el-option label="VND — Việt Nam Đồng" value="VND" />
                <el-option label="USD — Đô la Mỹ" value="USD" />
                <el-option label="EUR — Euro" value="EUR" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="saveGroup('company', company)">Lưu thay đổi</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- ③ Bảo mật -->
      <el-tab-pane label="🔐 Bảo mật" name="security">
        <div class="section-grid" v-loading="loading">
          <el-card class="section-card">
            <template #header><span class="section-title">Chính sách mật khẩu</span></template>
            <el-form :model="security" label-width="200px" class="settings-form">
              <el-form-item label="Độ dài tối thiểu">
                <el-input-number v-model="security.min_password_length" :min="6" :max="32" />
              </el-form-item>
              <el-form-item label="Yêu cầu chữ hoa">
                <el-switch v-model="security.require_uppercase" />
              </el-form-item>
              <el-form-item label="Yêu cầu số">
                <el-switch v-model="security.require_number" />
              </el-form-item>
              <el-form-item label="Yêu cầu ký tự đặc biệt">
                <el-switch v-model="security.require_special" />
              </el-form-item>
              <el-form-item label="Thời hạn mật khẩu (ngày)">
                <el-input-number v-model="security.password_expiry_days" :min="0" :max="365" />
                <span class="hint">0 = không hết hạn</span>
              </el-form-item>
            </el-form>
          </el-card>

          <el-card class="section-card">
            <template #header><span class="section-title">Phiên đăng nhập</span></template>
            <el-form :model="security" label-width="200px" class="settings-form">
              <el-form-item label="JWT Token TTL (phút)">
                <el-input-number v-model="security.jwt_ttl" :min="15" :max="1440" :step="15" />
              </el-form-item>
              <el-form-item label="Refresh Token (ngày)">
                <el-input-number v-model="security.refresh_ttl_days" :min="1" :max="30" />
              </el-form-item>
              <el-form-item label="Cho phép nhiều phiên">
                <el-switch v-model="security.allow_multiple_sessions" />
              </el-form-item>
              <el-form-item label="Giới hạn đăng nhập sai">
                <el-input-number v-model="security.max_login_attempts" :min="3" :max="20" />
              </el-form-item>
              <el-form-item label="Khóa tài khoản (phút)">
                <el-input-number v-model="security.lockout_duration" :min="5" :max="1440" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="saving" @click="saveGroup('security', security)">Lưu cài đặt bảo mật</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- ④ Email -->
      <el-tab-pane label="📧 Email" name="email">
        <el-card class="section-card" v-loading="loading">
          <template #header><span class="section-title">Cấu hình SMTP</span></template>
          <el-form :model="mail" label-width="180px" class="settings-form">
            <el-form-item label="Driver">
              <el-select v-model="mail.driver" style="width:180px">
                <el-option label="SMTP" value="smtp" />
                <el-option label="Mailgun" value="mailgun" />
                <el-option label="SES (Amazon)" value="ses" />
                <el-option label="Log (Dev only)" value="log" />
              </el-select>
            </el-form-item>
            <el-form-item label="SMTP Host">
              <el-input v-model="mail.host" placeholder="smtp.gmail.com" />
            </el-form-item>
            <el-form-item label="SMTP Port">
              <el-input-number v-model="mail.port" :min="1" :max="65535" />
            </el-form-item>
            <el-form-item label="Encryption">
              <el-select v-model="mail.encryption" style="width:140px">
                <el-option label="TLS" value="tls" />
                <el-option label="SSL" value="ssl" />
                <el-option label="None" value="" />
              </el-select>
            </el-form-item>
            <el-form-item label="Username">
              <el-input v-model="mail.username" placeholder="your@email.com" />
            </el-form-item>
            <el-form-item label="Password">
              <el-input v-model="mail.password" type="password" show-password placeholder="Để trống = giữ nguyên mật khẩu cũ" />
            </el-form-item>
            <el-form-item label="From Name">
              <el-input v-model="mail.from_name" placeholder="SmartERP" />
            </el-form-item>
            <el-form-item label="From Address">
              <el-input v-model="mail.from_address" placeholder="no-reply@smarterp.com" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="saveGroup('mail', mail)">Lưu cấu hình</el-button>
              <el-button :loading="testingMail" @click="openTestDialog">Gửi email test</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- ⑤ Bảo trì -->
      <el-tab-pane label="🔧 Bảo trì" name="maintenance">
        <div class="section-grid">
          <el-card class="section-card danger-zone">
            <template #header>
              <span class="section-title">Chế độ bảo trì</span>
            </template>
            <div class="maintenance-row">
              <div>
                <p class="maint-desc">Khi bật, người dùng thường sẽ thấy trang "Hệ thống đang bảo trì". Chỉ Super Admin vẫn truy cập được.</p>
                <el-alert v-if="maintenance.enabled" type="warning" title="Hệ thống đang ở chế độ bảo trì!" :closable="false" show-icon style="margin-top:10px" />
              </div>
              <el-switch
                v-model="maintenance.enabled"
                :active-text="maintenance.enabled ? 'BẬT' : 'TẮT'"
                active-color="#f56c6c"
                size="large"
                :loading="togglingMaint"
                @change="doToggleMaintenance"
              />
            </div>
            <el-form :model="maintenance" label-width="160px" class="settings-form" style="margin-top:16px">
              <el-form-item label="Thông báo cho user">
                <el-input v-model="maintenance.message" type="textarea" :rows="2" placeholder="Hệ thống đang nâng cấp, vui lòng quay lại sau..." />
              </el-form-item>
              <el-form-item>
                <el-button size="small" @click="saveGroup('maintenance', { message: maintenance.message })">Lưu thông báo</el-button>
              </el-form-item>
            </el-form>
          </el-card>

          <el-card class="section-card">
            <template #header><span class="section-title">Thao tác bảo trì</span></template>
            <div class="action-list">
              <div class="action-item">
                <div class="action-info">
                  <span class="action-label">Xóa cache ứng dụng</span>
                  <span class="action-desc">Xóa config cache, route cache và view cache</span>
                </div>
                <el-button type="warning" :loading="clearingCache" size="small" @click="doClearCache">Xóa cache</el-button>
              </div>
              <div class="action-item">
                <div class="action-info">
                  <span class="action-label">Tối ưu database</span>
                  <span class="action-desc">Chạy ANALYZE TABLE trên các bảng chính</span>
                </div>
                <el-button type="primary" :loading="optimizingDb" size="small" @click="doOptimizeDb">Tối ưu</el-button>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

    </el-tabs>

    <!-- Test Email Dialog -->
    <el-dialog v-model="testEmailDialog" title="Gửi email test" width="420px">
      <el-form label-width="120px">
        <el-form-item label="Email nhận">
          <el-input v-model="testEmailAddr" placeholder="your@email.com" type="email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="testEmailDialog = false">Huỷ</el-button>
        <el-button type="primary" :loading="testingMail" @click="doTestEmail">Gửi</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, Lock, CircleCheck, CircleClose, Refresh } from '@element-plus/icons-vue'
import {
  getSettings, saveSettings, getSystemStatus,
  clearCache, optimizeDb, testEmail, toggleMaintenance,
} from '@/api/settings'
import { clearMaintenanceCache } from '@/router'

// ── State ─────────────────────────────────────────────────────
const activeTab    = ref('system')
const loading      = ref(false)
const saving       = ref(false)
const statusLoading  = ref(false)
const testingMail    = ref(false)
const clearingCache  = ref(false)
const optimizingDb   = ref(false)
const togglingMaint  = ref(false)
const testEmailDialog = ref(false)
const testEmailAddr   = ref('')

const isDev  = import.meta.env.DEV
const apiBase = import.meta.env.VITE_API_BASE_URL ?? '—'

const systemStatus = ref([])

// ── Forms ─────────────────────────────────────────────────────
const company = reactive({
  name: '', tax_code: '', address: '', phone: '',
  email: '', website: '', currency: 'VND',
})

const security = reactive({
  min_password_length: 8, require_uppercase: true, require_number: true,
  require_special: false, password_expiry_days: 0,
  jwt_ttl: 60, refresh_ttl_days: 7, allow_multiple_sessions: false,
  max_login_attempts: 5, lockout_duration: 15,
})

const mail = reactive({
  driver: 'smtp', host: '', port: 587, encryption: 'tls',
  username: '', password: '', from_name: 'SmartERP', from_address: '',
})

const maintenance = reactive({ enabled: false, message: '' })

// ── Load settings from API ────────────────────────────────────
async function loadSettings() {
  loading.value = true
  try {
    const res = await getSettings()
    const data = res.data || res

    if (data.company)     Object.assign(company, data.company)
    if (data.security)    Object.assign(security, data.security)
    if (data.mail) {
      const m = { ...data.mail }
      m.password = '' // never prefill password field
      Object.assign(mail, m)
    }
    if (data.maintenance) Object.assign(maintenance, data.maintenance)
  } catch (e) {
    ElMessage.error('Không tải được cài đặt: ' + (e?.response?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

async function loadStatus() {
  statusLoading.value = true
  try {
    const res = await getSystemStatus()
    systemStatus.value = res.data || res
  } catch {
    ElMessage.error('Không tải được trạng thái hệ thống')
  } finally {
    statusLoading.value = false
  }
}

// ── Save ─────────────────────────────────────────────────────
async function saveGroup(group, values) {
  saving.value = true
  try {
    const res = await saveSettings(group, { ...values })
    ElMessage.success(res.data?.message || 'Đã lưu thành công!')
  } catch (e) {
    ElMessage.error('Lỗi lưu: ' + (e?.response?.data?.message || e.message))
  } finally {
    saving.value = false
  }
}

// ── Maintenance toggle ────────────────────────────────────────
async function doToggleMaintenance(val) {
  const action = val ? 'bật' : 'tắt'
  try {
    await ElMessageBox.confirm(
      `Bạn chắc chắn muốn ${action} chế độ bảo trì?`,
      'Xác nhận', { type: val ? 'warning' : 'info', confirmButtonText: 'Xác nhận', cancelButtonText: 'Huỷ' }
    )
    togglingMaint.value = true
    const res = await toggleMaintenance(val)
    clearMaintenanceCache() // bust router cache so next navigation re-checks immediately
    ElMessage.success(res.data?.message || `Đã ${action} chế độ bảo trì!`)
    maintenance.enabled = val
  } catch (e) {
    if (e === 'cancel' || e?.type === 'cancel') {
      maintenance.enabled = !val // revert
    } else {
      maintenance.enabled = !val
      ElMessage.error('Lỗi: ' + (e?.response?.data?.message || e.message))
    }
  } finally {
    togglingMaint.value = false
  }
}

// ── Cache / DB ────────────────────────────────────────────────
async function doClearCache() {
  clearingCache.value = true
  try {
    const res = await clearCache()
    ElMessage.success(res.data?.message || 'Đã xóa toàn bộ cache!')
  } catch (e) {
    ElMessage.error('Lỗi: ' + (e?.response?.data?.message || e.message))
  } finally {
    clearingCache.value = false
  }
}

async function doOptimizeDb() {
  optimizingDb.value = true
  try {
    const res = await optimizeDb()
    ElMessage.success(res.data?.message || 'Database đã được tối ưu!')
  } catch (e) {
    ElMessage.error('Lỗi: ' + (e?.response?.data?.message || e.message))
  } finally {
    optimizingDb.value = false
  }
}

// ── Test Email ────────────────────────────────────────────────
function openTestDialog() {
  testEmailAddr.value = mail.from_address || ''
  testEmailDialog.value = true
}

async function doTestEmail() {
  if (!testEmailAddr.value) {
    ElMessage.warning('Vui lòng nhập địa chỉ email nhận')
    return
  }
  testingMail.value = true
  try {
    const res = await testEmail(testEmailAddr.value)
    ElMessage.success(res.data?.message || 'Email test đã được gửi!')
    testEmailDialog.value = false
  } catch (e) {
    ElMessage.error('Gửi thất bại: ' + (e?.response?.data?.message || e.message))
  } finally {
    testingMail.value = false
  }
}

onMounted(() => {
  loadSettings()
  loadStatus()
})
</script>

<style scoped lang="scss">
.settings-page {
  max-width: 1100px;
}

.settings-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px; flex-wrap: wrap; gap: 12px;

  .header-left {
    display: flex; align-items: center; gap: 14px;
    .header-icon { font-size: 36px; color: var(--el-color-primary); }
    .page-title  { font-size: 22px; font-weight: 700; margin: 0; }
    .page-sub    { font-size: 13px; color: var(--text-secondary); margin: 0; }
  }
}

.settings-tabs {
  :deep(.el-tabs__content) { padding: 20px; }
  :deep(.el-tab-pane) { min-height: 300px; }
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 16px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
}

.section-card {
  .section-title { font-size: 15px; font-weight: 600; }
  &.danger-zone { border-color: var(--el-color-danger-light-5); }
}

.settings-form {
  .el-form-item { margin-bottom: 16px; }
  .hint { font-size: 12px; color: var(--text-secondary); margin-left: 8px; }
}

:deep(.desc-label) { font-weight: 500; }

.status-grid {
  display: flex; flex-direction: column; gap: 10px;
  .status-item { display: flex; align-items: center; gap: 10px;
    .ok { color: var(--el-color-success); font-size: 18px; }
    .err { color: var(--el-color-danger); font-size: 18px; }
    .status-label { font-weight: 500; flex: 1; }
    .status-val { font-size: 13px; color: var(--text-secondary); }
  }
}

.maintenance-row {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
  .maint-desc { font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; }
}

.action-list { display: flex; flex-direction: column; gap: 12px; }
.action-item {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 12px 0; border-bottom: 1px solid var(--el-border-color-lighter);
  &:last-child { border-bottom: none; }
  .action-info { flex: 1;
    .action-label { display: block; font-weight: 600; font-size: 14px; }
    .action-desc  { font-size: 12px; color: var(--text-secondary); }
  }
}
</style>
