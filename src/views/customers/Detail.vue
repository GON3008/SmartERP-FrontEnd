<template>
  <div class="customer-detail" v-loading="loading">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="$router.back()">Quay lại</el-button>
        <div v-if="customer">
          <h1 class="page-title">{{ customer.name }}</h1>
          <p class="page-sub">{{ customer.email }}</p>
        </div>
      </div>
      <div class="header-actions" v-if="customer">
        <el-button :icon="Edit" @click="showEditForm = true">Chỉnh sửa</el-button>
        <el-popconfirm title="Bạn có chắc muốn xóa khách hàng này?" @confirm="handleDelete">
          <template #reference>
            <el-button type="danger" :icon="Delete">Xóa</el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>

    <div v-if="customer" class="detail-layout">
      <!-- Left: Profile card + stats -->
      <div class="detail-left">
        <!-- Profile -->
        <el-card class="profile-card mb-md">
          <div class="avatar-area">
            <el-avatar :size="72" :style="{ background: avatarColor(customer.name), fontSize: '26px', fontWeight: 700 }">
              {{ initials(customer.name) }}
            </el-avatar>
            <div class="profile-info">
              <h2 class="profile-name">{{ customer.name }}</h2>
              <p class="profile-email">{{ customer.email ?? '—' }}</p>
              <p class="profile-phone"><el-icon><Phone /></el-icon> {{ customer.phone ?? '—' }}</p>
            </div>
          </div>
          <el-divider />
          <el-descriptions :column="1" :label-width="120">
            <el-descriptions-item label="Địa chỉ">{{ customer.address ?? '—' }}</el-descriptions-item>
            <el-descriptions-item label="Ngày tạo">{{ fmtDate(customer.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="Cập nhật">{{ fmtDate(customer.updated_at) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- Stats -->
        <el-card v-loading="loadingStats">
          <template #header><span class="card-title">Thống kê</span></template>
          <el-row :gutter="10">
            <el-col :span="12" v-for="s in statItems" :key="s.key">
              <div class="stat-mini" :style="{ background: s.bg, borderColor: s.border, color: s.color }">
                <div class="stat-mini-num">{{ stats?.[s.key] ?? 0 }}</div>
                <div class="stat-mini-lbl">{{ s.label }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </div>

      <!-- Right: Orders -->
      <div class="detail-right">
        <el-card v-loading="loadingOrders">
          <template #header>
            <div class="card-header">
              <span class="card-title">Lịch sử đơn hàng</span>
              <div class="filter-row">
                <el-select v-model="orderFilter.status" placeholder="Trạng thái" clearable size="small" style="width:130px" @change="fetchOrders">
                  <el-option label="Chờ xử lý" value="pending" />
                  <el-option label="Đang xử lý" value="processing" />
                  <el-option label="Hoàn thành" value="completed" />
                  <el-option label="Đã hủy" value="cancelled" />
                </el-select>
              </div>
            </div>
          </template>
          <el-table :data="orders" stripe style="width:100%">
            <el-table-column label="Mã đơn" width="130">
              <template #default="{ row }">
                <span class="mono">{{ row.order_code }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Ngày đặt" width="115">
              <template #default="{ row }">{{ fmtDate(row.order_date ?? row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="Trạng thái" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="orderTagType(row.status)" size="small" effect="light">{{ orderLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Tổng tiền" min-width="130" align="right">
              <template #default="{ row }">
                <span class="price">{{ fmtPrice(row.total_amount ?? row.total) }} đ</span>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!loadingOrders && !orders.length" description="Chưa có đơn hàng nào" :image-size="60" />
          <div class="pagination-bar" v-if="orderTotal > orderPerPage">
            <el-pagination v-model:current-page="orderPage" :page-size="orderPerPage" :total="orderTotal" layout="prev, pager, next" size="small" @current-change="fetchOrders" />
          </div>
        </el-card>
      </div>
    </div>

    <!-- Edit Modal -->
    <CustomerFormModal v-if="showEditForm && customer" v-model="showEditForm" :customer="customer" @saved="fetchCustomer" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Edit, Delete, Phone } from '@element-plus/icons-vue'
import { getCustomer, deleteCustomer, getCustomerOrders, getCustomerStatistics } from '@/api/customer'
// Reuse customer form modal from List page
import CustomerFormModal from '@/components/customers/CustomerFormModal.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const loadingOrders = ref(false)
const loadingStats = ref(false)
const customer = ref(null)
const orders = ref([])
const orderTotal = ref(0)
const orderPage = ref(1)
const orderPerPage = 15
const stats = ref(null)
const showEditForm = ref(false)
const orderFilter = reactive({ status: '' })

const statItems = [
  { key: 'total_orders', label: 'Tổng đơn', bg: '#409eff15', border: '#409eff40', color: '#2e8be8' },
  { key: 'completed_orders', label: 'Hoàn thành', bg: '#67c23a15', border: '#67c23a40', color: '#5dab30' },
  { key: 'total_revenue', label: 'Doanh thu', bg: '#e6a23c15', border: '#e6a23c40', color: '#cf8b2c' },
  { key: 'cancelled_orders', label: 'Đã huỷ', bg: '#f56c6c15', border: '#f56c6c40', color: '#e84040' },
]

const initials = (n = '') => n.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
const avatarColor = (n = '') => ['#0ea5e9','#6366f1','#22c55e','#f59e0b','#ef4444'][n.charCodeAt(0) % 5]
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'
const fmtPrice = (v) => Number(v || 0).toLocaleString('vi-VN')
const orderLabel = (s) => ({ pending: 'Chờ xử lý', processing: 'Đang xử lý', completed: 'Hoàn thành', cancelled: 'Đã hủy' }[s] ?? s ?? '—')
const orderTagType = (s) => ({ pending: 'warning', processing: 'primary', completed: 'success', cancelled: 'danger' }[s] ?? 'info')

const fetchCustomer = async () => {
  loading.value = true
  try { const r = await getCustomer(route.params.id); customer.value = r.data ?? r } catch { router.push('/customers') }
  finally { loading.value = false }
}

const fetchOrders = async () => {
  loadingOrders.value = true
  try {
    const params = { page: orderPage.value, per_page: orderPerPage }
    if (orderFilter.status) params.status = orderFilter.status
    const r = await getCustomerOrders(route.params.id, params)
    orders.value = r.data ?? r
    orderTotal.value = r.total ?? r.meta?.total ?? orders.value.length
  } catch { orders.value = [] }
  finally { loadingOrders.value = false }
}

const fetchStats = async () => {
  loadingStats.value = true
  try { const r = await getCustomerStatistics(route.params.id); stats.value = r.data ?? r } catch {}
  finally { loadingStats.value = false }
}

const handleDelete = async () => {
  try {
    await deleteCustomer(route.params.id)
    ElMessage.success('Đã xóa khách hàng!'); router.push('/customers')
  } catch { ElMessage.error('Không thể xóa') }
}

onMounted(() => { fetchCustomer(); fetchOrders(); fetchStats() })
</script>

<style scoped lang="scss">
.customer-detail {
  .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;
    .header-left { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .header-actions { display: flex; gap: 8px; }
    .page-title { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .page-sub { font-size: 13px; color: var(--text-secondary); margin: 0; }
  }
  .detail-layout { display: grid; grid-template-columns: 340px 1fr; gap: 16px;
    @media (max-width: 900px) { grid-template-columns: 1fr; }
  }
  .profile-card {
    .avatar-area { display: flex; gap: 16px; align-items: flex-start;
      .profile-name { font-size: 18px; font-weight: 700; margin: 0 0 2px; }
      .profile-email { font-size: 13px; color: var(--text-secondary); margin: 0 0 4px; }
      .profile-phone { font-size: 13px; color: var(--text-secondary); margin: 0; display: flex; align-items: center; gap: 4px; }
    }
  }
  .card-title { font-size: 15px; font-weight: 600; }
  .card-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .stat-mini { border-radius: 10px; border: 1px solid; padding: 12px; text-align: center; margin-bottom: 10px;
    .stat-mini-num { font-size: 22px; font-weight: 800; }
    .stat-mini-lbl { font-size: 11px; opacity: 0.8; margin-top: 2px; }
  }
  .mono { font-family: monospace; font-weight: 700; }
  .price { font-weight: 600; color: var(--el-color-primary); }
  .pagination-bar { display: flex; justify-content: center; margin-top: 12px; }
  .mb-md { margin-bottom: 16px; }
}
</style>
