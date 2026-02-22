<template>
  <div class="employees-container">
    <div class="page-header" v-if="!isMobile">
      <div>
        <h1 class="page-title">Quản lý nhân viên</h1>
        <p class="page-description">Danh sách tất cả nhân viên trong hệ thống</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate">Thêm nhân viên</el-button>
    </div>
    <div class="mobile-header" v-else>
      <h2 class="mobile-title">Nhân viên</h2>
    </div>

    <!-- Search & Filter -->
    <el-card class="mb-md">
      <el-form :inline="!isMobile" :model="searchForm">
        <el-form-item label="Tìm kiếm">
          <el-input v-model="searchForm.search" placeholder="Tên, mã, email..." :prefix-icon="Search" clearable @clear="handleSearch" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="Phòng ban">
          <el-select v-model="searchForm.department_id" placeholder="Tất cả" clearable style="min-width:140px" @change="handleSearch">
            <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Trạng thái">
          <el-select v-model="searchForm.status" placeholder="Tất cả" clearable style="min-width:130px" @change="handleSearch">
            <el-option label="Đang làm việc" :value="1" />
            <el-option label="Nghỉ việc" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">Tìm</el-button>
          <el-button :icon="Refresh" @click="handleReset">Đặt lại</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Desktop Table -->
    <el-card v-if="!isMobile">
      <el-table v-loading="loading" :data="tableData" stripe style="width:100%">
        <el-table-column prop="employee_code" label="Mã NV" width="110">
          <template #default="{ row }"><el-tag type="info">{{ row.employee_code }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="full_name" label="Họ tên" min-width="160" />
        <el-table-column label="Phòng ban" min-width="140">
          <template #default="{ row }">{{ row.department?.name ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="Chức vụ" min-width="140">
          <template #default="{ row }">{{ row.position?.name ?? '—' }}</template>
        </el-table-column>
        <el-table-column prop="email" label="Email" min-width="170" show-overflow-tooltip />
        <el-table-column prop="phone" label="SĐT" width="120" />
        <el-table-column label="Trạng thái" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'" effect="light">
              {{ row.status ? 'Đang làm' : 'Nghỉ việc' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="190" fixed="right">
          <template #default="{ row }">
            <el-button type="info" size="small" :icon="View" link @click="goDetail(row)">Chi tiết</el-button>
            <el-button type="primary" size="small" :icon="Edit" link @click="openEdit(row)">Sửa</el-button>
            <el-button type="danger" size="small" :icon="Delete" link @click="handleDelete(row)">Xóa</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="() => { pagination.page = 1; fetchData() }"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <!-- Mobile -->
    <div v-else class="employee-cards" v-loading="loading">
      <MobileCard
        v-for="emp in tableData" :key="emp.id"
        :title="emp.full_name"
        :icon="User"
        :badge="{ text: emp.status ? 'Đang làm' : 'Nghỉ việc', type: emp.status ? 'success' : 'danger' }"
        :actions="cardActions"
        @action="(cmd) => handleCardAction(cmd, emp)"
      >
        <CardInfoRow :icon="Ticket" :value="emp.employee_code" />
        <CardInfoRow :icon="OfficeBuilding" :value="emp.department?.name ?? '—'" />
        <CardInfoRow :icon="Phone" :value="emp.phone || '—'" />
      </MobileCard>
      <div v-if="!tableData.length && !loading" class="empty-state"><el-empty description="Không có nhân viên" /></div>
    </div>

    <el-button v-if="isMobile" type="primary" :icon="Plus" circle size="large" class="fab-button" @click="openCreate" />
    <EmployeeFormModal v-model="showModal" :employee-id="selectedId" @success="handleSuccess" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Refresh, View, User, Ticket, OfficeBuilding, Phone } from '@element-plus/icons-vue'
import { getEmployees, deleteEmployee, getDepartments } from '@/api/hr'
import EmployeeFormModal from '@/components/employees/EmployeeFormModal.vue'
import { useResponsive } from '@/composables/useResponsive'
import MobileCard from '@/components/common/MobileCard.vue'
import CardInfoRow from '@/components/common/CardInfoRow.vue'

const router = useRouter()
const { isMobile } = useResponsive()

const loading = ref(false)
const tableData = ref([])
const departments = ref([])
const showModal = ref(false)
const selectedId = ref(null)
const searchForm = reactive({ search: '', department_id: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const cardActions = [
  { command: 'view', label: 'Chi tiết', icon: View },
  { command: 'edit', label: 'Sửa', icon: Edit, divided: true },
  { command: 'delete', label: 'Xóa', icon: Delete, divided: true },
]

const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: pagination.page, per_page: pagination.pageSize }
    if (searchForm.search) params.search = searchForm.search
    if (searchForm.department_id) params.department_id = searchForm.department_id
    if (searchForm.status !== '') params.status = searchForm.status
    const res = await getEmployees(params)
    tableData.value = res.data ?? []
    pagination.total = res.meta?.total ?? res.total ?? tableData.value.length
  } catch (err) { ElMessage.error(err.response?.data?.message || 'Tải dữ liệu thất bại') }
  finally { loading.value = false }
}

const fetchDepartments = async () => {
  try { const res = await getDepartments({ per_page: 999 }); departments.value = res.data ?? [] }
  catch { departments.value = [] }
}

const handleSearch = () => { pagination.page = 1; fetchData() }
const handleReset = () => { searchForm.search = ''; searchForm.department_id = ''; searchForm.status = ''; pagination.page = 1; fetchData() }
const goDetail = (row) => router.push(`/employees/${row.id}`)
const openCreate = () => { selectedId.value = null; showModal.value = true }
const openEdit = (row) => { selectedId.value = row.id; showModal.value = true }
const handleSuccess = () => fetchData()
const handleCardAction = (cmd, emp) => {
  if (cmd === 'view') goDetail(emp)
  else if (cmd === 'edit') openEdit(emp)
  else if (cmd === 'delete') handleDelete(emp)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`Xóa nhân viên "${row.full_name}"?`, 'Xác nhận', { confirmButtonText: 'Xóa', cancelButtonText: 'Hủy', type: 'warning' })
    await deleteEmployee(row.id)
    ElMessage.success('Xóa nhân viên thành công')
    fetchData()
  } catch (err) { if (err !== 'cancel') ElMessage.error(err.response?.data?.message || 'Xóa thất bại') }
}

onMounted(() => { fetchData(); fetchDepartments() })
</script>

<style scoped lang="scss">
.employees-container {
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .page-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
  .page-description { font-size: 14px; color: var(--text-secondary); margin: 0; }
  .mobile-header { margin-bottom: 16px; .mobile-title { font-size: 18px; font-weight: 700; margin: 0; } }
  .pagination-container { margin-top: 16px; display: flex; justify-content: flex-end; }
  .fab-button { position: fixed; bottom: 80px; right: 20px; z-index: 100; box-shadow: 0 4px 16px rgba(0,0,0,.2); }
  .empty-state { display: flex; justify-content: center; padding: 40px 0; }
}
</style>
