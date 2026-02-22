<template>
  <div class="warehouse-detail-container" v-loading="loading">
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="router.back()" text>Quay lại</el-button>
        <h1 class="page-title" v-if="warehouse">{{ warehouse.name }}</h1>
      </div>
      <div class="header-actions" v-if="warehouse">
        <el-button :icon="Edit" @click="showEdit = true">Chỉnh sửa</el-button>
        <el-button type="primary" :icon="Upload" @click="router.push('/stock/in')">Nhập kho</el-button>
        <el-button type="warning" :icon="Download" @click="router.push('/stock/out')">Xuất kho</el-button>
      </div>
    </div>

    <el-result v-if="!loading && !warehouse" icon="error" title="Không tìm thấy kho">
      <template #extra>
        <el-button type="primary" @click="router.push('/warehouses')">Quay lại danh sách</el-button>
      </template>
    </el-result>

    <template v-if="warehouse">
      <!-- Info & Capacity Row -->
      <el-row :gutter="16" class="mb-md">
        <el-col :xs="24" :sm="8">
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--el-color-primary-light-8)">
              <el-icon color="var(--el-color-primary)" size="22"><Box /></el-icon>
            </div>
            <div>
              <div class="stat-value">{{ capacity.total_products ?? '—' }}</div>
              <div class="stat-label">Loại sản phẩm</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="8">
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--el-color-success-light-8)">
              <el-icon color="var(--el-color-success)" size="22"><DataBoard /></el-icon>
            </div>
            <div>
              <div class="stat-value">{{ capacity.total_quantity ?? '—' }}</div>
              <div class="stat-label">Tổng tồn kho</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="8">
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--el-color-info-light-8)">
              <el-icon color="var(--el-color-info)" size="22"><OfficeBuilding /></el-icon>
            </div>
            <div>
              <div class="stat-value">{{ warehouse.capacity ?? 'Không giới hạn' }}</div>
              <div class="stat-label">Sức chứa</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <!-- Warehouse Info -->
        <el-col :xs="24" :md="8">
          <el-card class="mb-md">
            <template #header><span class="card-title">Thông tin kho</span></template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="Tên kho">{{ warehouse.name }}</el-descriptions-item>
              <el-descriptions-item label="Địa chỉ">{{ warehouse.location || '—' }}</el-descriptions-item>
              <el-descriptions-item label="Sức chứa">{{ warehouse.capacity ?? '—' }}</el-descriptions-item>
              <el-descriptions-item label="Ngày tạo">{{ warehouse.created_at?.slice(0,10) ?? '—' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <!-- Inventory in warehouse -->
        <el-col :xs="24" :md="16">
          <el-card class="mb-md">
            <template #header>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span class="card-title">Tồn kho hiện tại</span>
                <el-button size="small" :icon="Refresh" @click="fetchInventory" :loading="loadingInventory">Làm mới</el-button>
              </div>
            </template>
            <el-table v-loading="loadingInventory" :data="inventory" stripe>
              <el-table-column label="Sản phẩm" min-width="160">
                <template #default="{ row }">
                  <div>
                    <div style="font-weight:500">{{ row.product?.name ?? row.product_name ?? '—' }}</div>
                    <el-tag type="info" size="small" v-if="row.product?.sku">{{ row.product.sku }}</el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="Danh mục" width="120">
                <template #default="{ row }">{{ row.product?.category ?? '—' }}</template>
              </el-table-column>
              <el-table-column prop="quantity" label="Số lượng" width="100" align="center">
                <template #default="{ row }">
                  <span :class="{ 'text-danger': row.quantity <= (row.product?.min_stock ?? 0) }">
                    {{ row.quantity }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="ĐVT" width="80" align="center">
                <template #default="{ row }">{{ row.product?.unit ?? '—' }}</template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!loadingInventory && !inventory.length" description="Kho đang trống" />
          </el-card>
        </el-col>
      </el-row>
    </template>

    <WarehouseFormModal v-model="showEdit" :warehouse-id="warehouseId" @success="fetchWarehouse" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Edit, Upload, Download, Box, DataBoard, OfficeBuilding, Refresh } from '@element-plus/icons-vue'
import { getWarehouse, getWarehouseInventoryReport, getWarehouseCapacity } from '@/api/warehouse'
import WarehouseFormModal from '@/components/warehouses/WarehouseFormModal.vue'

const route = useRoute()
const router = useRouter()

const warehouseId = computed(() => Number(route.params.id))
const loading = ref(false)
const loadingInventory = ref(false)
const warehouse = ref(null)
const inventory = ref([])
const capacity = ref({})
const showEdit = ref(false)

const fetchWarehouse = async () => {
  loading.value = true
  try {
    const res = await getWarehouse(warehouseId.value)
    warehouse.value = res.data
  } catch { warehouse.value = null }
  finally { loading.value = false }
}

const fetchInventory = async () => {
  loadingInventory.value = true
  try {
    const res = await getWarehouseInventoryReport(warehouseId.value, {})
    inventory.value = res.data ?? []
  } catch { inventory.value = [] }
  finally { loadingInventory.value = false }
}

const fetchCapacity = async () => {
  try {
    const res = await getWarehouseCapacity(warehouseId.value)
    capacity.value = res.data ?? res
  } catch { capacity.value = {} }
}

onMounted(() => {
  fetchWarehouse()
  fetchInventory()
  fetchCapacity()
})
</script>

<style scoped lang="scss">
.warehouse-detail-container {
  .page-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
    .header-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .page-title { font-size: 20px; font-weight: 700; margin: 0; }
  }
  .stat-card {
    display: flex; align-items: center; gap: 14px;
    background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px; padding: 14px; margin-bottom: 16px;
    .stat-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-value { font-size: 20px; font-weight: 700; }
    .stat-label { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
  }
  .card-title { font-weight: 600; font-size: 15px; }
  .text-danger { color: var(--el-color-danger) !important; font-weight: 600; }

  // ── Mobile ──────────────────────────────
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column; align-items: flex-start;
      .page-title { font-size: 16px; }
      .header-actions { width: 100%; }
    }
    .stat-card { padding: 10px; gap: 10px;
      .stat-icon { width: 36px; height: 36px; }
      .stat-value { font-size: 16px; }
    }
  }

  @media (max-width: 480px) {
    .stat-card { flex-direction: column; align-items: flex-start; gap: 6px; padding: 10px; }
    .header-actions .el-button { flex: 1; }
  }
}
</style>
