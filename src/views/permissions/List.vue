<template>
  <div class="perms-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý quyền hạn</h1>
        <p class="page-description">Tất cả quyền hạn trong hệ thống</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="showCreate = true">Thêm quyền</el-button>
        <el-button type="success" :icon="MagicStick" @click="showGenerate = true">Tạo theo module</el-button>
      </div>
    </div>

    <!-- Search -->
    <el-card class="mb-md">
      <el-input v-model="search" placeholder="Tìm kiếm quyền hạn..." :prefix-icon="Search" clearable style="max-width:360px" @input="filterPerms" />
    </el-card>

    <!-- Grouped by module -->
    <div v-loading="loading">
      <el-card v-for="group in filteredGroups" :key="group.module" class="mb-md perm-card">
        <template #header>
          <div class="group-header">
            <el-icon class="group-icon"><Lock /></el-icon>
            <span class="group-title">{{ group.module }}</span>
            <el-badge :value="group.perms.length" type="primary" />
          </div>
        </template>
        <div class="perm-grid">
          <div v-for="p in group.perms" :key="p.id" class="perm-chip">
            <el-icon size="12"><Key /></el-icon>
            <span>{{ p.name }}</span>
          </div>
        </div>
      </el-card>
      <el-empty v-if="!loading && !filteredGroups.length" description="Không tìm thấy quyền hạn nào" />
    </div>

    <!-- Add Permission Dialog -->
    <el-dialog v-model="showCreate" title="Thêm quyền hạn" width="400px" :close-on-click-modal="false">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-position="top">
        <el-form-item label="Tên quyền" prop="name">
          <el-input v-model="createForm.name" placeholder="VD: view.products" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">Huỷ</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">Tạo quyền</el-button>
      </template>
    </el-dialog>

    <!-- Generate Module Dialog -->
    <el-dialog v-model="showGenerate" title="Tạo quyền theo module" width="440px" :close-on-click-modal="false">
      <p class="generate-hint">Tự động tạo các quyền <code>view, create, edit, delete</code> cho một module.</p>
      <el-form ref="genFormRef" :model="genForm" :rules="genRules" label-position="top">
        <el-form-item label="Tên module" prop="module">
          <el-input v-model="genForm.module" placeholder="VD: products, employees, orders..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showGenerate = false">Huỷ</el-button>
        <el-button type="success" :loading="generating" @click="handleGenerate">Tạo quyền</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, Lock, Key } from '@element-plus/icons-vue'
import { MagicStick } from '@element-plus/icons-vue'
import { getPermissions, createPermission, generateModulePermissions } from '@/api/users'

const loading = ref(false)
const permissions = ref([])
const search = ref('')
const showCreate = ref(false)
const showGenerate = ref(false)
const creating = ref(false)
const generating = ref(false)
const createFormRef = ref(null)
const genFormRef = ref(null)

const createForm = ref({ name: '' })
const genForm = ref({ module: '' })
const createRules = { name: [{ required: true, message: 'Vui lòng nhập tên quyền', trigger: 'blur' }] }
const genRules = { module: [{ required: true, message: 'Vui lòng nhập tên module', trigger: 'blur' }] }

const groupedPerms = computed(() => {
  const map = {}
  permissions.value.forEach(p => {
    const parts = (p.name ?? '').split('.')
    const module = parts[1] ?? parts[0] ?? 'other'
    if (!map[module]) map[module] = []
    map[module].push(p)
  })
  return Object.entries(map).map(([module, perms]) => ({ module, perms }))
})

const filteredGroups = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return groupedPerms.value
  return groupedPerms.value
    .map(g => ({ ...g, perms: g.perms.filter(p => p.name?.toLowerCase().includes(q)) }))
    .filter(g => g.perms.length)
})

const fetchPermissions = async () => {
  loading.value = true
  try { const res = await getPermissions(); permissions.value = res.data ?? [] }
  catch { permissions.value = [] }
  finally { loading.value = false }
}

const filterPerms = () => {} // reactive computed handles filtering

const handleCreate = async () => {
  await createFormRef.value?.validate(async (valid) => {
    if (!valid) return
    creating.value = true
    try {
      await createPermission({ name: createForm.value.name })
      ElMessage.success('Đã tạo quyền!')
      showCreate.value = false; createForm.value.name = ''
      fetchPermissions()
    } catch { ElMessage.error('Tạo quyền thất bại') }
    finally { creating.value = false }
  })
}

const handleGenerate = async () => {
  await genFormRef.value?.validate(async (valid) => {
    if (!valid) return
    generating.value = true
    try {
      await generateModulePermissions({ module: genForm.value.module })
      ElMessage.success(`Đã tạo quyền cho module "${genForm.value.module}"!`)
      showGenerate.value = false; genForm.value.module = ''
      fetchPermissions()
    } catch { ElMessage.error('Tạo quyền thất bại') }
    finally { generating.value = false }
  })
}

onMounted(fetchPermissions)
</script>

<style scoped lang="scss">
.perms-container {
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;
    .page-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .page-description { font-size: 14px; color: var(--text-secondary); margin: 0; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  }
  .perm-card {
    .group-header { display: flex; align-items: center; gap: 8px;
      .group-icon { color: var(--el-color-primary); }
      .group-title { font-weight: 700; font-size: 15px; text-transform: capitalize; flex: 1; }
    }
    .perm-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .perm-chip {
      display: flex; align-items: center; gap: 5px; padding: 5px 12px;
      background: var(--bg-hover); border: 1px solid var(--border-color);
      border-radius: 20px; font-size: 13px; font-family: monospace;
      transition: all .15s;
      &:hover { border-color: var(--el-color-primary); color: var(--el-color-primary); background: #409eff0f; }
    }
  }
  .generate-hint { color: var(--text-secondary); font-size: 14px; margin-bottom: 12px; }
  code { background: #f0f4ff; padding: 2px 6px; border-radius: 4px; font-family: monospace; }

  // ── Mobile ──────────────────────────────
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column; align-items: flex-start;
      .page-title { font-size: 18px; }
      .header-actions { width: 100%; .el-button { flex: 1; } }
    }
    .perm-chip { font-size: 11px; padding: 4px 8px; }
  }
}

// Dialog responsive (global)
@media (max-width: 600px) {
  :deep(.el-dialog) { width: 95vw !important; }
}
</style>
