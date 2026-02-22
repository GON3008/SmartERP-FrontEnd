<template>
  <div class="employee-detail-container" v-loading="loading">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="router.back()" text>Quay lại</el-button>
        <div v-if="employee">
          <h1 class="page-title">{{ employee.full_name }}</h1>
          <el-tag :type="employee.status ? 'success' : 'danger'" effect="light">
            {{ employee.status ? 'Đang làm việc' : 'Nghỉ việc' }}
          </el-tag>
        </div>
      </div>
      <div class="header-actions" v-if="employee">
        <el-button :icon="Edit" @click="showEdit = true">Chỉnh sửa</el-button>
      </div>
    </div>

    <el-result v-if="!loading && !employee" icon="error" title="Không tìm thấy nhân viên">
      <template #extra>
        <el-button type="primary" @click="router.push('/employees')">Quay lại danh sách</el-button>
      </template>
    </el-result>

    <template v-if="employee">
      <!-- Stats -->
      <el-row :gutter="14" class="mb-md">
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--el-color-primary-light-8)">
              <el-icon color="var(--el-color-primary)" size="22"><User /></el-icon>
            </div>
            <div><div class="stat-value">{{ employee.employee_code }}</div><div class="stat-label">Mã nhân viên</div></div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--el-color-success-light-8)">
              <el-icon color="var(--el-color-success)" size="22"><OfficeBuilding /></el-icon>
            </div>
            <div><div class="stat-value" style="font-size:14px">{{ employee.department?.name ?? '—' }}</div><div class="stat-label">Phòng ban</div></div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--el-color-warning-light-8)">
              <el-icon color="var(--el-color-warning)" size="22"><Medal /></el-icon>
            </div>
            <div><div class="stat-value" style="font-size:14px">{{ employee.position?.name ?? '—' }}</div><div class="stat-label">Chức vụ</div></div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--el-color-info-light-8)">
              <el-icon color="var(--el-color-info)" size="22"><Calendar /></el-icon>
            </div>
            <div><div class="stat-value" style="font-size:13px">{{ employee.hire_date?.slice(0,10) ?? '—' }}</div><div class="stat-label">Ngày vào làm</div></div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <el-card class="mb-md">
            <template #header><span class="card-title">Thông tin cá nhân</span></template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="Mã nhân viên">
                <el-tag type="info">{{ employee.employee_code }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Họ và tên">{{ employee.full_name }}</el-descriptions-item>
              <el-descriptions-item label="Email">{{ employee.email || '—' }}</el-descriptions-item>
              <el-descriptions-item label="Số điện thoại">{{ employee.phone || '—' }}</el-descriptions-item>
              <el-descriptions-item label="Địa chỉ">{{ employee.address || '—' }}</el-descriptions-item>
              <el-descriptions-item label="Ngày vào làm">{{ employee.hire_date?.slice(0,10) ?? '—' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-card class="mb-md">
            <template #header><span class="card-title">Thông tin công việc</span></template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="Phòng ban">{{ employee.department?.name ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="Chức vụ">{{ employee.position?.name ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="Trạng thái">
                <el-tag :type="employee.status ? 'success' : 'danger'" effect="light">
                  {{ employee.status ? 'Đang làm việc' : 'Nghỉ việc' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Tài khoản">{{ employee.user?.name ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="Ngày tạo">{{ employee.created_at?.slice(0,10) ?? '—' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <EmployeeFormModal v-model="showEdit" :employee-id="employeeId" @success="fetchEmployee" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Edit, User, OfficeBuilding, Medal, Calendar } from '@element-plus/icons-vue'
import { getEmployee } from '@/api/hr'
import EmployeeFormModal from '@/components/employees/EmployeeFormModal.vue'

const route = useRoute()
const router = useRouter()

const employeeId = computed(() => Number(route.params.id))
const loading = ref(false)
const employee = ref(null)
const showEdit = ref(false)

const fetchEmployee = async () => {
  loading.value = true
  try {
    const res = await getEmployee(employeeId.value)
    employee.value = res.data
  } catch { employee.value = null }
  finally { loading.value = false }
}

onMounted(() => fetchEmployee())
</script>

<style scoped lang="scss">
.employee-detail-container {
  .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
    .header-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .header-actions { display: flex; gap: 8px; }
    .page-title { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
  }
  .stat-card { display: flex; align-items: center; gap: 14px; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 10px; padding: 14px; margin-bottom: 16px;
    .stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-value { font-size: 18px; font-weight: 700; }
    .stat-label { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
  }
  .card-title { font-weight: 600; font-size: 15px; }

  // ── Mobile ──────────────────────────────
  @media (max-width: 768px) {
    .page-header {
      .header-left { flex-direction: column; align-items: flex-start; gap: 6px; }
      .page-title { font-size: 16px; }
    }
    .stat-card { padding: 10px;
      .stat-icon { width: 36px; height: 36px; }
      .stat-value { font-size: 14px; }
    }
  }

  @media (max-width: 480px) {
    .stat-card { flex-direction: column; text-align: center; gap: 8px; }
  }
}
</style>
