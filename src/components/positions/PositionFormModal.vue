<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? 'Chỉnh sửa chức vụ' : 'Thêm chức vụ mới'"
    :width="isMobile ? '100%' : '440px'"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-width="isMobile ? '100%' : '120px'"
      :label-position="isMobile ? 'top' : 'left'"
      v-loading="loading"
    >
      <el-form-item label="Tên chức vụ" prop="name">
        <el-input v-model="formData.name" placeholder="VD: Trưởng phòng" clearable>
          <template #prefix><el-icon><UserFilled /></el-icon></template>
        </el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Hủy</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? 'Cập nhật' : 'Thêm chức vụ' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import { createPosition, updatePosition, getPosition } from '@/api/hr'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  positionId: { type: [Number, String], default: null },
})
const emit = defineEmits(['update:modelValue', 'success'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
const isEdit = computed(() => !!props.positionId)

const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)

const defaultForm = () => ({ name: '' })
const formData = reactive(defaultForm())

const formRules = {
  name: [{ required: true, message: 'Nhập tên chức vụ', trigger: 'blur' }],
}

watch(dialogVisible, async (val) => {
  if (val) { if (props.positionId) await loadData(props.positionId); else resetForm() }
  else resetForm()
})

const loadData = async (id) => {
  loading.value = true
  try {
    const res = await getPosition(id)
    formData.name = res.data?.name || ''
  } catch { ElMessage.error('Tải dữ liệu chức vụ thất bại') }
  finally { loading.value = false }
}

const handleSubmit = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) { await updatePosition(props.positionId, formData); ElMessage.success('Cập nhật chức vụ thành công') }
      else { await createPosition(formData); ElMessage.success('Thêm chức vụ thành công') }
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
