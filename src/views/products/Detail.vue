<template>
  <div class="product-detail-container" v-loading="loading">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="router.back()" text>Quay lại</el-button>
        <div class="header-info">
          <h1 class="page-title">Chi tiết sản phẩm</h1>
          <p class="page-description" v-if="product">{{ product.sku }}</p>
        </div>
      </div>
      <div class="header-actions" v-if="product">
        <el-button :icon="Edit" type="primary" @click="openEditModal">Chỉnh sửa</el-button>
      </div>
    </div>

    <!-- Not found -->
    <el-result
      v-if="!loading && !product"
      icon="error"
      title="Không tìm thấy sản phẩm"
      sub-title="Sản phẩm này không tồn tại hoặc đã bị xóa."
    >
      <template #extra>
        <el-button type="primary" @click="router.push('/products')">Quay lại danh sách</el-button>
      </template>
    </el-result>

    <template v-if="product">
      <!-- Info Cards Row -->
      <el-row :gutter="16" class="mb-md">
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: var(--el-color-primary-light-8)">
              <el-icon color="var(--el-color-primary)" size="24"><Goods /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalStock ?? '—' }}</div>
              <div class="stat-label">Tổng tồn kho</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: var(--el-color-warning-light-8)">
              <el-icon color="var(--el-color-warning)" size="24"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ product.min_stock }}</div>
              <div class="stat-label">Tồn kho tối thiểu</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: var(--el-color-success-light-8)">
              <el-icon color="var(--el-color-success)" size="24"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ formatPrice(product.price) }}</div>
              <div class="stat-label">Đơn giá (VNĐ)</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div
              class="stat-icon"
              :style="{
                background: isLowStock
                  ? 'var(--el-color-danger-light-8)'
                  : 'var(--el-color-success-light-8)',
              }"
            >
              <el-icon
                :color="isLowStock ? 'var(--el-color-danger)' : 'var(--el-color-success)'"
                size="24"
              >
                <component :is="isLowStock ? CircleCloseFilled : CircleCheckFilled" />
              </el-icon>
            </div>
            <div class="stat-info">
              <el-tag :type="isLowStock ? 'danger' : 'success'" effect="plain">
                {{ isLowStock ? 'Tồn kho thấp' : 'Đủ hàng' }}
              </el-tag>
              <div class="stat-label">Trạng thái</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- Main Info -->
      <el-row :gutter="16">
        <el-col :xs="24" :md="14">
          <el-card class="info-card mb-md">
            <template #header>
              <span class="card-title">Thông tin sản phẩm</span>
            </template>
            <el-descriptions :column="isMobile ? 1 : 2" border>
              <el-descriptions-item label="Mã SKU">
                <el-tag type="info">{{ product.sku }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Tên sản phẩm">{{ product.name }}</el-descriptions-item>
              <el-descriptions-item label="Danh mục">{{ product.category }}</el-descriptions-item>
              <el-descriptions-item label="Đơn vị tính">{{ product.unit }}</el-descriptions-item>
              <el-descriptions-item label="Giá bán">
                <span class="price-text">{{ formatPrice(product.price) }} VNĐ</span>
              </el-descriptions-item>
              <el-descriptions-item label="Tồn kho tối thiểu">
                <el-tag :type="isLowStock ? 'danger' : 'info'">{{ product.min_stock }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Mô tả" :span="2" v-if="product.description">
                {{ product.description }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <el-col :xs="24" :md="10">
          <el-card class="info-card mb-md">
            <template #header>
              <span class="card-title">Thông tin tồn kho</span>
            </template>
            <div v-if="loadingStock" class="stock-loading">
              <el-skeleton :rows="3" animated />
            </div>
            <div v-else>
              <div class="stock-summary">
                <div class="stock-item">
                  <span class="stock-label">Tổng tồn kho hiện tại</span>
                  <span class="stock-value" :class="{ 'text-danger': isLowStock }">
                    {{ totalStock ?? 0 }} {{ product.unit }}
                  </span>
                </div>
                <div class="stock-item">
                  <span class="stock-label">Ngưỡng tối thiểu</span>
                  <span class="stock-value">{{ product.min_stock }} {{ product.unit }}</span>
                </div>
                <div class="stock-item">
                  <span class="stock-label">Chênh lệch</span>
                  <span
                    class="stock-value"
                    :class="{
                      'text-danger': stockDiff < 0,
                      'text-success': stockDiff >= 0,
                    }"
                  >
                    {{ stockDiff >= 0 ? '+' : '' }}{{ stockDiff }} {{ product.unit }}
                  </span>
                </div>
              </div>

              <!-- Progress bar -->
              <div class="stock-progress" v-if="product.min_stock > 0">
                <div class="progress-label">
                  <span>Mức tồn kho</span>
                  <span>{{ stockPercent }}%</span>
                </div>
                <el-progress
                  :percentage="Math.min(stockPercent, 100)"
                  :status="isLowStock ? 'exception' : 'success'"
                  :stroke-width="10"
                />
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- Edit Modal -->
    <ProductFormModal
      v-model="showEditModal"
      :product-id="productId"
      @success="handleEditSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Edit,
  Goods,
  Warning,
  Money,
  CircleCloseFilled,
  CircleCheckFilled,
} from '@element-plus/icons-vue'
import { getProduct, getTotalStock } from '@/api/product'
import ProductFormModal from '@/components/products/ProductFormModal.vue'
import { useResponsive } from '@/composables/useResponsive'

const route = useRoute()
const router = useRouter()
const { isMobile } = useResponsive()

const productId = computed(() => Number(route.params.id))

const loading = ref(false)
const loadingStock = ref(false)
const product = ref(null)
const totalStock = ref(null)
const showEditModal = ref(false)

const isLowStock = computed(() => {
  if (!product.value || totalStock.value === null) return false
  return totalStock.value < product.value.min_stock
})

const stockDiff = computed(() => {
  if (!product.value || totalStock.value === null) return 0
  return totalStock.value - product.value.min_stock
})

const stockPercent = computed(() => {
  if (!product.value || !product.value.min_stock) return 0
  return Math.round((totalStock.value / product.value.min_stock) * 100)
})

const formatPrice = (val) => Number(val).toLocaleString('vi-VN')

const fetchProduct = async () => {
  try {
    loading.value = true
    const res = await getProduct(productId.value)
    product.value = res.data
  } catch (err) {
    ElMessage.error(err.response?.data?.message || 'Không thể tải thông tin sản phẩm')
    product.value = null
  } finally {
    loading.value = false
  }
}

const fetchTotalStock = async () => {
  try {
    loadingStock.value = true
    const res = await getTotalStock(productId.value)
    totalStock.value = res.total_stock ?? 0
  } catch {
    totalStock.value = 0
  } finally {
    loadingStock.value = false
  }
}

const openEditModal = () => {
  showEditModal.value = true
}

const handleEditSuccess = () => {
  fetchProduct()
  fetchTotalStock()
}

onMounted(() => {
  fetchProduct()
  fetchTotalStock()
})
</script>

<style scoped lang="scss">
.product-detail-container {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    gap: 12px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-info {
      .page-title {
        font-size: 22px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
      }
      .page-description {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 2px 0 0;
      }
    }
  }

  // Stat cards
  .stat-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 16px;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-info {
      .stat-value {
        font-size: 20px;
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

  .info-card {
    .card-title {
      font-weight: 600;
      font-size: 15px;
    }
  }

  .price-text {
    font-weight: 600;
    color: var(--el-color-primary);
  }

  // Stock summary
  .stock-summary {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;

    .stock-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }

      .stock-label {
        font-size: 13px;
        color: var(--text-secondary);
      }

      .stock-value {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
      }
    }
  }

  .stock-progress {
    .progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }
  }

  .text-danger {
    color: var(--el-color-danger) !important;
  }

  .text-success {
    color: var(--el-color-success) !important;
  }

  .stock-loading {
    padding: 8px 0;
  }
}
</style>
