<template>
  <div class="low-stock-container">
    <!-- Header -->
    <div class="page-header" v-if="!isMobile">
      <div>
        <h1 class="page-title">
          <el-icon class="title-icon"><Warning /></el-icon>
          Sản phẩm tồn kho thấp
        </h1>
        <p class="page-description">Danh sách sản phẩm dưới ngưỡng tồn kho tối thiểu</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="fetchLowStock" :loading="loading">Làm mới</el-button>
        <el-button type="primary" :icon="ArrowLeft" @click="router.push('/products')">
          Danh sách sản phẩm
        </el-button>
      </div>
    </div>

    <!-- Mobile Header -->
    <div class="mobile-header" v-else>
      <h2 class="mobile-title">Tồn kho thấp</h2>
      <el-button :icon="Refresh" circle @click="fetchLowStock" :loading="loading" size="small" />
    </div>

    <!-- Summary Banner -->
    <el-alert
      v-if="!loading && products.length > 0"
      :title="`Có ${products.length} sản phẩm cần bổ sung hàng`"
      type="warning"
      show-icon
      :closable="false"
      class="mb-md alert-banner"
    />

    <el-alert
      v-if="!loading && products.length === 0"
      title="Tất cả sản phẩm đều đủ hàng!"
      type="success"
      show-icon
      :closable="false"
      class="mb-md alert-banner"
    />

    <!-- Desktop Table -->
    <el-card v-if="!isMobile">
      <el-table
        v-loading="loading"
        :data="products"
        stripe
        style="width: 100%"
        :empty-text="loading ? 'Đang tải...' : 'Không có sản phẩm tồn kho thấp'"
        row-class-name="low-stock-row"
      >
        <el-table-column type="index" label="#" width="55" align="center" />

        <el-table-column prop="sku" label="Mã SKU" min-width="130">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.sku }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="Tên sản phẩm" min-width="200" />

        <el-table-column prop="category" label="Danh mục" min-width="130" />

        <el-table-column prop="unit" label="ĐVT" width="90" align="center" />

        <el-table-column label="Tồn kho hiện tại" width="160" align="center">
          <template #default="{ row }">
            <span class="current-stock danger-text">{{ row.current_stock ?? row.stock ?? 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="min_stock" label="Tối thiểu" width="110" align="center">
          <template #default="{ row }">
            <span>{{ row.min_stock }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Thiếu hụt" width="110" align="center">
          <template #default="{ row }">
            <el-tag type="danger" effect="plain">
              {{ getDeficit(row) }} {{ row.unit }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Giá (VNĐ)" width="140" align="right">
          <template #default="{ row }">
            {{ Number(row.price).toLocaleString('vi-VN') }}
          </template>
        </el-table-column>

        <el-table-column label="Thao tác" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :icon="View"
              @click="goToDetail(row)"
              link
            >
              Chi tiết
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Mobile Cards -->
    <div v-else class="low-stock-cards" v-loading="loading">
      <div v-if="products.length === 0 && !loading" class="empty-state">
        <el-empty description="Không có sản phẩm tồn kho thấp" />
      </div>

      <div
        v-for="product in products"
        :key="product.id"
        class="low-stock-card"
        @click="goToDetail(product)"
      >
        <div class="card-header">
          <div class="card-title-wrap">
            <span class="card-name">{{ product.name }}</span>
            <el-tag type="info" size="small">{{ product.sku }}</el-tag>
          </div>
          <el-tag type="danger" size="small" effect="plain">
            Thiếu {{ getDeficit(product) }} {{ product.unit }}
          </el-tag>
        </div>

        <div class="card-body">
          <div class="card-row">
            <span class="card-label">Danh mục</span>
            <span class="card-value">{{ product.category }}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Tồn kho</span>
            <span class="card-value danger-text">{{ product.current_stock ?? product.stock ?? 0 }} / {{ product.min_stock }} {{ product.unit }}</span>
          </div>
          <div class="card-row">
            <span class="card-label">Giá</span>
            <span class="card-value">{{ Number(product.price).toLocaleString('vi-VN') }} VNĐ</span>
          </div>
        </div>

        <!-- Stock level bar -->
        <el-progress
          :percentage="getStockPercent(product)"
          status="exception"
          :stroke-width="6"
          class="card-progress"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Warning, Refresh, ArrowLeft, View } from '@element-plus/icons-vue'
import { getLowStockProducts } from '@/api/product'
import { useResponsive } from '@/composables/useResponsive'

const router = useRouter()
const { isMobile } = useResponsive()

const loading = ref(false)
const products = ref([])

const getDeficit = (row) => {
  const current = row.current_stock ?? row.stock ?? 0
  return Math.max(0, row.min_stock - current)
}

const getStockPercent = (row) => {
  const current = row.current_stock ?? row.stock ?? 0
  if (!row.min_stock) return 0
  return Math.min(Math.round((current / row.min_stock) * 100), 100)
}

const goToDetail = (row) => {
  router.push(`/products/${row.id}`)
}

const fetchLowStock = async () => {
  try {
    loading.value = true
    const res = await getLowStockProducts()
    products.value = res.data ?? []
  } catch (err) {
    ElMessage.error(err.response?.data?.message || 'Tải dữ liệu thất bại')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLowStock()
})
</script>

<style scoped lang="scss">
.low-stock-container {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .title-icon {
      color: var(--el-color-warning);
      margin-right: 6px;
      vertical-align: middle;
    }
  }

  .page-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    display: flex;
    align-items: center;
  }

  .page-description {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 4px 0 0;
  }

  .mobile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .mobile-title {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
    }
  }

  .alert-banner {
    border-radius: 8px;
  }

  .danger-text {
    color: var(--el-color-danger);
    font-weight: 600;
    font-size: 15px;
  }

  .current-stock {
    font-size: 16px;
  }

  // Mobile cards
  .low-stock-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 100px;

    .low-stock-card {
      background: var(--el-bg-color);
      border: 1px solid var(--el-color-danger-light-5);
      border-left: 4px solid var(--el-color-danger);
      border-radius: 10px;
      padding: 14px;
      cursor: pointer;
      transition: box-shadow 0.2s, transform 0.1s;

      &:active {
        transform: scale(0.99);
      }

      &:hover {
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 10px;
        gap: 8px;

        .card-title-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .card-name {
            font-weight: 600;
            font-size: 14px;
            color: var(--text-primary);
            line-height: 1.3;
          }
        }
      }

      .card-body {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 10px;

        .card-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;

          .card-label {
            color: var(--text-secondary);
          }

          .card-value {
            font-weight: 500;
            color: var(--text-primary);
          }
        }
      }

      .card-progress {
        margin-top: 4px;
      }
    }

    .empty-state {
      display: flex;
      justify-content: center;
      padding: 40px 0;
    }
  }
}
</style>
