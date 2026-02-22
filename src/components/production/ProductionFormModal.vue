<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="order ? 'Sửa lệnh sản xuất' : 'Tạo lệnh sản xuất'"
    width="520px"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-row :gutter="12">
        <el-col :xs="24" :sm="12">
          <el-form-item label="Mã lệnh SX" prop="order_code">
            <el-input v-model="form.order_code" placeholder="VD: PO-20240001" :disabled="!!order" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="Sản phẩm" prop="product_id">
            <el-select v-model="form.product_id" placeholder="Chọn sản phẩm" filterable style="width:100%" :disabled="!!order">
              <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="Số lượng" prop="quantity">
            <el-input-number v-model="form.quantity" :min="1" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="Ngày bắt đầu">
            <el-date-picker v-model="form.start_date" type="date" placeholder="Chọn ngày" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="Ngày kết thúc">
            <el-date-picker v-model="form.end_date" type="date" placeholder="Chọn ngày" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">Huỷ</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ order ? 'Lưu thay đổi' : 'Tạo lệnh' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createProduction, updateProduction } from '@/api/production'
import { useResponsive } from '@/composables/useResponsive'

const props = defineProps({
  modelValue: Boolean,
  order: { type: Object, default: null },
  products: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue', 'saved'])
const { isMobile } = useResponsive()
const formRef = ref(null)
const submitting = ref(false)

const form = reactive({ order_code: '', product_id: null, quantity: 1, start_date: '', end_date: '' })

watch(() => props.order, (o) => {
  if (o) {
    form.order_code = o.order_code ?? ''
    form.product_id = o.product_id ?? o.product?.id ?? null
    form.quantity = o.quantity ?? 1
    form.start_date = o.start_date ?? ''
    form.end_date = o.end_date ?? ''
  } else {
    form.order_code = ''; form.product_id = null; form.quantity = 1; form.start_date = ''; form.end_date = ''
  }
}, { immediate: true })

const rules = {
  order_code: [{ required: true, message: 'Nhập mã lệnh SX', trigger: 'blur' }],
  product_id: [{ required: true, message: 'Chọn sản phẩm', trigger: 'change' }],
  quantity: [{ required: true, type: 'number', min: 1, message: 'Số lượng phải ≥ 1', trigger: 'blur' }]
}

const handleSubmit = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload = { ...form }
      if (props.order) await updateProduction(props.order.id, payload)
      else await createProduction(payload)
      ElMessage.success(props.order ? 'Cập nhật thành công!' : 'Tạo lệnh sản xuất thành công!')
      emit('saved'); emit('update:modelValue', false)
    } catch (err) {
      ElMessage.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally { submitting.value = false }
  })
}
</script>
