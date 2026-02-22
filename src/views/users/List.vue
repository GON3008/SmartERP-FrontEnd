<template>
  <div class="users-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý người dùng</h1>
        <p class="page-description">Danh sách tài khoản trong hệ thống</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openForm()">Thêm người dùng</el-button>
    </div>

    <!-- Stats -->
    <el-row :gutter="12" class="mb-md" v-if="stats">
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-primary">
          <div class="stat-num">{{ stats.total ?? 0 }}</div>
          <div class="stat-lbl">Tổng tài khoản</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-success">
          <div class="stat-num">{{ stats.active ?? 0 }}</div>
          <div class="stat-lbl">Đang hoạt động</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-danger">
          <div class="stat-num">{{ stats.inactive ?? 0 }}</div>
          <div class="stat-lbl">Bị vô hiệu hoá</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-info">
          <div class="stat-num">{{ stats.admins ?? 0 }}</div>
          <div class="stat-lbl">Quản trị viên</div>
        </div>
      </el-col>
    </el-row>

    <!-- Filter -->
    <el-card class="mb-md">
      <el-form :inline="!isMobile" :model="filterForm">
        <el-form-item>
          <el-input v-model="filterForm.search" placeholder="Tìm tên, email..." :prefix-icon="Search" clearable style="min-width:220px" @keyup.enter="fetchUsers" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="filterForm.status" placeholder="Trạng thái" clearable style="width:140px">
            <el-option label="Hoạt động" :value="1" />
            <el-option label="Vô hiệu" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchUsers">Tìm kiếm</el-button>
          <el-button :icon="Refresh" @click="handleReset">Đặt lại</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Table -->
    <el-card>
      <el-table v-loading="loading" :data="users" stripe style="width:100%">
        <el-table-column label="Tên" min-width="160">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="32" :style="{ background: avatarColor(row.name) }">{{ initials(row.name) }}</el-avatar>
              <router-link :to="`/users/${row.id}`" class="user-name">{{ row.name }}</router-link>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Email" min-width="180" prop="email" />
        <el-table-column label="Vai trò" min-width="160">
          <template #default="{ row }">
            <el-tag v-for="r in (row.roles ?? [])" :key="r.id" size="small" effect="light" style="margin:2px">{{ r.name }}</el-tag>
            <span v-if="!row.roles?.length" class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" effect="light" size="small">
              {{ row.is_active ? 'Hoạt động' : 'Vô hiệu' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Ngày tạo" width="130" align="center">
          <template #default="{ row }">{{ fmtDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="" width="140" align="right" fixed="right">
          <template #default="{ row }">
            <el-tooltip content="Chi tiết"><el-button size="small" :icon="View" circle @click="$router.push(`/users/${row.id}`)" /></el-tooltip>
            <el-tooltip content="Chỉnh sửa"><el-button size="small" :icon="Edit" circle @click="openForm(row)" /></el-tooltip>
            <el-tooltip :content="row.is_active ? 'Vô hiệu hoá' : 'Kích hoạt'">
              <el-button size="small" :icon="row.is_active ? Lock : Unlock" circle :type="row.is_active ? 'warning' : 'success'" @click="handleToggle(row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <!-- Mobile cards -->
      <div v-if="isMobile && !loading" class="mobile-list">
        <div v-for="row in users" :key="row.id" class="mobile-card" @click="$router.push(`/users/${row.id}`)">
          <div class="mc-header">
            <el-avatar :size="40" :style="{ background: avatarColor(row.name) }">{{ initials(row.name) }}</el-avatar>
            <div>
              <div class="mc-name">{{ row.name }}</div>
              <div class="mc-sub">{{ row.email }}</div>
            </div>
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small" effect="light">{{ row.is_active ? 'Hoạt động' : 'Vô hiệu' }}</el-tag>
          </div>
        </div>
      </div>

      <el-empty v-if="!loading && !users.length" description="Không có người dùng nào" />
      <div class="pagination-bar" v-if="total > perPage">
        <el-pagination v-model:current-page="page" :page-size="perPage" :total="total" layout="prev, pager, next" @current-change="fetchUsers" />
      </div>
    </el-card>

    <!-- Form Modal -->
    <UserFormModal v-if="showForm" v-model="showForm" :user="editTarget" @saved="onSaved" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, View, Edit, Lock } from '@element-plus/icons-vue'
import { Unlock } from '@element-plus/icons-vue'
import { getUsers, getUserStatistics, toggleUserStatus } from '@/api/users'
import { useResponsive } from '@/composables/useResponsive'
import UserFormModal from '@/components/users/UserFormModal.vue'

const { isMobile } = useResponsive()
const loading = ref(false)
const users = ref([])
const total = ref(0)
const page = ref(1)
const perPage = 15
const showForm = ref(false)
const editTarget = ref(null)
const stats = ref(null)

const filterForm = reactive({ search: '', status: '' })

const initials = (name = '') => name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
const avatarColor = (name = '') => { const colors = ['#409eff','#67c23a','#e6a23c','#f56c6c','#909399','#0ea5e9']; return colors[name.charCodeAt(0) % colors.length] }
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'

const fetchStats = async () => {
  try { const res = await getUserStatistics(); stats.value = res.data ?? null } catch {}
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUsers({ page: page.value, per_page: perPage, search: filterForm.search || undefined, status: filterForm.status !== '' ? filterForm.status : undefined })
    users.value = res.data ?? []
    total.value = res.meta?.total ?? res.total ?? users.value.length
  } catch { users.value = [] }
  finally { loading.value = false }
}

const handleReset = () => { filterForm.search = ''; filterForm.status = ''; page.value = 1; fetchUsers() }
const openForm = (u = null) => { editTarget.value = u; showForm.value = true }
const onSaved = () => { fetchUsers(); fetchStats() }

const handleToggle = async (row) => {
  try {
    await ElMessageBox.confirm(`${row.is_active ? 'Vô hiệu hoá' : 'Kích hoạt'} tài khoản "${row.name}"?`, 'Xác nhận', { type: 'warning' })
    await toggleUserStatus(row.id)
    ElMessage.success('Cập nhật thành công!')
    row.is_active = !row.is_active
  } catch {}
}

onMounted(() => { fetchStats(); fetchUsers() })
</script>

<style scoped lang="scss">
.users-container {
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
    .page-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .page-description { font-size: 14px; color: var(--text-secondary); margin: 0; }
  }
  .user-cell { display: flex; align-items: center; gap: 10px; }
  .user-name { color: var(--el-color-primary); text-decoration: none; font-weight: 500;
    &:hover { text-decoration: underline; }
  }
  .text-muted { color: var(--text-secondary); font-size: 13px; }
  .stat-card {
    border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 14px;
    .stat-num { font-size: 28px; font-weight: 800; }
    .stat-lbl { font-size: 12px; margin-top: 4px; opacity: 0.8; }
    &.stat-primary { background: linear-gradient(135deg, #409eff20, #409eff10); border: 1px solid #409eff40; color: #2e8be8; }
    &.stat-success { background: linear-gradient(135deg, #67c23a20, #67c23a10); border: 1px solid #67c23a40; color: #5dab30; }
    &.stat-danger { background: linear-gradient(135deg, #f56c6c20, #f56c6c10); border: 1px solid #f56c6c40; color: #e84040; }
    &.stat-info { background: linear-gradient(135deg, #909399, #90939910); border: 1px solid #90939940; color: #666; }
  }
  .pagination-bar { display: flex; justify-content: center; margin-top: 16px; }
  .mobile-list { display: none; }
  @media (max-width: 768px) {
    .el-table { display: none; }
    .mobile-list { display: block; }
    .mobile-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px; margin-bottom: 10px; cursor: pointer;
      &:hover { border-color: var(--el-color-primary); }
      .mc-header { display: flex; align-items: center; gap: 10px; }
      .mc-name { font-weight: 600; font-size: 15px; }
      .mc-sub { font-size: 12px; color: var(--text-secondary); }
    }
  }
}
</style>
