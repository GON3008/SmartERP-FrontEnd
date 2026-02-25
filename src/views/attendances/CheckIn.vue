<template>
  <el-dialog
    v-model="dialogVisible"
    title="Check-in / Check-out"
    :width="isMobile ? '100%' : '500px'"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
  >
    <!-- Today status banner -->
    <div v-if="todayStatus" class="today-banner">
      <div class="banner-left">
        <el-icon size="20"><Clock /></el-icon>
        <div>
          <div class="banner-label">Hôm nay – {{ currentTime }}</div>
          <div class="banner-sub">Check-in: {{ todayStatus.check_in ?? '—' }} &nbsp;|&nbsp; Check-out: {{ todayStatus.check_out ?? '—' }}</div>
        </div>
      </div>
      <el-tag :type="todayStatus.check_in && !todayStatus.check_out ? 'success' : 'info'" effect="dark">
        {{ todayStatus.check_in && !todayStatus.check_out ? 'Đang làm việc' : todayStatus.check_in ? 'Đã check-out' : 'Chưa check-in' }}
      </el-tag>
    </div>

    <el-tabs v-model="activeTab" class="mt-md">
      <el-tab-pane label="Check-in" name="in">
        <el-form ref="inFormRef" :model="inForm" :rules="formRules" label-width="130px" :label-position="isMobile ? 'top' : 'left'" v-loading="submitting">
          <el-form-item label="Nhân viên" prop="employee_id">
            <el-select v-model="inForm.employee_id" placeholder="Chọn nhân viên" filterable style="width:100%">
              <el-option v-for="e in employees" :key="e.id" :label="e.full_name" :value="e.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="Giờ check-in">
            <el-time-picker v-model="inForm.time" format="HH:mm:ss" value-format="HH:mm:ss" placeholder="Mặc định: hiện tại" style="width:100%" />
          </el-form-item>
          <el-form-item>
            <el-button type="success" size="large" style="width:100%" :loading="submitting" @click="handleCheckIn">
              <el-icon class="mr-1"><AlarmClock /></el-icon> Xác nhận Check-in
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="Check-out" name="out">
        <el-form ref="outFormRef" :model="outForm" :rules="formRules" label-width="130px" :label-position="isMobile ? 'top' : 'left'" v-loading="submitting">
          <el-form-item label="Nhân viên" prop="employee_id">
            <el-select v-model="outForm.employee_id" placeholder="Chọn nhân viên" filterable style="width:100%">
              <el-option v-for="e in employees" :key="e.id" :label="e.full_name" :value="e.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="Giờ check-out">
            <el-time-picker v-model="outForm.time" format="HH:mm:ss" value-format="HH:mm:ss" placeholder="Mặc định: hiện tại" style="width:100%" />
          </el-form-item>
          <el-form-item>
            <el-button type="warning" size="large" style="width:100%" :loading="submitting" @click="handleCheckOut">
              <el-icon class="mr-1"><SwitchButton /></el-icon> Xác nhận Check-out
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="dialogVisible = false">Đóng</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Clock, AlarmClock, SwitchButton } from '@element-plus/icons-vue'
import { checkIn, checkOut, getTodayStatus } from '@/api/attendance'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  employees: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'success'])
const dialogVisible = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

const activeTab = ref('in')
const submitting = ref(false)
const todayStatus = ref(null)
const currentTime = ref('')
let timer = null

const inForm = reactive({ employee_id: null, time: '' })
const outForm = reactive({ employee_id: null, time: '' })
const formRules = { employee_id: [{ required: true, message: 'Chọn nhân viên', trigger: 'change' }] }
const inFormRef = ref(null)
const outFormRef = ref(null)

const updateClock = () => { currentTime.value = new Date().toLocaleTimeString('vi-VN') }

watch(dialogVisible, (val) => {
  if (val) { fetchTodayStatus(); timer = setInterval(updateClock, 1000); updateClock() }
  else { clearInterval(timer) }
})

const fetchTodayStatus = async () => {
  try { const res = await getTodayStatus(); todayStatus.value = res.data ?? null }
  catch { todayStatus.value = null }
}

const handleCheckIn = async () => {
  await inFormRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await checkIn({ employee_id: inForm.employee_id, time: inForm.time || undefined })
      ElMessage.success('Check-in thành công!')
      emit('success'); fetchTodayStatus()
      inForm.employee_id = null; inForm.time = ''
    } catch (err) { ElMessage.error(err.response?.data?.message || err.response?.data?.error || 'Check-in thất bại') }
    finally { submitting.value = false }
  })
}

const handleCheckOut = async () => {
  await outFormRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await checkOut({ employee_id: outForm.employee_id, time: outForm.time || undefined })
      ElMessage.success('Check-out thành công!')
      emit('success'); fetchTodayStatus()
      outForm.employee_id = null; outForm.time = ''
    } catch (err) { ElMessage.error(err.response?.data?.message || err.response?.data?.error || 'Check-out thất bại') }
    finally { submitting.value = false }
  })
}

onUnmounted(() => clearInterval(timer))
</script>

<style scoped lang="scss">
.today-banner {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; background: var(--el-fill-color-light); border-radius: 10px; padding: 12px 16px;
  .banner-left { display: flex; align-items: center; gap: 12px; }
  .banner-label { font-size: 13px; font-weight: 600; }
  .banner-sub { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
}
.mt-md { margin-top: 16px; }
.mr-1 { margin-right: 4px; }
</style>
