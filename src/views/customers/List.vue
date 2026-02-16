<template>
  <div class="customers-container">
    <div class="page-header flex-between">
      <div>
        <h1 class="page-title">Quản lý khách hàng</h1>
        <p class="page-description">Danh sách tất cả khách hàng trong hệ thống</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        Thêm khách hàng
      </el-button>
    </div>
    
    <!-- Search and Filter -->
    <el-card class="mb-md">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="Tìm kiếm">
          <el-input
            v-model="searchForm.keyword"
            placeholder="Tên, email, số điện thoại..."
            :prefix-icon="Search"
            clearable
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            Tìm kiếm
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">
            Đặt lại
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- Data Table -->
    <el-card>
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="code" label="Mã KH" width="120" />
        <el-table-column prop="name" label="Tên khách hàng" min-width="180" />
        <el-table-column prop="email" label="Email" min-width="180" />
        <el-table-column prop="phone" label="Số điện thoại" width="140" />
        <el-table-column prop="address" label="Địa chỉ" min-width="200" show-overflow-tooltip />
        <el-table-column label="Trạng thái" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? 'Hoạt động' : 'Không hoạt động' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :icon="Edit"
              link
              @click="handleEdit(row)"
            >
              Sửa
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              link
              @click="handleDelete(row)"
            >
              Xóa
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, Edit, Delete } from '@element-plus/icons-vue'
import { getCustomers, deleteCustomer } from '@/api/customer'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])

const searchForm = reactive({
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// Sample data - Replace with actual API call
const sampleData = [
  {
    id: 1,
    code: 'KH001',
    name: 'Công ty TNHH ABC',
    email: 'contact@abc.com',
    phone: '0901234567',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    status: 'active'
  },
  {
    id: 2,
    code: 'KH002',
    name: 'Công ty CP XYZ',
    email: 'info@xyz.com',
    phone: '0907654321',
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    status: 'active'
  },
  {
    id: 3,
    code: 'KH003',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@email.com',
    phone: '0912345678',
    address: '789 Đường DEF, Quận 3, TP.HCM',
    status: 'inactive'
  },
]

const fetchData = async () => {
  loading.value = true
  try {
    // TODO: Replace with actual API call
    // const response = await getCustomers({
    //   page: pagination.page,
    //   pageSize: pagination.pageSize,
    //   keyword: searchForm.keyword
    // })
    // tableData.value = response.data
    // pagination.total = response.total
    
    // Using sample data for now
    tableData.value = sampleData
    pagination.total = sampleData.length
  } catch (error) {
    ElMessage.error('Tải dữ liệu thất bại')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  pagination.page = 1
  fetchData()
}

const handleCreate = () => {
  router.push('/customers/create')
}

const handleEdit = (row) => {
  router.push(`/customers/${row.id}/edit`)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa khách hàng "${row.name}"?`,
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    )
    
    // TODO: Call API to delete
    // await deleteCustomer(row.id)
    
    ElMessage.success('Xóa khách hàng thành công')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Xóa khách hàng thất bại')
    }
  }
}

const handleSizeChange = () => {
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.customers-container {
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
