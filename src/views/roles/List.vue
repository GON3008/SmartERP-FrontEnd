<template>
  <div class="roles-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý vai trò</h1>
        <p class="page-description">Phân quyền và vai trò người dùng</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openForm()">Thêm vai trò</el-button>
    </div>

    <el-row :gutter="16">
      <!-- Roles list -->
      <el-col :xs="24" :md="10">
        <el-card v-loading="loading">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="card-title">Danh sách vai trò ({{ roles.length }})</span>
              <el-button size="small" :icon="Refresh" @click="fetchRoles" circle />
            </div>
          </template>
          <div v-for="role in roles" :key="role.id"
            class="role-item" :class="{ active: selected?.id === role.id }"
            @click="selectRole(role)"
          >
            <div class="role-left">
              <el-avatar :size="36" :style="{ background: roleColor(role.name) }">
                <el-icon><Key /></el-icon>
              </el-avatar>
              <div>
                <div class="role-name">{{ role.name }}</div>
                <div class="role-sub">{{ role.permissions?.length ?? 0 }} quyền</div>
              </div>
            </div>
            <div class="role-actions" @click.stop>
              <el-tooltip content="Chỉnh sửa"><el-button size="small" :icon="Edit" circle @click="openForm(role)" /></el-tooltip>
              <el-tooltip content="Xoá"><el-button size="small" :icon="Delete" circle type="danger" @click="handleDelete(role)" /></el-tooltip>
            </div>
          </div>
          <el-empty v-if="!loading && !roles.length" description="Chưa có vai trò nào" :image-size="60" />
        </el-card>
      </el-col>

      <!-- Role detail / permissions -->
      <el-col :xs="24" :md="14">
        <el-card v-if="selected">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="card-title">Quyền hạn – {{ selected.name }}</span>
              <el-button size="small" type="primary" :icon="Edit" @click="openSyncPerms(selected)">Cập nhật quyền</el-button>
            </div>
          </template>
          <div v-if="selected.permissions?.length" class="perms-grid">
            <el-tag v-for="p in selected.permissions" :key="p.id ?? p" size="small" effect="light" type="primary" style="margin:3px">
              {{ p.name ?? p }}
            </el-tag>
          </div>
          <el-empty v-else description="Vai trò này chưa có quyền hạn" :image-size="60" />
        </el-card>
        <el-card v-else class="empty-hint">
          <el-empty description="Chọn một vai trò để xem quyền hạn" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>

    <!-- Form Modal -->
    <RoleFormModal v-if="showForm" v-model="showForm" :role="editTarget" :all-permissions="allPermissions" @saved="onSaved" />

    <!-- Sync Permissions Dialog -->
    <el-dialog v-model="showSyncPerms" title="Cập nhật quyền hạn" width="600px" :close-on-click-modal="false">
      <p class="sync-label">Vai trò: <strong>{{ selected?.name }}</strong></p>
      <el-checkbox-group v-model="syncSelected">
        <div v-for="group in groupedPerms" :key="group.module" class="perm-group">
          <div class="perm-group-title">{{ group.module }}</div>
          <el-checkbox v-for="p in group.perms" :key="p.id" :label="p.id">{{ p.name }}</el-checkbox>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="showSyncPerms = false">Huỷ</el-button>
        <el-button type="primary" :loading="syncing" @click="handleSyncPerms">Lưu thay đổi</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Edit, Delete, Key } from '@element-plus/icons-vue'
import { getRoles, deleteRole, syncRolePermissions } from '@/api/users'
import { getPermissions } from '@/api/users'
import RoleFormModal from '@/components/roles/RoleFormModal.vue'

const loading = ref(false)
const roles = ref([])
const selected = ref(null)
const showForm = ref(false)
const editTarget = ref(null)
const allPermissions = ref([])
const showSyncPerms = ref(false)
const syncSelected = ref([])
const syncing = ref(false)

const roleColor = (name) => { const colors = ['#409eff','#67c23a','#e6a23c','#f56c6c','#0ea5e9','#9b59b6']; return colors[name?.charCodeAt(0) % colors.length ?? 0] }

const groupedPerms = computed(() => {
  const map = {}
  allPermissions.value.forEach(p => {
    const parts = (p.name ?? '').split('.')
    const module = parts[1] ?? parts[0] ?? 'other'
    if (!map[module]) map[module] = []
    map[module].push(p)
  })
  return Object.entries(map).map(([module, perms]) => ({ module, perms }))
})

const fetchRoles = async () => {
  loading.value = true
  try { const res = await getRoles(); roles.value = res.data ?? [] }
  catch { roles.value = [] }
  finally { loading.value = false }
}

const fetchPermissions = async () => {
  try { const res = await getPermissions(); allPermissions.value = res.data ?? [] } catch {}
}

const selectRole = (role) => { selected.value = role }
const openForm = (r = null) => { editTarget.value = r; showForm.value = true }
const onSaved = () => { fetchRoles(); selected.value = null }

const handleDelete = async (role) => {
  try {
    await ElMessageBox.confirm(`Xoá vai trò "${role.name}"?`, 'Xác nhận', { type: 'warning' })
    await deleteRole(role.id)
    ElMessage.success('Đã xoá vai trò!')
    if (selected.value?.id === role.id) selected.value = null
    fetchRoles()
  } catch {}
}

const openSyncPerms = (role) => {
  syncSelected.value = role.permissions?.map(p => p.id) ?? []
  showSyncPerms.value = true
}

const handleSyncPerms = async () => {
  syncing.value = true
  try {
    await syncRolePermissions(selected.value.id, { permissions: syncSelected.value })
    ElMessage.success('Cập nhật quyền thành công!')
    showSyncPerms.value = false
    fetchRoles()
  } catch { ElMessage.error('Cập nhật thất bại') }
  finally { syncing.value = false }
}

onMounted(() => { fetchRoles(); fetchPermissions() })
</script>

<style scoped lang="scss">
.roles-container {
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;
    .page-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .page-description { font-size: 14px; color: var(--text-secondary); margin: 0; }
  }
  .card-title { font-weight: 600; font-size: 15px; }
  .role-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px; border-radius: 8px; cursor: pointer; margin-bottom: 8px;
    border: 1px solid transparent; transition: all .2s;
    &:hover { background: var(--bg-hover); border-color: var(--border-color); }
    &.active { background: #409eff15; border-color: #409eff60; }
    .role-left { display: flex; align-items: center; gap: 10px; }
    .role-name { font-weight: 600; }
    .role-sub { font-size: 12px; color: var(--text-secondary); }
    .role-actions { display: flex; gap: 6px; flex-shrink: 0; }
  }
  .perms-grid { display: flex; flex-wrap: wrap; gap: 4px; }
  .perm-group { margin-bottom: 12px;
    .perm-group-title { font-weight: 600; text-transform: capitalize; margin-bottom: 6px; color: var(--text-primary); }
    .el-checkbox { margin-right: 12px; margin-bottom: 4px; }
  }
  .sync-label { margin-bottom: 12px; }

  // ── Mobile ──────────────────────────────
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column; align-items: flex-start;
      .page-title { font-size: 18px; }
    }
    .role-item { padding: 10px 8px; }
  }
  @media (max-width: 480px) {
    .role-item {
      .role-name { font-size: 13px; }
    }
    .perm-group .el-checkbox { margin-right: 8px; font-size: 12px; }
  }
}

// Fix dialog width on mobile (global)
@media (max-width: 600px) {
  :deep(.el-dialog) { width: 95vw !important; }
}
</style>
