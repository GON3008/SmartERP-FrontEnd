<template>
  <div class="warehouses-container">
    <div class="page-header" v-if="!isMobile">
      <div>
        <h1 class="page-title">Quản lý kho hàng</h1>
        <p class="page-description">Danh sách tất cả kho trong hệ thống</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate">Thêm kho</el-button>
    </div>

    <div class="mobile-header" v-else>
      <h2 class="mobile-title">Kho hàng</h2>
    </div>

    <!-- Search -->
    <el-card class="mb-md">
      <el-form :inline="!isMobile" :model="searchForm">
        <el-form-item label="Tìm kiếm">
          <el-input
            v-model="searchForm.search"
            placeholder="Tên kho, địa chỉ..."
            :prefix-icon="Search"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">Tìm</el-button>
          <el-button :icon="Refresh" @click="handleReset">Đặt lại</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Stats Overview -->
    <el-row :gutter="14" class="mb-md" v-if="!loading && tableData.length">
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--el-color-primary-light-8)">
            <el-icon color="var(--el-color-primary)" size="22"><OfficeBuilding /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ pagination.total }}</div>
            <div class="stat-label">Tổng số kho</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Desktop Table -->
    <el-card v-if="!isMobile">
      <el-table v-loading="loading" :data="tableData" stripe style="width:100%">
        <el-table-column type="index" label="#" width="55" align="center" />
        <el-table-column prop="name" label="Tên kho" min-width="180" />
        <el-table-column prop="location" label="Địa chỉ" min-width="220" show-overflow-tooltip />
        <el-table-column prop="capacity" label="Sức chứa" width="120" align="center">
          <template #default="{ row }">
            {{ row.capacity ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="200" fixed="right">
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

    <!-- Mobile Cards -->
    <div v-else class="warehouse-cards" v-loading="loading">
      <MobileCard
        v-for="w in tableData" :key="w.id"
        :title="w.name" :icon="OfficeBuilding"
        :actions="cardActions"
        @action="(cmd) => handleCardAction(cmd, w)"
      >
        <CardInfoRow :icon="Location" :value="w.location || 'Chưa có địa chỉ'" />
        <CardInfoRow :icon="DataBoard" :value="w.capacity ? `Sức chứa: ${w.capacity}` : 'Chưa có sức chứa'" />
      </MobileCard>
      <div v-if="!tableData.length && !loading" class="empty-state">
        <el-empty description="Không có kho nào" />
      </div>
    </div>

    <el-button
      v-if="isMobile" type="primary" :icon="Plus"
      circle size="large" class="fab-button" @click="openCreate"
    />

    <WarehouseFormModal v-model="showModal" :warehouse-id="selectedId" @success="handleSuccess" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Refresh, View, OfficeBuilding, Location, DataBoard } from '@element-plus/icons-vue'
import { getWarehouses, deleteWarehouse } from '@/api/warehouse'
import WarehouseFormModal from '@/components/warehouses/WarehouseFormModal.vue'
import { useResponsive } from '@/composables/useResponsive'
import MobileCard from '@/components/common/MobileCard.vue'
import CardInfoRow from '@/components/common/CardInfoRow.vue'

const router = useRouter()
const { isMobile } = useResponsive()

const loading = ref(false)
const tableData = ref([])
const showModal = ref(false)
const selectedId = ref(null)
const searchForm = reactive({ search: '' })
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
    const res = await getWarehouses(params)
    tableData.value = res.data ?? []
    pagination.total = res.meta?.total ?? res.total ?? tableData.value.length
  } catch (err) {
    ElMessage.error(err.response?.data?.message || 'Tải dữ liệu thất bại')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.page = 1; fetchData() }
const handleReset = () => { searchForm.search = ''; pagination.page = 1; fetchData() }
const goDetail = (row) => router.push(`/warehouses/${row.id}`)
const openCreate = () => { selectedId.value = null; showModal.value = true }
const openEdit = (row) => { selectedId.value = row.id; showModal.value = true }
const handleSuccess = () => fetchData()
const handleCardAction = (cmd, w) => {
  if (cmd === 'view') goDetail(w)
  else if (cmd === 'edit') openEdit(w)
  else if (cmd === 'delete') handleDelete(w)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`Xóa kho "${row.name}"?`, 'Xác nhận', {
      confirmButtonText: 'Xóa', cancelButtonText: 'Hủy', type: 'warning',
    })
    await deleteWarehouse(row.id)
    ElMessage.success('Xóa kho thành công')
    fetchData()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(err.response?.data?.message || 'Xóa thất bại')
  }
}

onMounted(() => fetchData())
</script>

<style scoped lang="scss">
.warehouses-container {
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .page-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
  .page-description { font-size: 14px; color: var(--text-secondary); margin: 0; }
  .mobile-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
    .mobile-title { font-size: 18px; font-weight: 700; margin: 0; }
  }
  .pagination-container { margin-top: 16px; display: flex; justify-content: flex-end; }
  .stat-card {
    display: flex; align-items: center; gap: 12px;
    background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px; padding: 14px; margin-bottom: 16px;
    .stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .stat-info { .stat-value { font-size: 20px; font-weight: 700; } .stat-label { font-size: 12px; color: var(--text-secondary); } }
  }
  .fab-button { position: fixed; bottom: 80px; right: 20px; z-index: 100; box-shadow: 0 4px 16px rgba(0,0,0,.2); }
  .empty-state { display: flex; justify-content: center; padding: 40px 0; }
}
</style>
