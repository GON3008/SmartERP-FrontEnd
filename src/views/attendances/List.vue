<template>
  <div class="attendance-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Chấm công</h1>
        <p class="page-description">Theo dõi chấm công nhân viên theo tháng</p>
      </div>
      <el-button type="success" :icon="AlarmClock" @click="showCheckIn = true">Check-in / Check-out</el-button>
    </div>

    <!-- Filter Bar -->
    <el-card class="mb-md">
      <el-form :inline="!isMobile" :model="filterForm">
        <el-form-item label="Nhân viên">
          <el-select v-model="filterForm.employee_id" placeholder="Chọn nhân viên" filterable clearable style="min-width:180px" :loading="loadingEmps">
            <el-option v-for="e in employees" :key="e.id" :label="e.full_name" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Tháng">
          <el-date-picker v-model="filterForm.month" type="month" placeholder="Chọn tháng" format="MM/YYYY" value-format="YYYY-MM" style="width:140px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchReport">Xem báo cáo</el-button>
          <el-button :icon="Refresh" @click="handleReset">Đặt lại</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Stats Strip -->
    <el-row :gutter="12" class="mb-md" v-if="report">
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-success">
          <div class="stat-num">{{ report.present_days ?? 0 }}</div>
          <div class="stat-lbl">Ngày có mặt</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-danger">
          <div class="stat-num">{{ report.absent_days ?? 0 }}</div>
          <div class="stat-lbl">Ngày vắng</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-warning">
          <div class="stat-num">{{ report.late_days ?? 0 }}</div>
          <div class="stat-lbl">Ngày đi muộn</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-info">
          <div class="stat-num">{{ report.total_overtime_hours ?? 0 }}h</div>
          <div class="stat-lbl">Tổng tăng ca</div>
        </div>
      </el-col>
    </el-row>

    <!-- Monthly Summary Table -->
    <el-card>
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="card-title">{{ filterForm.employee_id ? 'Bảng công cá nhân' : 'Tổng hợp tháng' }}</span>
          <el-button size="small" :icon="Refresh" @click="fetchMonthly" :loading="loading">Làm mới</el-button>
        </div>
      </template>

      <!-- Monthly Summary Mode (no employee selected) -->
      <template v-if="!filterForm.employee_id">
        <el-table v-loading="loading" :data="tableData" stripe style="width:100%">
          <el-table-column label="Mã NV" width="110" prop="employee_code" />
          <el-table-column label="Nhân viên" min-width="150" prop="employee_name" />
          <el-table-column label="Ngày có mặt" width="120" align="center" prop="working_days" />
          <el-table-column label="Ngày đi muộn" width="120" align="center" prop="late_days" />
          <el-table-column label="Về sớm" width="90" align="center" prop="early_departures" />
          <el-table-column label="Tổng giờ" width="100" align="center">
            <template #default="{ row }">{{ row.total_hours ?? 0 }}h</template>
          </el-table-column>
          <el-table-column label="Tăng ca" width="90" align="center">
            <template #default="{ row }">{{ row.overtime_hours ?? 0 }}h</template>
          </el-table-column>
        </el-table>
      </template>

      <!-- Individual Report Mode (employee selected) -->
      <template v-else>
        <el-table v-loading="loading" :data="tableData" stripe style="width:100%">
          <el-table-column label="Ngày" width="120" prop="date" />
          <el-table-column label="Check-in" width="100" align="center">
            <template #default="{ row }">{{ row.check_in ?? '—' }}</template>
          </el-table-column>
          <el-table-column label="Check-out" width="100" align="center">
            <template #default="{ row }">{{ row.check_out ?? '—' }}</template>
          </el-table-column>
          <el-table-column label="Giờ làm" width="90" align="center">
            <template #default="{ row }">{{ row.working_hours ?? '—' }}</template>
          </el-table-column>
          <el-table-column label="Trạng thái" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small" effect="light">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <el-empty v-if="!loading && !tableData.length" description="Không có dữ liệu chấm công" />

    </el-card>

    <!-- Check-in Modal -->
    <AttendanceCheckIn v-model="showCheckIn" :employees="employees" @success="fetchMonthly" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { AlarmClock, Search, Refresh } from '@element-plus/icons-vue'
import { getMonthlySummary, getAttendanceReport } from '@/api/attendance'
import { getEmployees } from '@/api/hr'
import AttendanceCheckIn from './CheckIn.vue'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()

const loading = ref(false)
const loadingEmps = ref(false)
const showCheckIn = ref(false)
const tableData = ref([])
const employees = ref([])
const report = ref(null)

const now = new Date()
const filterForm = reactive({
  employee_id: '',
  month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
})

const statusLabel = (s) => ({ present: 'Có mặt', absent: 'Vắng', late: 'Đi muộn', half_day: 'Nửa ngày' }[s] ?? s ?? '—')
const statusType = (s) => ({ present: 'success', absent: 'danger', late: 'warning', half_day: 'info' }[s] ?? 'info')

const parseMonthYear = () => {
  const [year, month] = (filterForm.month ?? '').split('-')
  return { month: Number(month), year: Number(year) }
}

const fetchMonthly = async () => {
  loading.value = true
  report.value = null
  try {
    const { month, year } = parseMonthYear()
    if (filterForm.employee_id) {
      const res = await getAttendanceReport({ employee_id: filterForm.employee_id, month, year })
      const data = res.data ?? {}
      report.value = data
      tableData.value = data.attendances ?? data.records ?? []
    } else {
      const res = await getMonthlySummary({ month, year })
      tableData.value = res.data?.summary ?? []
    }
  } catch { tableData.value = [] }
  finally { loading.value = false }
}

const fetchReport = () => fetchMonthly()
const handleReset = () => { filterForm.employee_id = ''; fetchMonthly() }

const fetchEmployees = async () => {
  loadingEmps.value = true
  try { const res = await getEmployees({ per_page: 999 }); employees.value = res.data ?? [] }
  catch { employees.value = [] }
  finally { loadingEmps.value = false }
}

onMounted(() => { fetchEmployees(); fetchMonthly() })
</script>

<style scoped lang="scss">
.attendance-container {
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
    .page-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .page-description { font-size: 14px; color: var(--text-secondary); margin: 0; }
  }
  .card-title { font-weight: 600; font-size: 15px; }

  .stat-card {
    border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 14px;
    .stat-num { font-size: 28px; font-weight: 800; }
    .stat-lbl { font-size: 12px; margin-top: 4px; opacity: 0.8; }
    &.stat-success { background: linear-gradient(135deg, #67c23a20, #67c23a10); border: 1px solid #67c23a40; color: #5dab30; }
    &.stat-danger { background: linear-gradient(135deg, #f56c6c20, #f56c6c10); border: 1px solid #f56c6c40; color: #e84040; }
    &.stat-warning { background: linear-gradient(135deg, #e6a23c20, #e6a23c10); border: 1px solid #e6a23c40; color: #cf8b2c; }
    &.stat-info { background: linear-gradient(135deg, #409eff20, #409eff10); border: 1px solid #409eff40; color: #2e8be8; }
  }
}
</style>
