<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'"
    :width="isMobile ? '100%' : '680px'"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-width="isMobile ? '100%' : '150px'"
      :label-position="isMobile ? 'top' : 'left'"
      v-loading="loading"
    >
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-form-item label="Mã nhân viên" prop="employee_code">
            <el-input v-model="formData.employee_code" placeholder="VD: NV001" clearable :disabled="isEdit" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="Họ và tên" prop="full_name">
            <el-input v-model="formData.full_name" placeholder="Nhập họ tên" clearable />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-form-item label="Phòng ban" prop="department_id">
            <el-select v-model="formData.department_id" placeholder="Chọn phòng ban" filterable style="width:100%" :loading="loadingDepts">
              <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="Chức vụ" prop="position_id">
            <el-select v-model="formData.position_id" placeholder="Chọn chức vụ" filterable style="width:100%" :loading="loadingPositions">
              <el-option v-for="p in positions" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-form-item label="Email" prop="email">
            <el-input v-model="formData.email" placeholder="email@company.com" clearable type="email" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="Số điện thoại" prop="phone">
            <el-input v-model="formData.phone" placeholder="0912345678" clearable />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Địa chỉ" prop="address">
        <el-input v-model="formData.address" type="textarea" :rows="2" placeholder="Nhập địa chỉ" maxlength="500" show-word-limit />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-form-item label="Ngày vào làm" prop="hire_date">
            <el-date-picker
              v-model="formData.hire_date"
              type="date"
              placeholder="Chọn ngày"
              format="DD/MM/YYYY"
              value-format="YYYY-MM-DD"
              :disabled-date="(d) => d > new Date()"
              style="width:100%"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="Tài khoản hệ thống" prop="user_id" v-if="!isEdit">
            <el-select v-model="formData.user_id" placeholder="Chọn user" filterable style="width:100%" :loading="loadingUsers">
              <el-option v-for="u in users" :key="u.id" :label="`${u.name} (${u.email})`" :value="u.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="Trạng thái" v-if="isEdit">
        <el-switch
          v-model="formData.status"
          active-text="Đang làm việc"
          inactive-text="Nghỉ việc"
          :active-value="1"
          :inactive-value="0"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Hủy</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? 'Cập nhật' : 'Thêm nhân viên' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createEmployee, updateEmployee, getEmployee, getDepartments, getPositions } from '@/api/hr'
import { useResponsive } from '@/composables/useResponsive'
import request from '@/utils/request'

const { isMobile } = useResponsive()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  employeeId: { type: [Number, String], default: null },
})
const emit = defineEmits(['update:modelValue', 'success'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
const isEdit = computed(() => !!props.employeeId)

const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const loadingDepts = ref(false)
const loadingPositions = ref(false)
const loadingUsers = ref(false)
const departments = ref([])
const positions = ref([])
const users = ref([])

const defaultForm = () => ({
  user_id: null, employee_code: '', full_name: '', department_id: null,
  position_id: null, email: '', phone: '', address: '',
  hire_date: new Date().toISOString().slice(0, 10), status: 1,
})
const formData = reactive(defaultForm())

const formRules = {
  employee_code: [{ required: true, message: 'Nhập mã nhân viên', trigger: 'blur' }],
  full_name: [{ required: true, message: 'Nhập họ tên', trigger: 'blur' }],
  department_id: [{ required: true, message: 'Chọn phòng ban', trigger: 'change' }],
  position_id: [{ required: true, message: 'Chọn chức vụ', trigger: 'change' }],
  hire_date: [{ required: true, message: 'Chọn ngày vào làm', trigger: 'change' }],
  user_id: [{ required: true, message: 'Chọn tài khoản hệ thống', trigger: 'change' }],
  email: [{ type: 'email', message: 'Email không hợp lệ', trigger: 'blur' }],
}

const fetchDropdowns = async () => {
  loadingDepts.value = true
  loadingPositions.value = true
  loadingUsers.value = true
  try {
    const [dRes, pRes, uRes] = await Promise.all([
      getDepartments({ per_page: 999 }),
      getPositions({ per_page: 999 }),
      request({ url: '/users', method: 'get', params: { per_page: 999 } }),
    ])
    departments.value = dRes.data ?? []
    positions.value = pRes.data ?? []
    users.value = uRes.data ?? []
  } catch { /* ignore */ }
  finally { loadingDepts.value = false; loadingPositions.value = false; loadingUsers.value = false }
}

watch(dialogVisible, async (val) => {
  if (val) {
    fetchDropdowns()
    if (props.employeeId) await loadData(props.employeeId)
    else resetForm()
  } else { resetForm() }
})

const loadData = async (id) => {
  loading.value = true
  try {
    const res = await getEmployee(id)
    const e = res.data
    Object.assign(formData, {
      employee_code: e.employee_code || '',
      full_name: e.full_name || '',
      department_id: e.department_id ?? null,
      position_id: e.position_id ?? null,
      email: e.email || '',
      phone: e.phone || '',
      address: e.address || '',
      hire_date: e.hire_date?.slice(0, 10) || '',
      status: e.status ?? 1,
    })
  } catch { ElMessage.error('Tải dữ liệu nhân viên thất bại') }
  finally { loading.value = false }
}

const handleSubmit = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) { await updateEmployee(props.employeeId, formData); ElMessage.success('Cập nhật nhân viên thành công') }
      else { await createEmployee(formData); ElMessage.success('Thêm nhân viên thành công') }
      emit('success'); handleClose()
    } catch (err) { ElMessage.error(err.response?.data?.message || 'Lưu thất bại') }
    finally { submitting.value = false }
  })
}

const handleClose = () => { dialogVisible.value = false }
const resetForm = () => { formRef.value?.resetFields(); Object.assign(formData, defaultForm()) }
</script>

<style scoped lang="scss">
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px;
  @media (max-width: 767px) { flex-direction: column-reverse; .el-button { width: 100%; margin: 0; } }
}
</style>
