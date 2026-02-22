<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'"
    :width="isMobile ? '100%' : '480px'"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-width="isMobile ? '100%' : '130px'"
      :label-position="isMobile ? 'top' : 'left'"
      v-loading="loading"
    >
      <el-form-item label="Tên phòng ban" prop="name">
        <el-input v-model="formData.name" placeholder="VD: Phòng Kỹ thuật" clearable>
          <template #prefix><el-icon><OfficeBuilding /></el-icon></template>
        </el-input>
      </el-form-item>
      <el-form-item label="Mô tả" prop="description">
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="Mô tả phòng ban..." maxlength="1000" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Hủy</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? 'Cập nhật' : 'Thêm phòng ban' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { OfficeBuilding } from '@element-plus/icons-vue'
import { createDepartment, updateDepartment, getDepartment } from '@/api/hr'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  departmentId: { type: [Number, String], default: null },
})
const emit = defineEmits(['update:modelValue', 'success'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
const isEdit = computed(() => !!props.departmentId)

const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)

const defaultForm = () => ({ name: '', description: '' })
const formData = reactive(defaultForm())

const formRules = {
  name: [{ required: true, message: 'Nhập tên phòng ban', trigger: 'blur' }],
}

watch(dialogVisible, async (val) => {
  if (val) { if (props.departmentId) await loadData(props.departmentId); else resetForm() }
  else resetForm()
})

const loadData = async (id) => {
  loading.value = true
  try {
    const res = await getDepartment(id)
    const d = res.data
    Object.assign(formData, { name: d.name || '', description: d.description || '' })
  } catch { ElMessage.error('Tải dữ liệu phòng ban thất bại') }
  finally { loading.value = false }
}

const handleSubmit = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) { await updateDepartment(props.departmentId, formData); ElMessage.success('Cập nhật phòng ban thành công') }
      else { await createDepartment(formData); ElMessage.success('Thêm phòng ban thành công') }
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
