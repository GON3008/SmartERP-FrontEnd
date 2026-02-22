<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? 'Chỉnh sửa kho' : 'Thêm kho mới'"
    :width="isMobile ? '100%' : '500px'"
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
      <el-form-item label="Tên kho" prop="name">
        <el-input v-model="formData.name" placeholder="VD: Kho Hà Nội" clearable>
          <template #prefix><el-icon><OfficeBuilding /></el-icon></template>
        </el-input>
      </el-form-item>

      <el-form-item label="Địa chỉ" prop="location">
        <el-input
          v-model="formData.location"
          type="textarea"
          :rows="2"
          placeholder="Nhập địa chỉ kho"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="Sức chứa" prop="capacity">
        <el-input-number
          v-model="formData.capacity"
          :min="0"
          :controls="false"
          placeholder="Sức chứa (nếu có)"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Hủy</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? 'Cập nhật' : 'Thêm kho' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { OfficeBuilding } from '@element-plus/icons-vue'
import { createWarehouse, updateWarehouse, getWarehouse } from '@/api/warehouse'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  warehouseId: { type: [Number, String], default: null },
})

const emit = defineEmits(['update:modelValue', 'success'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const isEdit = computed(() => !!props.warehouseId)
const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)

const defaultForm = () => ({ name: '', location: '', capacity: null })
const formData = reactive(defaultForm())

const formRules = {
  name: [{ required: true, message: 'Vui lòng nhập tên kho', trigger: 'blur' }],
}

watch(dialogVisible, (val) => {
  if (val) {
    if (props.warehouseId) loadData(props.warehouseId)
    else resetForm()
  } else {
    resetForm()
  }
})

const loadData = async (id) => {
  loading.value = true
  try {
    const res = await getWarehouse(id)
    const w = res.data
    Object.assign(formData, {
      name: w.name || '',
      location: w.location || '',
      capacity: w.capacity ?? null,
    })
  } catch {
    ElMessage.error('Tải dữ liệu kho thất bại')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) {
        await updateWarehouse(props.warehouseId, formData)
        ElMessage.success('Cập nhật kho thành công')
      } else {
        await createWarehouse(formData)
        ElMessage.success('Thêm kho thành công')
      }
      emit('success')
      handleClose()
    } catch (err) {
      ElMessage.error(err.response?.data?.message || 'Lưu thất bại')
    } finally {
      submitting.value = false
    }
  })
}

const handleClose = () => { dialogVisible.value = false }
const resetForm = () => { formRef.value?.resetFields(); Object.assign(formData, defaultForm()) }
</script>

<style scoped lang="scss">
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  @media (max-width: 767px) {
    flex-direction: column-reverse;
    .el-button { width: 100%; margin: 0; }
  }
}
</style>
