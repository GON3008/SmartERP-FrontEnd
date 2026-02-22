<template>
  <div class="order-detail-container" v-loading="loading">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="router.back()" text>Quay lại</el-button>
        <div class="header-info" v-if="order">
          <h1 class="page-title">{{ order.order_code }}</h1>
          <el-tag :type="statusType(order.status)" effect="light" class="status-tag">
            {{ statusLabel(order.status) }}
          </el-tag>
        </div>
      </div>
      <div class="header-actions" v-if="order">
        <el-button
          v-if="order.status === 'pending'"
          :icon="Edit"
          @click="openEditModal"
        >Chỉnh sửa</el-button>
        <el-button
          v-if="order.status === 'pending' || order.status === 'processing'"
          type="success"
          :icon="Check"
          :loading="processing"
          @click="handleProcess"
        >Xử lý xuất kho</el-button>
        <el-button
          v-if="order.status !== 'cancelled' && order.status !== 'completed'"
          type="warning"
          :icon="Close"
          :loading="cancelling"
          @click="handleCancel"
        >Hủy đơn</el-button>
      </div>
    </div>

    <!-- Not found -->
    <el-result
      v-if="!loading && !order"
      icon="error"
      title="Không tìm thấy đơn hàng"
      sub-title="Đơn hàng không tồn tại hoặc đã bị xóa."
    >
      <template #extra>
        <el-button type="primary" @click="router.push('/orders')">Quay lại danh sách</el-button>
      </template>
    </el-result>

    <template v-if="order">
      <!-- Stats Row -->
      <el-row :gutter="16" class="mb-md">
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: var(--el-color-primary-light-8)">
              <el-icon color="var(--el-color-primary)" size="22"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ order.items?.length ?? 0 }}</div>
              <div class="stat-label">Sản phẩm</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: var(--el-color-success-light-8)">
              <el-icon color="var(--el-color-success)" size="22"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value" style="font-size: 15px">{{ formatPrice(order.total_amount) }}</div>
              <div class="stat-label">Tổng tiền (VNĐ)</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: var(--el-color-warning-light-8)">
              <el-icon color="var(--el-color-warning)" size="22"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value" style="font-size: 14px">{{ order.customer?.name ?? '—' }}</div>
              <div class="stat-label">Khách hàng</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: var(--el-color-info-light-8)">
              <el-icon color="var(--el-color-info)" size="22"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value" style="font-size: 14px">{{ order.order_date }}</div>
              <div class="stat-label">Ngày đặt hàng</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <!-- Order Info -->
        <el-col :xs="24" :md="10">
          <el-card class="mb-md">
            <template #header><span class="card-title">Thông tin đơn hàng</span></template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="Mã đơn hàng">
                <el-tag type="info">{{ order.order_code }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Khách hàng">
                <a
                  v-if="order.customer_id"
                  class="link-text"
                  @click="router.push(`/customers/${order.customer_id}`)"
                >
                  {{ order.customer?.name ?? '—' }}
                </a>
                <span v-else>—</span>
              </el-descriptions-item>
              <el-descriptions-item label="Ngày đặt hàng">{{ order.order_date }}</el-descriptions-item>
              <el-descriptions-item label="Trạng thái">
                <el-tag :type="statusType(order.status)" effect="light">
                  {{ statusLabel(order.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Tổng tiền">
                <span class="price-text">{{ formatPrice(order.total_amount) }} VNĐ</span>
              </el-descriptions-item>
              <el-descriptions-item label="Ngày tạo" v-if="order.created_at">
                {{ formatDate(order.created_at) }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <!-- Order Items -->
        <el-col :xs="24" :md="14">
          <el-card class="mb-md">
            <template #header>
              <span class="card-title">Danh sách sản phẩm</span>
            </template>
            <el-table :data="order.items ?? order.order_items ?? []" stripe>
              <el-table-column type="index" label="#" width="45" align="center" />
              <el-table-column label="Sản phẩm" min-width="160">
                <template #default="{ row }">
                  <div class="product-info">
                    <span class="product-name">{{ row.product?.name ?? row.product_name ?? '—' }}</span>
                    <el-tag type="info" size="small" v-if="row.product?.sku">
                      {{ row.product.sku }}
                    </el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="SL" width="70" align="center" />
              <el-table-column label="Đơn giá" width="120" align="right">
                <template #default="{ row }">
                  {{ formatPrice(row.price) }}
                </template>
              </el-table-column>
              <el-table-column label="Thành tiền" width="130" align="right">
                <template #default="{ row }">
                  <span class="line-total">{{ formatPrice(row.quantity * row.price) }}</span>
                </template>
              </el-table-column>
            </el-table>

            <!-- Footer total -->
            <div class="items-total">
              <span>Tổng cộng:</span>
              <span class="total-amount">{{ formatPrice(order.total_amount) }} VNĐ</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- Edit Modal -->
    <OrderFormModal
      v-model="showEditModal"
      :order-id="orderId"
      @success="handleEditSuccess"
    />

    <!-- Process Dialog -->
    <el-dialog v-model="showProcessDialog" title="Xử lý xuất kho" width="400px">
      <el-form label-width="120px">
        <el-form-item label="Kho xuất">
          <el-select v-model="selectedWarehouse" placeholder="Chọn kho" style="width: 100%">
            <el-option
              v-for="w in warehouses"
              :key="w.id"
              :label="w.name"
              :value="w.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showProcessDialog = false">Hủy</el-button>
        <el-button type="success" :loading="processing" @click="confirmProcess">Xác nhận</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, Edit, Check, Close,
  Document, Money, User, Calendar,
} from '@element-plus/icons-vue'
import { getOrder, processOrder, cancelOrder } from '@/api/order'
import OrderFormModal from '@/components/orders/OrderFormModal.vue'
import { useResponsive } from '@/composables/useResponsive'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const { isMobile } = useResponsive()

const orderId = computed(() => Number(route.params.id))

const loading = ref(false)
const processing = ref(false)
const cancelling = ref(false)
const order = ref(null)
const showEditModal = ref(false)
const showProcessDialog = ref(false)
const selectedWarehouse = ref(null)
const warehouses = ref([])

const statusOptions = [
  { label: 'Chờ xử lý', value: 'pending' },
  { label: 'Đang xử lý', value: 'processing' },
  { label: 'Hoàn thành', value: 'completed' },
  { label: 'Đã hủy', value: 'cancelled' },
]

const statusLabel = (s) => statusOptions.find((o) => o.value === s)?.label ?? s
const statusType = (s) => {
  const map = { pending: 'warning', processing: 'primary', completed: 'success', cancelled: 'danger' }
  return map[s] ?? 'info'
}

const formatPrice = (val) => Number(val || 0).toLocaleString('vi-VN')
const formatDate = (d) => d ? d.slice(0, 10) : '—'

const fetchOrder = async () => {
  loading.value = true
  try {
    const res = await getOrder(orderId.value)
    order.value = res.data
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

const fetchWarehouses = async () => {
  try {
    const res = await request({ url: '/warehouses', method: 'get', params: { per_page: 999 } })
    warehouses.value = res.data ?? []
  } catch { warehouses.value = [] }
}

const openEditModal = () => { showEditModal.value = true }
const handleEditSuccess = () => fetchOrder()

const handleProcess = () => {
  fetchWarehouses()
  showProcessDialog.value = true
}

const confirmProcess = async () => {
  if (!selectedWarehouse.value) {
    ElMessage.warning('Vui lòng chọn kho')
    return
  }
  processing.value = true
  try {
    await processOrder(orderId.value, selectedWarehouse.value)
    ElMessage.success('Xử lý đơn hàng thành công!')
    showProcessDialog.value = false
    fetchOrder()
  } catch (err) {
    ElMessage.error(err.response?.data?.message || 'Xử lý thất bại')
  } finally {
    processing.value = false
  }
}

const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('Bạn có chắc muốn hủy đơn hàng này?', 'Xác nhận', {
      confirmButtonText: 'Hủy đơn', cancelButtonText: 'Không', type: 'warning',
    })
    cancelling.value = true
    await cancelOrder(orderId.value)
    ElMessage.success('Đơn hàng đã được hủy')
    fetchOrder()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(err.response?.data?.message || 'Hủy đơn thất bại')
  } finally {
    cancelling.value = false
  }
}

onMounted(() => fetchOrder())
</script>

<style scoped lang="scss">
.order-detail-container {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    gap: 12px;
    flex-wrap: wrap;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .header-info {
        display: flex;
        align-items: center;
        gap: 10px;

        .page-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
      }
    }

    .header-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 16px;
    transition: box-shadow 0.2s;

    &:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.08); }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-info {
      .stat-value {
        font-size: 18px;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.2;
      }
      .stat-label {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 2px;
      }
    }
  }

  .card-title {
    font-weight: 600;
    font-size: 15px;
  }

  .link-text {
    color: var(--el-color-primary);
    cursor: pointer;
    text-decoration: underline;
  }

  .price-text {
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .product-info {
    display: flex;
    flex-direction: column;
    gap: 3px;

    .product-name {
      font-size: 13px;
      font-weight: 500;
    }
  }

  .line-total {
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .items-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    margin-top: 8px;
    background: var(--el-fill-color-light);
    border-radius: 6px;

    .total-amount {
      font-size: 18px;
      font-weight: 700;
      color: var(--el-color-primary);
    }
  }
}
</style>
