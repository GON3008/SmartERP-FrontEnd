<template>
  <div class="departments-container">
    <div class="page-header" v-if="!isMobile">
      <div>
        <h1 class="page-title">Quản lý phòng ban</h1>
        <p class="page-description">Danh sách phòng ban trong công ty</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate">Thêm phòng ban</el-button>
    </div>
    <div class="mobile-header" v-else>
      <h2 class="mobile-title">Phòng ban</h2>
    </div>

    <el-card class="mb-md">
      <el-form :inline="!isMobile" :model="searchForm">
        <el-form-item label="Tìm kiếm">
          <el-input v-model="searchForm.search" placeholder="Tên phòng ban..." :prefix-icon="Search" clearable @clear="handleSearch" @keyup.enter="handleSearch" />
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
        <el-table-column type="index" label="#" width="55" align="center" />
        <el-table-column prop="name" label="Tên phòng ban" min-width="180" />
        <el-table-column prop="description" label="Mô tả" min-width="240" show-overflow-tooltip />
        <el-table-column label="Số NV" width="90" align="center">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain">{{ row.employees_count ?? row.employees?.length ?? 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="Edit" link @click="openEdit(row)">Sửa</el-button>
            <el-button type="danger" size="small" :icon="Delete" link @click="handleDelete(row)">Xóa</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize" :total="pagination.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @size-change="() => { pagination.page = 1; fetchData() }" @current-change="fetchData" />
      </div>
    </el-card>

    <!-- Mobile -->
    <div v-else class="dept-cards" v-loading="loading">
      <MobileCard v-for="d in tableData" :key="d.id" :title="d.name" :icon="OfficeBuilding" :actions="cardActions" @action="(cmd) => handleCardAction(cmd, d)">
        <CardInfoRow :icon="Document" :value="d.description || 'Không có mô tả'" />
        <CardInfoRow :icon="User" :value="`${d.employees_count ?? 0} nhân viên`" />
      </MobileCard>
      <div v-if="!tableData.length && !loading" class="empty-state"><el-empty description="Không có phòng ban" /></div>
    </div>

    <el-button v-if="isMobile" type="primary" :icon="Plus" circle size="large" class="fab-button" @click="openCreate" />
    <DepartmentFormModal v-model="showModal" :department-id="selectedId" @success="fetchData" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Refresh, OfficeBuilding, Document, User } from '@element-plus/icons-vue'
import { getDepartments, deleteDepartment } from '@/api/hr'
import DepartmentFormModal from '@/components/departments/DepartmentFormModal.vue'
import { useResponsive } from '@/composables/useResponsive'
import MobileCard from '@/components/common/MobileCard.vue'
import CardInfoRow from '@/components/common/CardInfoRow.vue'

const { isMobile } = useResponsive()

const loading = ref(false)
const tableData = ref([])
const showModal = ref(false)
const selectedId = ref(null)
const searchForm = reactive({ search: '' })
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const cardActions = [
  { command: 'edit', label: 'Sửa', icon: Edit },
  { command: 'delete', label: 'Xóa', icon: Delete, divided: true },
]

const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: pagination.page, per_page: pagination.pageSize }
    if (searchForm.search) params.search = searchForm.search
    const res = await getDepartments(params)
    tableData.value = res.data ?? []
    pagination.total = res.meta?.total ?? res.total ?? tableData.value.length
  } catch (err) { ElMessage.error(err.response?.data?.message || 'Tải dữ liệu thất bại') }
  finally { loading.value = false }
}

const handleSearch = () => { pagination.page = 1; fetchData() }
const handleReset = () => { searchForm.search = ''; pagination.page = 1; fetchData() }
const openCreate = () => { selectedId.value = null; showModal.value = true }
const openEdit = (row) => { selectedId.value = row.id; showModal.value = true }
const handleCardAction = (cmd, d) => { if (cmd === 'edit') openEdit(d); else if (cmd === 'delete') handleDelete(d) }

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`Xóa phòng ban "${row.name}"?`, 'Xác nhận', { confirmButtonText: 'Xóa', cancelButtonText: 'Hủy', type: 'warning' })
    await deleteDepartment(row.id)
    ElMessage.success('Xóa phòng ban thành công')
    fetchData()
  } catch (err) { if (err !== 'cancel') ElMessage.error(err.response?.data?.message || 'Xóa thất bại') }
}

onMounted(() => fetchData())
</script>

<style scoped lang="scss">
.departments-container {
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .page-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
  .page-description { font-size: 14px; color: var(--text-secondary); margin: 0; }
  .mobile-header { margin-bottom: 16px; .mobile-title { font-size: 18px; font-weight: 700; margin: 0; } }
  .pagination-container { margin-top: 16px; display: flex; justify-content: flex-end; }
  .fab-button { position: fixed; bottom: 80px; right: 20px; z-index: 100; box-shadow: 0 4px 16px rgba(0,0,0,.2); }
  .empty-state { display: flex; justify-content: center; padding: 40px 0; }
}
</style>
