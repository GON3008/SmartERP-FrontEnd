<template>
  <div class="customers-container">
    <!-- Page Header - Desktop only -->
    <div class="page-header flex-between" v-if="!isMobile">
      <div>
        <h1 class="page-title">Quản lý khách hàng</h1>
        <p class="page-description">Danh sách tất cả khách hàng trong hệ thống</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        Thêm khách hàng
      </el-button>
    </div>

    <!-- Mobile Header -->
    <div class="mobile-header" v-else>
      <h2 class="mobile-title">Khách hàng</h2>
    </div>
    
    <!-- Search and Filter -->
    <el-card class="mb-md search-card">
      <el-form :inline="!isMobile" :model="searchForm" class="search-form">
        <el-form-item label="Tìm kiếm" class="search-input">
          <el-input
            v-model="searchForm.keyword"
            placeholder="Tên, email, số điện thoại..."
            :prefix-icon="Search"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button type="primary" :icon="Search" @click="handleSearch">
            Tìm kiếm
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">
            Đặt lại
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- Desktop Table View -->
    <el-card v-if="!isMobile">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="Tên khách hàng" min-width="180" />
        <el-table-column prop="email" label="Email" min-width="180" />
        <el-table-column prop="phone" label="Số điện thoại" width="140" />
        <el-table-column prop="address" label="Địa chỉ" min-width="200" show-overflow-tooltip />
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

    <!-- Mobile Cards View -->
    <div v-else class="customer-cards" v-loading="loading">
      <div
        v-for="customer in tableData"
        :key="customer.id"
        class="customer-card"
      >
        <div class="card-header">
          <div class="customer-name">
            <el-icon class="name-icon"><User /></el-icon>
            <h3>{{ customer.name }}</h3>
          </div>
          <el-dropdown trigger="click" @command="(cmd) => handleCardAction(cmd, customer)">
            <el-icon class="more-icon"><MoreFilled /></el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">
                  <el-icon><Edit /></el-icon>
                  Chỉnh sửa
                </el-dropdown-item>
                <el-dropdown-item command="delete">
                  <el-icon><Delete /></el-icon>
                  Xóa
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        
        <div class="card-body">
          <div class="info-row" v-if="customer.email">
            <el-icon class="info-icon"><Message /></el-icon>
            <span class="info-text">{{ customer.email }}</span>
          </div>
          <div class="info-row" v-if="customer.phone">
            <el-icon class="info-icon"><Phone /></el-icon>
            <span class="info-text">{{ customer.phone }}</span>
          </div>
          <div class="info-row" v-if="customer.address">
            <el-icon class="info-icon"><Location /></el-icon>
            <span class="info-text">{{ customer.address }}</span>
          </div>
        </div>
      </div>

      <!-- Mobile Pagination -->
      <div class="mobile-pagination" v-if="tableData.length > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="prev, pager, next"
          small
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>

      <!-- Empty State -->
      <el-empty
        v-if="!loading && tableData.length === 0"
        description="Không có khách hàng nào"
      />
    </div>

    <!-- Mobile FAB Button -->
    <el-button
      v-if="isMobile"
      type="primary"
      :icon="Plus"
      circle
      size="large"
      class="fab-button"
      @click="handleCreate"
    />

    <!-- Customer Form Modal -->
    <CustomerFormModal
      v-model="showModal"
      :customer-id="selectedCustomerId"
      @success="handleModalSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Search, Refresh, Edit, Delete, User,
  MoreFilled, Message, Phone, Location
} from '@element-plus/icons-vue'
import { getCustomers, deleteCustomer } from '@/api/customer'
import CustomerFormModal from '@/components/customers/CustomerFormModal.vue'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()

const loading = ref(false)
const tableData = ref([])
const showModal = ref(false)
const selectedCustomerId = ref(null)
let searchTimeout = null

const searchForm = reactive({
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// Auto-search with debounce when typing
watch(() => searchForm.keyword, (newValue, oldValue) => {
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  // Set new timeout for debounce (500ms)
  searchTimeout = setTimeout(() => {
    pagination.page = 1
    fetchData()
  }, 500)
})

/**
 * Lấy danh sách khách hàng từ API
 */
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.pageSize,
    }
    
    // Thêm keyword nếu có
    if (searchForm.keyword) {
      params.search = searchForm.keyword
    }
    
    const response = await getCustomers(params)
    
    // Xử lý response từ Laravel API
    if (response.data) {
      tableData.value = response.data.map(customer => ({
        id: customer.id,
        code: customer.code,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        status: customer.status || 'active'
      }))
      
      // Cập nhật pagination
      pagination.total = response.total || response.data.length
    }
  } catch (error) {
    console.error('Fetch customers error:', error)
    ElMessage.error(error.response?.data?.message || 'Tải dữ liệu thất bại')
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
  selectedCustomerId.value = null
  showModal.value = true
}

const handleEdit = (row) => {
  selectedCustomerId.value = row.id
  showModal.value = true
}

const handleCardAction = (command, customer) => {
  if (command === 'edit') {
    handleEdit(customer)
  } else if (command === 'delete') {
    handleDelete(customer)
  }
}

const handleModalSuccess = () => {
  fetchData()
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
    
    // Gọi API xóa khách hàng
    await deleteCustomer(row.id)
    
    ElMessage.success('Xóa khách hàng thành công')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete customer error:', error)
      ElMessage.error(error.response?.data?.message || 'Xóa khách hàng thất bại')
    }
  }
}

const handleSizeChange = () => {
  pagination.page = 1
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

// Mobile Header
.mobile-header {
  margin-bottom: 16px;
  
  .mobile-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
}

// Search Form Responsive
.search-card {
  @media (max-width: 767px) {
    margin-bottom: 16px;
  }
}

.search-form {
  @media (max-width: 767px) {
    .search-input {
      width: 100%;
      margin-right: 0;
      margin-bottom: 12px;
      
      :deep(.el-input) {
        width: 100%;
      }
    }
    
    .search-buttons {
      width: 100%;
      margin-right: 0;
      
      .el-button {
        flex: 1;
      }
      
      :deep(.el-form-item__content) {
        display: flex;
        gap: 8px;
      }
    }
  }
}

// Mobile Cards
.customer-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 80px; // Space for FAB
}

.customer-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.98);
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  
  .customer-name {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    
    .name-icon {
      color: #7c3aed;
      font-size: 20px;
    }
    
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
  
  .more-icon {
    font-size: 20px;
    color: rgba(0, 0, 0, 0.45);
    cursor: pointer;
    padding: 4px;
    
    &:active {
      transform: scale(0.9);
    }
  }
}

.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  
  .info-icon {
    color: rgba(0, 0, 0, 0.45);
    font-size: 16px;
    margin-top: 2px;
    flex-shrink: 0;
  }
  
  .info-text {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.5;
    word-break: break-word;
  }
}

// Mobile Pagination
.mobile-pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding: 16px 0;
}

// FAB Button
.fab-button {
  position: fixed;
  bottom: calc(56px + env(safe-area-inset-bottom) + 16px);
  right: 16px;
  width: 56px;
  height: 56px;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
  z-index: 999;
  
  &:active {
    transform: scale(0.95);
  }
  
  :deep(.el-icon) {
    font-size: 24px;
  }
}

// Dropdown menu styling
:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
