<template>
  <el-dialog
    v-model="dialogVisible"
    title="Tính lương nhân viên"
    :width="isMobile ? '100%' : '560px'"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      :label-position="isMobile ? 'top' : 'left'"
      v-loading="loading"
    >
      <el-form-item label="Nhân viên" prop="employee_id">
        <el-select v-model="formData.employee_id" placeholder="Chọn nhân viên" filterable style="width:100%">
          <el-option v-for="e in employees" :key="e.id" :label="e.full_name" :value="e.id" />
        </el-select>
      </el-form-item>

      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="Tháng" prop="month" :label-width="isMobile ? '100%' : '140px'">
            <el-select v-model="formData.month" placeholder="Tháng" style="width:100%">
              <el-option v-for="m in 12" :key="m" :label="`Tháng ${m}`" :value="m" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Năm" prop="year" :label-width="isMobile ? '100%' : '60px'">
            <el-select v-model="formData.year" style="width:100%">
              <el-option v-for="y in yearOptions" :key="y" :label="y" :value="y" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider>Cấu hình lương</el-divider>

      <el-form-item label="Lương cơ bản (₫)" prop="base_salary">
        <el-input-number
          v-model="formData.base_salary" :min="0" :step="100000" :controls="false"
          style="width:100%" placeholder="Nhập lương cơ bản"
          :formatter="(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
          :parser="(v) => v.replace(/,/g, '')"
        />
        <div class="input-hint">{{ formatCurrency(formData.base_salary) }}</div>
      </el-form-item>

      <el-form-item label="Phụ cấp (₫)" prop="allowance">
        <el-input-number
          v-model="formData.allowance" :min="0" :step="50000" :controls="false"
          style="width:100%" placeholder="Tiền phụ cấp"
          :formatter="(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
          :parser="(v) => v.replace(/,/g, '')"
        />
        <div class="input-hint text-success">+{{ formatCurrency(formData.allowance ?? 0) }}</div>
      </el-form-item>

      <el-form-item label="Khấu trừ (₫)" prop="deduction">
        <el-input-number
          v-model="formData.deduction" :min="0" :step="50000" :controls="false"
          style="width:100%" placeholder="Các khoản khấu trừ"
          :formatter="(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
          :parser="(v) => v.replace(/,/g, '')"
        />
        <div class="input-hint text-danger">-{{ formatCurrency(formData.deduction ?? 0) }}</div>
      </el-form-item>

      <!-- Net preview -->
      <div class="net-preview">
        <span class="net-label">Lương thực lĩnh dự tính</span>
        <span class="net-value">{{ formatCurrency(netSalary) }}</span>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Hủy</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          <el-icon class="mr-1"><Checked /></el-icon> Tính & Lưu lương
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Checked } from '@element-plus/icons-vue'
import { calculateSalary } from '@/api/attendance'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  employees: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'success'])
const dialogVisible = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const now = new Date()

const yearOptions = computed(() => {
  const cur = now.getFullYear()
  return [cur - 1, cur, cur + 1]
})

const defaultForm = () => ({
  employee_id: null,
  month: now.getMonth() + 1,
  year: now.getFullYear(),
  base_salary: 0,
  allowance: 0,
  deduction: 0,
})
const formData = reactive(defaultForm())

const formRules = {
  employee_id: [{ required: true, message: 'Chọn nhân viên', trigger: 'change' }],
  month: [{ required: true, message: 'Chọn tháng', trigger: 'change' }],
  year: [{ required: true, message: 'Chọn năm', trigger: 'change' }],
  base_salary: [{ required: true, type: 'number', min: 0, message: 'Nhập lương cơ bản', trigger: 'blur' }],
}

const netSalary = computed(() =>
  (formData.base_salary ?? 0) + (formData.allowance ?? 0) - (formData.deduction ?? 0)
)

const formatCurrency = (v) => v != null ? Number(v).toLocaleString('vi-VN') + ' ₫' : '—'

watch(dialogVisible, (val) => { if (!val) resetForm() })

const handleSubmit = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await calculateSalary({ ...formData })
      ElMessage.success('Tính lương thành công!')
      emit('success'); handleClose()
    } catch (err) { ElMessage.error(err.response?.data?.message || err.response?.data?.error || 'Tính lương thất bại') }
    finally { submitting.value = false }
  })
}

const handleClose = () => { dialogVisible.value = false }
const resetForm = () => { formRef.value?.resetFields(); Object.assign(formData, defaultForm()) }
</script>

<style scoped lang="scss">
.input-hint { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.text-success { color: var(--el-color-success); }
.text-danger { color: var(--el-color-danger); }

.net-preview {
  display: flex; justify-content: space-between; align-items: center;
  background: var(--el-color-primary-light-9); border: 1px solid var(--el-color-primary-light-5);
  border-radius: 10px; padding: 14px 18px; margin-top: 4px;
  .net-label { font-size: 14px; font-weight: 600; color: var(--el-color-primary); }
  .net-value { font-size: 20px; font-weight: 800; color: var(--el-color-primary); }
}

.dialog-footer { display: flex; justify-content: flex-end; gap: 10px;
  @media (max-width: 767px) { flex-direction: column-reverse; .el-button { width: 100%; margin: 0; } }
}
.mr-1 { margin-right: 4px; }
</style>
