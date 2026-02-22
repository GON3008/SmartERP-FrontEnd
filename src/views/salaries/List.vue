<template>
  <div class="salaries-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Bảng lương</h1>
        <p class="page-description">Quản lý và xem lương nhân viên theo tháng</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="showCalculate = true">Tính lương</el-button>
        <el-button type="success" :icon="DataBoard" @click="showPayroll = true">Tạo bảng lương</el-button>
      </div>
    </div>

    <!-- Filter -->
    <el-card class="mb-md">
      <el-form :inline="!isMobile" :model="filterForm">
        <el-form-item label="Tháng">
          <el-date-picker v-model="filterForm.month" type="month" placeholder="Chọn tháng" format="MM/YYYY" value-format="YYYY-MM" style="width:140px" @change="fetchData" />
        </el-form-item>
        <el-form-item label="Nhân viên">
          <el-select v-model="filterForm.employee_id" placeholder="Tất cả" clearable filterable style="min-width:180px" :loading="loadingEmps" @change="() => { pagination.page = 1; fetchData() }">
            <el-option v-for="e in employees" :key="e.id" :label="e.full_name" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchData">Lọc</el-button>
          <el-button :icon="Refresh" @click="handleReset">Đặt lại</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Summary Stats -->
    <el-row :gutter="12" class="mb-md" v-if="summary">
      <el-col :xs="12" :sm="8">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--el-color-primary-light-8)">
            <el-icon color="var(--el-color-primary)" size="22"><User /></el-icon>
          </div>
          <div>
            <div class="stat-value">{{ summary.total_employees ?? 0 }}</div>
            <div class="stat-label">Nhân viên nhận lương</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--el-color-success-light-8)">
            <el-icon color="var(--el-color-success)" size="22"><Wallet /></el-icon>
          </div>
          <div>
            <div class="stat-value">{{ formatCurrency(summary.total_net_salary ?? 0) }}</div>
            <div class="stat-label">Tổng lương thực lĩnh</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="8">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--el-color-warning-light-8)">
            <el-icon color="var(--el-color-warning)" size="22"><Minus /></el-icon>
          </div>
          <div>
            <div class="stat-value">{{ formatCurrency(summary.total_deduction ?? 0) }}</div>
            <div class="stat-label">Tổng khấu trừ</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Table -->
    <el-card>
      <el-table v-loading="loading" :data="tableData" stripe style="width:100%">
        <el-table-column label="Nhân viên" min-width="160">
          <template #default="{ row }">{{ row.employee?.full_name ?? row.employee_name ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="Phòng ban" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.employee?.department?.name ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="Tháng/Năm" width="110" align="center">
          <template #default="{ row }">{{ row.month }}/{{ row.year }}</template>
        </el-table-column>
        <el-table-column label="Lương cơ bản" width="140" align="right">
          <template #default="{ row }">{{ formatCurrency(row.base_salary) }}</template>
        </el-table-column>
        <el-table-column label="Phụ cấp" width="120" align="right">
          <template #default="{ row }">
            <span class="text-success">+{{ formatCurrency(row.allowance ?? 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Khấu trừ" width="120" align="right">
          <template #default="{ row }">
            <span class="text-danger">-{{ formatCurrency(row.deduction ?? 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Lương thực lĩnh" width="150" align="right">
          <template #default="{ row }">
            <span class="text-primary font-bold">{{ formatCurrency(row.net_salary) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="130" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" link @click="openEdit(row)">Sửa</el-button>
            <el-button type="danger" size="small" :icon="Delete" link @click="handleDelete(row)">Xóa</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !tableData.length" description="Chưa có dữ liệu lương tháng này" />
      <div class="pagination-container">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" layout="total, prev, pager, next" @current-change="fetchData" />
      </div>
    </el-card>

    <!-- Generate Payroll Dialog -->
    <el-dialog v-model="showPayroll" title="Tạo bảng lương hàng loạt" width="420px" :close-on-click-modal="false">
      <el-form :model="payrollForm" label-width="100px">
        <el-form-item label="Tháng">
          <el-date-picker v-model="payrollForm.month" type="month" format="MM/YYYY" value-format="YYYY-MM" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPayroll = false">Hủy</el-button>
        <el-button type="success" :loading="generatingPayroll" @click="handleGeneratePayroll">Tạo bảng lương</el-button>
      </template>
    </el-dialog>

    <SalaryCalculate v-model="showCalculate" :employees="employees" @success="fetchData" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, DataBoard, Search, Refresh, Edit, Delete, User, Wallet, Minus } from '@element-plus/icons-vue'
import { getSalaries, deleteSalary, getSalarySummary, generatePayroll } from '@/api/attendance'
import { getEmployees } from '@/api/hr'
import SalaryCalculate from './Calculate.vue'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()

const loading = ref(false)
const loadingEmps = ref(false)
const generatingPayroll = ref(false)
const showCalculate = ref(false)
const showPayroll = ref(false)
const tableData = ref([])
const employees = ref([])
const summary = ref(null)

const now = new Date()
const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const filterForm = reactive({ month: defaultMonth, employee_id: '' })
const payrollForm = reactive({ month: defaultMonth })
const pagination = reactive({ page: 1, pageSize: 15, total: 0 })

const formatCurrency = (v) => v != null ? Number(v).toLocaleString('vi-VN') + ' ₫' : '—'

const parseMonthYear = (m = filterForm.month) => {
  const [year, month] = (m ?? '').split('-')
  return { month: Number(month), year: Number(year) }
}

const fetchData = async () => {
  loading.value = true
  try {
    const { month, year } = parseMonthYear()
    const params = { month, year, page: pagination.page, per_page: pagination.pageSize }
    if (filterForm.employee_id) params.employee_id = filterForm.employee_id
    const [listRes, sumRes] = await Promise.all([
      getSalaries(params),
      getSalarySummary({ month, year }),
    ])
    tableData.value = listRes.data ?? []
    pagination.total = listRes.meta?.total ?? listRes.total ?? tableData.value.length
    summary.value = sumRes.data ?? null
  } catch { tableData.value = [] }
  finally { loading.value = false }
}

const handleReset = () => { filterForm.employee_id = ''; pagination.page = 1; fetchData() }
const openEdit = (row) => { /* handled via Calculate component in edit mode */ }

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('Xóa bản ghi lương này?', 'Xác nhận', { type: 'warning', confirmButtonText: 'Xóa', cancelButtonText: 'Hủy' })
    await deleteSalary(row.id)
    ElMessage.success('Xóa thành công')
    fetchData()
  } catch (err) { if (err !== 'cancel') ElMessage.error(err.response?.data?.message || 'Xóa thất bại') }
}

const handleGeneratePayroll = async () => {
  generatingPayroll.value = true
  try {
    const { month, year } = parseMonthYear(payrollForm.month)
    await generatePayroll({ month, year })
    ElMessage.success('Tạo bảng lương thành công!')
    showPayroll.value = false
    fetchData()
  } catch (err) { ElMessage.error(err.response?.data?.message || 'Tạo bảng lương thất bại') }
  finally { generatingPayroll.value = false }
}

const fetchEmployees = async () => {
  loadingEmps.value = true
  try { const res = await getEmployees({ per_page: 999 }); employees.value = res.data ?? [] }
  catch { employees.value = [] }
  finally { loadingEmps.value = false }
}

onMounted(() => { fetchData(); fetchEmployees() })
</script>

<style scoped lang="scss">
.salaries-container {
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;
    .page-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .page-description { font-size: 14px; color: var(--text-secondary); margin: 0; }
    .header-actions { display: flex; gap: 8px; }
  }
  .stat-card { display: flex; align-items: center; gap: 14px; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 10px; padding: 14px; margin-bottom: 14px;
    .stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-value { font-size: 16px; font-weight: 700; }
    .stat-label { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
  }
  .pagination-container { margin-top: 16px; display: flex; justify-content: flex-end; }
  .text-success { color: var(--el-color-success); }
  .text-danger { color: var(--el-color-danger); }
  .text-primary { color: var(--el-color-primary); }
  .font-bold { font-weight: 700; }
}
</style>
