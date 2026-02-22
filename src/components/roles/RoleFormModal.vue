<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    :title="role ? 'Chỉnh sửa vai trò' : 'Thêm vai trò'"
    width="480px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="Tên vai trò" prop="name">
        <el-input v-model="form.name" placeholder="VD: Admin, Manager, Staff..." />
      </el-form-item>
      <el-form-item label="Quyền hạn">
        <div class="perm-select">
          <div v-for="group in groupedPerms" :key="group.module" class="perm-group">
            <div class="perm-group-title">
              <el-checkbox
                :model-value="isGroupChecked(group)"
                :indeterminate="isGroupIndeterminate(group)"
                @change="(v) => toggleGroup(group, v)"
              >{{ group.module }}</el-checkbox>
            </div>
            <div class="perm-items">
              <el-checkbox v-for="p in group.perms" :key="p.id" v-model="form.permissions" :label="p.id">
                {{ p.name }}
              </el-checkbox>
            </div>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">Huỷ</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ role ? 'Lưu thay đổi' : 'Tạo vai trò' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { createRole, updateRole, syncRolePermissions } from '@/api/users'

const props = defineProps({
  modelValue: Boolean,
  role: { type: Object, default: null },
  allPermissions: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue', 'saved'])
const formRef = ref(null)
const submitting = ref(false)

const form = reactive({ name: '', permissions: [] })

watch(() => props.role, (r) => {
  if (r) { form.name = r.name ?? ''; form.permissions = r.permissions?.map(p => p.id) ?? [] }
  else { form.name = ''; form.permissions = [] }
}, { immediate: true })

const rules = { name: [{ required: true, message: 'Vui lòng nhập tên vai trò', trigger: 'blur' }] }

const groupedPerms = computed(() => {
  const map = {}
  props.allPermissions.forEach(p => {
    const parts = (p.name ?? '').split('.')
    const module = parts[1] ?? parts[0] ?? 'other'
    if (!map[module]) map[module] = []
    map[module].push(p)
  })
  return Object.entries(map).map(([module, perms]) => ({ module, perms }))
})

const isGroupChecked = (group) => group.perms.every(p => form.permissions.includes(p.id))
const isGroupIndeterminate = (group) => group.perms.some(p => form.permissions.includes(p.id)) && !isGroupChecked(group)
const toggleGroup = (group, val) => {
  const ids = group.perms.map(p => p.id)
  if (val) form.permissions = [...new Set([...form.permissions, ...ids])]
  else form.permissions = form.permissions.filter(id => !ids.includes(id))
}

const handleSubmit = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      let savedRole
      if (props.role) {
        await updateRole(props.role.id, { name: form.name })
        savedRole = props.role
      } else {
        const res = await createRole({ name: form.name })
        savedRole = res.data ?? res
      }
      // Sync permissions
      if (savedRole?.id && form.permissions.length >= 0) {
        await syncRolePermissions(savedRole.id, { permissions: form.permissions }).catch(() => {})
      }
      ElMessage.success(props.role ? 'Cập nhật thành công!' : 'Tạo vai trò thành công!')
      emit('saved')
      emit('update:modelValue', false)
    } catch (err) {
      ElMessage.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally { submitting.value = false }
  })
}
</script>

<style scoped lang="scss">
.perm-select { max-height: 320px; overflow-y: auto; padding: 4px;
  .perm-group { margin-bottom: 12px; border: 1px solid var(--border-color); border-radius: 8px; padding: 10px;
    .perm-group-title { font-weight: 600; text-transform: capitalize; margin-bottom: 6px; }
    .perm-items { display: flex; flex-wrap: wrap; gap: 2px 16px; }
  }
}
</style>
