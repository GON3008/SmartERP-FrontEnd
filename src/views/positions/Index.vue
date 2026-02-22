<template>
  <div class="positions-container">
    <div class="page-header" v-if="!isMobile">
      <div>
        <h1 class="page-title">Quản lý chức vụ</h1>
        <p class="page-description">Danh sách các chức vụ trong công ty</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate">Thêm chức vụ</el-button>
    </div>
    <div class="mobile-header" v-else>
      <h2 class="mobile-title">Chức vụ</h2>
    </div>

    <el-card class="mb-md">
      <el-form :inline="!isMobile" :model="searchForm">
        <el-form-item label="Tìm kiếm">
          <el-input v-model="searchForm.search" placeholder="Tên chức vụ..." :prefix-icon="Search" clearable @clear="handleSearch" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">Tìm</el-button>
          <el-button :icon="Refresh" @click="handleReset">Đặt lại</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="16">
      <!-- Position Cards Grid -->
      <el-col :xs="24" :sm="16" :md="18">
        <el-card>
          <div v-loading="loading" class="positions-grid">
            <div v-for="pos in tableData" :key="pos.id" class="position-card">
              <div class="position-icon">
                <el-icon size="26" color="var(--el-color-primary)"><Medal /></el-icon>
              </div>
              <div class="position-info">
                <div class="position-name">{{ pos.name }}</div>
                <div class="position-count">
                  <el-tag type="info" size="small" effect="plain">
                    {{ pos.employees_count ?? pos.employees?.length ?? 0 }} nhân viên
                  </el-tag>
                </div>
              </div>
              <div class="position-actions">
                <el-button type="primary" size="small" :icon="Edit" circle @click="openEdit(pos)" />
                <el-button type="danger" size="small" :icon="Delete" circle @click="handleDelete(pos)" />
              </div>
            </div>
            <el-empty v-if="!loading && !tableData.length" description="Chưa có chức vụ nào" />
          </div>

          <div class="pagination-container">
            <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[12, 24, 48]" layout="total, sizes, prev, pager, next" @size-change="() => { pagination.page = 1; fetchData() }" @current-change="fetchData" />
          </div>
        </el-card>
      </el-col>

      <!-- Stats sidebar -->
      <el-col :xs="24" :sm="8" :md="6">
        <el-card>
          <template #header><span class="card-title">Thống kê</span></template>
          <div class="stats-list">
            <div class="stats-item">
              <span class="stats-label">Tổng chức vụ</span>
              <span class="stats-value">{{ pagination.total }}</span>
            </div>
          </div>
          <el-divider />
          <el-button type="primary" :icon="Plus" style="width:100%" @click="openCreate">Thêm chức vụ mới</el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-button v-if="isMobile" type="primary" :icon="Plus" circle size="large" class="fab-button" @click="openCreate" />
    <PositionFormModal v-model="showModal" :position-id="selectedId" @success="fetchData" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Refresh, Medal } from '@element-plus/icons-vue'
import { getPositions, deletePosition } from '@/api/hr'
import PositionFormModal from '@/components/positions/PositionFormModal.vue'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()

const loading = ref(false)
const tableData = ref([])
const showModal = ref(false)
const selectedId = ref(null)
const searchForm = reactive({ search: '' })
const pagination = reactive({ page: 1, pageSize: 12, total: 0 })

const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: pagination.page, per_page: pagination.pageSize }
    if (searchForm.search) params.search = searchForm.search
    const res = await getPositions(params)
    tableData.value = res.data ?? []
    pagination.total = res.meta?.total ?? res.total ?? tableData.value.length
  } catch (err) { ElMessage.error(err.response?.data?.message || 'Tải dữ liệu thất bại') }
  finally { loading.value = false }
}

const handleSearch = () => { pagination.page = 1; fetchData() }
const handleReset = () => { searchForm.search = ''; pagination.page = 1; fetchData() }
const openCreate = () => { selectedId.value = null; showModal.value = true }
const openEdit = (pos) => { selectedId.value = pos.id; showModal.value = true }

const handleDelete = async (pos) => {
  try {
    await ElMessageBox.confirm(`Xóa chức vụ "${pos.name}"?`, 'Xác nhận', { confirmButtonText: 'Xóa', cancelButtonText: 'Hủy', type: 'warning' })
    await deletePosition(pos.id)
    ElMessage.success('Xóa chức vụ thành công')
    fetchData()
  } catch (err) { if (err !== 'cancel') ElMessage.error(err.response?.data?.message || 'Xóa thất bại') }
}

onMounted(() => fetchData())
</script>

<style scoped lang="scss">
.positions-container {
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .page-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
  .page-description { font-size: 14px; color: var(--text-secondary); margin: 0; }
  .mobile-header { margin-bottom: 16px; .mobile-title { font-size: 18px; font-weight: 700; margin: 0; } }
  .card-title { font-weight: 600; font-size: 15px; }
  .pagination-container { margin-top: 16px; display: flex; justify-content: flex-end; }
  .fab-button { position: fixed; bottom: 80px; right: 20px; z-index: 100; box-shadow: 0 4px 16px rgba(0,0,0,.2); }

  .positions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
    min-height: 120px;

    .position-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 10px;
      background: var(--el-fill-color-extra-light);
      transition: all 0.2s;

      &:hover {
        border-color: var(--el-color-primary-light-5);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
      }

      .position-icon {
        width: 44px; height: 44px;
        background: var(--el-color-primary-light-9);
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }

      .position-info { flex: 1; min-width: 0;
        .position-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      }

      .position-actions { display: flex; gap: 4px; flex-shrink: 0; }
    }
  }

  .stats-list {
    .stats-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--el-border-color-lighter); &:last-child { border-bottom: none; }
      .stats-label { font-size: 13px; color: var(--text-secondary); }
      .stats-value { font-size: 18px; font-weight: 700; color: var(--el-color-primary); }
    }
  }
}
</style>
