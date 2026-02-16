<template>
  <div class="customer-form-container">
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới' }}</h1>
    </div>
    
    <el-card>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="140px"
        label-position="left"
      >
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-form-item label="Mã khách hàng" prop="code">
              <el-input v-model="form.code" placeholder="Nhập mã khách hàng" />
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :md="12">
            <el-form-item label="Tên khách hàng" prop="name">
              <el-input v-model="form.name" placeholder="Nhập tên khách hàng" />
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :md="12">
            <el-form-item label="Email" prop="email">
              <el-input v-model="form.email" placeholder="Nhập email" />
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :md="12">
            <el-form-item label="Số điện thoại" prop="phone">
              <el-input v-model="form.phone" placeholder="Nhập số điện thoại" />
            </el-form-item>
          </el-col>
          
          <el-col :xs="24">
            <el-form-item label="Địa chỉ" prop="address">
              <el-input
                v-model="form.address"
                type="textarea"
                :rows="3"
                placeholder="Nhập địa chỉ"
              />
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :md="12">
            <el-form-item label="Mã số thuế" prop="taxCode">
              <el-input v-model="form.taxCode" placeholder="Nhập mã số thuế" />
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :md="12">
            <el-form-item label="Trạng thái" prop="status">
              <el-select v-model="form.status" placeholder="Chọn trạng thái" class="full-width">
                <el-option label="Hoạt động" value="active" />
                <el-option label="Không hoạt động" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :xs="24">
            <el-form-item label="Ghi chú" prop="note">
              <el-input
                v-model="form.note"
                type="textarea"
                :rows="4"
                placeholder="Nhập ghi chú"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            {{ isEdit ? 'Cập nhật' : 'Thêm mới' }}
          </el-button>
          <el-button @click="handleCancel">Hủy</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCustomer, createCustomer, updateCustomer } from '@/api/customer'

const router = useRouter()
const route = useRoute()

const formRef = ref(null)
const loading = ref(false)

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  code: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  taxCode: '',
  status: 'active',
  note: ''
})

const rules = {
  code: [
    { required: true, message: 'Vui lòng nhập mã khách hàng', trigger: 'blur' }
  ],
  name: [
    { required: true, message: 'Vui lòng nhập tên khách hàng', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: 'Email không hợp lệ', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: 'Vui lòng nhập số điện thoại', trigger: 'blur' }
  ]
}

const fetchData = async () => {
  if (!isEdit.value) return
  
  loading.value = true
  try {
    // TODO: Call API
    // const response = await getCustomer(route.params.id)
    // Object.assign(form, response.data)
  } catch (error) {
    ElMessage.error('Tải dữ liệu thất bại')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        if (isEdit.value) {
          // TODO: Call API
          // await updateCustomer(route.params.id, form)
          ElMessage.success('Cập nhật khách hàng thành công')
        } else {
          // TODO: Call API
          // await createCustomer(form)
          ElMessage.success('Thêm khách hàng thành công')
        }
        router.push('/customers')
      } catch (error) {
        ElMessage.error(isEdit.value ? 'Cập nhật thất bại' : 'Thêm mới thất bại')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleCancel = () => {
  router.back()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.customer-form-container {
  max-width: 1000px;
}
</style>
