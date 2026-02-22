<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="user ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'"
    width="520px"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-row :gutter="12">
        <el-col :span="24">
          <el-form-item label="Họ tên" prop="name">
            <el-input v-model="form.name" placeholder="Nhập họ tên" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="Email" prop="email">
            <el-input v-model="form.email" placeholder="example@email.com" type="email" />
          </el-form-item>
        </el-col>
        <el-col :span="24" v-if="!user">
          <el-form-item label="Mật khẩu" prop="password">
            <el-input v-model="form.password" placeholder="Ít nhất 8 ký tự" type="password" show-password />
          </el-form-item>
        </el-col>
        <el-col :span="24" v-if="!user">
          <el-form-item label="Xác nhận mật khẩu" prop="password_confirmation">
            <el-input v-model="form.password_confirmation" placeholder="Nhập lại mật khẩu" type="password" show-password />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="Vai trò">
            <el-select v-model="form.role" placeholder="Chọn vai trò" clearable style="width:100%" :loading="loadingRoles">
              <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.name" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">Huỷ</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ user ? 'Lưu thay đổi' : 'Tạo người dùng' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createUser, updateUser, assignRole } from '@/api/users'
import { getRoles } from '@/api/users'
import { useResponsive } from '@/composables/useResponsive'

const props = defineProps({
  modelValue: Boolean,
  user: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'saved'])
const { isMobile } = useResponsive()
const formRef = ref(null)
const submitting = ref(false)
const loadingRoles = ref(false)
const roles = ref([])

const defaultForm = () => ({
  name: '', email: '', password: '', password_confirmation: '',
  role: props.user?.roles?.[0]?.name ?? ''
})

const form = reactive(defaultForm())

watch(() => props.user, (u) => {
  if (u) {
    form.name = u.name ?? ''
    form.email = u.email ?? ''
    form.password = ''
    form.password_confirmation = ''
    form.role = u.roles?.[0]?.name ?? ''
  } else {
    Object.assign(form, defaultForm())
  }
}, { immediate: true })

const rules = {
  name: [{ required: true, message: 'Vui lòng nhập họ tên', trigger: 'blur' }],
  email: [
    { required: true, message: 'Vui lòng nhập email', trigger: 'blur' },
    { type: 'email', message: 'Email không hợp lệ', trigger: 'blur' }
  ],
  password: [
    { required: !props.user, message: 'Vui lòng nhập mật khẩu', trigger: 'blur' },
    { min: 8, message: 'Tối thiểu 8 ký tự', trigger: 'blur' }
  ],
  password_confirmation: [
    {
      validator: (_, val, cb) => {
        if (!props.user && val !== form.password) cb(new Error('Mật khẩu không khớp'))
        else cb()
      }, trigger: 'blur'
    }
  ]
}

const fetchRoles = async () => {
  loadingRoles.value = true
  try { const res = await getRoles(); roles.value = res.data ?? [] }
  catch { roles.value = [] }
  finally { loadingRoles.value = false }
}

const handleSubmit = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      let savedUser
      if (props.user) {
        savedUser = await updateUser(props.user.id, { name: form.name, email: form.email })
      } else {
        const res = await createUser({ name: form.name, email: form.email, password: form.password, password_confirmation: form.password_confirmation })
        savedUser = res.data ?? res
      }
      // Assign role if changed
      if (form.role) {
        const userId = props.user?.id ?? savedUser?.id
        if (userId) await assignRole(userId, { role: form.role }).catch(() => {})
      }
      ElMessage.success(props.user ? 'Cập nhật thành công!' : 'Tạo người dùng thành công!')
      emit('saved')
      emit('update:modelValue', false)
    } catch (err) {
      ElMessage.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally { submitting.value = false }
  })
}

onMounted(fetchRoles)
</script>
