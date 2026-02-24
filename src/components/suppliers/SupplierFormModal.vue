<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '✏️ Sửa nhà cung cấp' : '➕ Thêm nhà cung cấp'"
    :width="isMobile ? '100%' : '580px'"
    :fullscreen="isMobile"
    :close-on-click-modal="true"
    @close="handleClose"
    class="supplier-modal"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-width="isMobile ? '100%' : '130px'"
      :label-position="isMobile ? 'top' : 'left'"
      class="supplier-form"
    >
      <el-form-item label="Tên NCC" prop="name">
        <el-input v-model="formData.name" placeholder="VD: Công ty ABC" size="large">
          <template #prefix><el-icon><OfficeBuilding /></el-icon></template>
        </el-input>
      </el-form-item>
      <el-form-item label="Người liên hệ" prop="contact_person">
        <el-input v-model="formData.contact_person" placeholder="Tên người liên hệ" size="large">
          <template #prefix><el-icon><User /></el-icon></template>
        </el-input>
      </el-form-item>
      <el-form-item label="Email" prop="email">
        <el-input v-model="formData.email" placeholder="email@example.com" size="large">
          <template #prefix><el-icon><Message /></el-icon></template>
        </el-input>
      </el-form-item>
      <el-form-item label="Số điện thoại" prop="phone">
        <el-input v-model="formData.phone" placeholder="0912 345 678" size="large">
          <template #prefix><el-icon><Phone /></el-icon></template>
        </el-input>
      </el-form-item>
      <el-form-item label="Mã số thuế">
        <el-input v-model="formData.tax_code" placeholder="MST" size="large">
          <template #prefix><el-icon><Ticket /></el-icon></template>
        </el-input>
      </el-form-item>
      <el-form-item label="Địa chỉ">
        <el-input v-model="formData.address" type="textarea" :rows="2" placeholder="Địa chỉ nhà cung cấp" />
      </el-form-item>
      <el-form-item label="Trạng thái">
        <el-switch v-model="formData.status" active-value="active" inactive-value="inactive" active-text="Hoạt động" inactive-text="Ngừng" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" size="large">Hủy</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit" size="large">
          <el-icon style="margin-right: 4px"><Check /></el-icon>{{ isEdit ? 'Cập nhật' : 'Thêm mới' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { OfficeBuilding, User, Message, Phone, Ticket, Check } from '@element-plus/icons-vue'
import { createSupplier, updateSupplier, getSupplier } from '@/api/supplier'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  supplierId: { type: [Number, String], default: null }
})
const emit = defineEmits(['update:modelValue', 'success'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.supplierId)
const formRef = ref(null)
const loading = ref(false)
const defaultForm = { name: '', contact_person: '', email: '', phone: '', tax_code: '', address: '', status: 'active' }
const formData = reactive({ ...defaultForm })
const formRules = {
  name: [{ required: true, message: 'Vui lòng nhập tên NCC', trigger: 'blur' }],
  email: [{ type: 'email', message: 'Email không hợp lệ', trigger: 'blur' }]
}

watch(dialogVisible, async (val) => {
  if (val && props.supplierId) {
    try {
      const res = await getSupplier(props.supplierId)
      Object.assign(formData, res.data || res)
    } catch { ElMessage.error('Lỗi tải dữ liệu') }
  }
  if (!val) resetForm()
})

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      if (isEdit.value) await updateSupplier(props.supplierId, formData)
      else await createSupplier(formData)
      ElMessage.success(isEdit.value ? 'Cập nhật thành công!' : 'Thêm thành công!')
      emit('success')
      handleClose()
    } catch (e) { ElMessage.error(e.response?.data?.message || 'Có lỗi') }
    loading.value = false
  })
}

const handleClose = () => { dialogVisible.value = false }
const resetForm = () => { formRef.value?.resetFields(); Object.assign(formData, { ...defaultForm }) }
</script>

<style scoped lang="scss">
.dialog-footer {
  display: flex; justify-content: flex-end; gap: 12px;
  @media (max-width: 767px) {
    flex-direction: column-reverse; gap: 8px;
    .el-button { width: 100%; margin: 0; }
  }
}
:deep(.supplier-modal) {
  border-radius: 16px;
  .el-dialog__header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border-lighter, #f0f0f0);
    .el-dialog__title { font-size: 18px; font-weight: 700; }
  }
  .el-dialog__body { padding: 24px; }
  .el-dialog__footer { padding: 16px 24px; border-top: 1px solid var(--border-lighter, #f0f0f0); }

  @media (max-width: 767px) {
    .el-dialog__header { padding: 16px; }
    .el-dialog__body { padding: 16px; max-height: calc(100vh - 130px); overflow-y: auto; }
    .el-dialog__footer { padding: 12px 16px; position: sticky; bottom: 0; background: var(--bg-color, #fff); }
  }
}
.supplier-form {
  :deep(.el-input__prefix) { color: var(--el-color-primary); }
  @media (max-width: 767px) {
    :deep(.el-form-item__label) { margin-bottom: 6px; font-weight: 600; }
    :deep(.el-input__inner) { min-height: 44px; }
  }
}
</style>
