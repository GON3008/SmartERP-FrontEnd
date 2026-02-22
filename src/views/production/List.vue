<template>
  <div class="production-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý sản xuất</h1>
        <p class="page-description">Lệnh sản xuất và tiến độ</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Checked" @click="showCheckMaterials = true">Kiểm tra NVL</el-button>
        <el-button type="primary" :icon="Plus" @click="openForm()">Tạo lệnh SX</el-button>
      </div>
    </div>

    <!-- Stats -->
    <el-row :gutter="12" class="mb-md">
      <el-col v-for="s in statCards" :key="s.key" :xs="12" :sm="6">
        <div class="stat-card" :style="{ background: s.bg, borderColor: s.border, color: s.color }">
          <div class="stat-num">{{ counts[s.key] ?? 0 }}</div>
          <div class="stat-lbl">{{ s.label }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- Filters -->
    <el-card class="mb-md">
      <el-form :inline="!isMobile" :model="filter">
        <el-form-item>
          <el-select v-model="filter.status" placeholder="Trạng thái" clearable style="width:150px">
            <el-option v-for="s in statuses" :key="s.val" :label="s.label" :value="s.val" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="filter.product_id" placeholder="Sản phẩm" filterable clearable style="width:200px" :loading="loadingProducts">
            <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-date-picker v-model="filter.from_date" type="date" placeholder="Từ ngày" value-format="YYYY-MM-DD" style="width:140px" />
        </el-form-item>
        <el-form-item>
          <el-date-picker v-model="filter.to_date" type="date" placeholder="Đến ngày" value-format="YYYY-MM-DD" style="width:140px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchData">Tìm kiếm</el-button>
          <el-button :icon="Refresh" @click="handleReset">Đặt lại</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Table -->
    <el-card>
      <el-table v-loading="loading" :data="orders" stripe style="width:100%" @row-click="(row) => openDetail(row)">
        <el-table-column label="Mã lệnh" width="140" prop="order_code" />
        <el-table-column label="Sản phẩm" min-width="160">
          <template #default="{ row }">{{ row.product?.name ?? row.product_name ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="Số lượng" width="110" align="center">
          <template #default="{ row }">
            <span>{{ row.quantity }}</span>
            <span v-if="row.actual_quantity !== null && row.actual_quantity !== undefined" class="actual-qty"> / {{ row.actual_quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Bắt đầu" width="115" align="center">
          <template #default="{ row }">{{ fmtDate(row.start_date) }}</template>
        </el-table-column>
        <el-table-column label="Kết thúc" width="115" align="center">
          <template #default="{ row }">{{ fmtDate(row.end_date) }}</template>
        </el-table-column>
        <el-table-column label="" width="180" align="right" fixed="right" @click.stop>
          <template #default="{ row }">
            <el-tooltip content="Xem chi tiết"><el-button size="small" :icon="View" circle @click.stop="openDetail(row)" /></el-tooltip>
            <el-tooltip content="Chỉnh sửa" v-if="row.status === 'pending'"><el-button size="small" :icon="Edit" circle @click.stop="openForm(row)" /></el-tooltip>
            <el-tooltip content="Bắt đầu SX" v-if="row.status === 'pending'"><el-button size="small" :icon="VideoPlay" circle type="success" @click.stop="handleStart(row)" /></el-tooltip>
            <el-tooltip content="Hoàn thành" v-if="row.status === 'in_progress'"><el-button size="small" :icon="Checked" circle type="primary" @click.stop="handleComplete(row)" /></el-tooltip>
            <el-tooltip content="Huỷ" v-if="['pending','in_progress'].includes(row.status)"><el-button size="small" :icon="Close" circle type="danger" @click.stop="handleCancel(row)" /></el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !orders.length" description="Không có lệnh sản xuất nào" />
      <div class="pagination-bar" v-if="total > perPage">
        <el-pagination v-model:current-page="page" :page-size="perPage" :total="total" layout="prev, pager, next" @current-change="fetchData" />
      </div>
    </el-card>

    <!-- Modals -->
    <ProductionFormModal v-if="showForm" v-model="showForm" :order="editTarget" :products="products" @saved="fetchData" />
    <CheckMaterialsModal v-if="showCheckMaterials" v-model="showCheckMaterials" :products="products" />

    <!-- Start Dialog -->
    <el-dialog v-model="showStart" title="Bắt đầu sản xuất" width="420px" :close-on-click-modal="false">
      <p>Lệnh: <strong>{{ startTarget?.order_code }}</strong></p>
      <el-form label-position="top">
        <el-form-item label="Kho nguyên vật liệu">
          <el-select v-model="startForm.warehouse_id" placeholder="Chọn kho" filterable style="width:100%" :loading="loadingWh">
            <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStart = false">Huỷ</el-button>
        <el-button type="success" :loading="actioning" @click="confirmStart">Bắt đầu</el-button>
      </template>
    </el-dialog>

    <!-- Complete Dialog -->
    <el-dialog v-model="showComplete" title="Hoàn thành lệnh sản xuất" width="420px" :close-on-click-modal="false">
      <p>Lệnh: <strong>{{ completeTarget?.order_code }}</strong> — Số lượng đặt: <strong>{{ completeTarget?.quantity }}</strong></p>
      <el-form label-position="top">
        <el-form-item label="Kho xuất thành phẩm">
          <el-select v-model="completeForm.warehouse_id" placeholder="Chọn kho" filterable style="width:100%" :loading="loadingWh">
            <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Số lượng thực tế">
          <el-input-number v-model="completeForm.actual_quantity" :min="1" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showComplete = false">Huỷ</el-button>
        <el-button type="primary" :loading="actioning" @click="confirmComplete">Xác nhận hoàn thành</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh, View, Edit, VideoPlay, Checked, Close } from '@element-plus/icons-vue'
import { getProductions, startProduction, completeProduction, cancelProduction } from '@/api/production'
import { getProducts } from '@/api/product'
import { getWarehouses } from '@/api/warehouse'
import { useResponsive } from '@/composables/useResponsive'
import { useRouter } from 'vue-router'
import ProductionFormModal from '@/components/production/ProductionFormModal.vue'
import CheckMaterialsModal from '@/components/production/CheckMaterialsModal.vue'

const { isMobile } = useResponsive()
const router = useRouter()

const loading = ref(false)
const loadingProducts = ref(false)
const loadingWh = ref(false)
const orders = ref([])
const products = ref([])
const warehouses = ref([])
const total = ref(0)
const page = ref(1)
const perPage = 15

const showForm = ref(false)
const showCheckMaterials = ref(false)
const showStart = ref(false)
const showComplete = ref(false)
const actioning = ref(false)
const editTarget = ref(null)
const startTarget = ref(null)
const completeTarget = ref(null)

const startForm = reactive({ warehouse_id: null })
const completeForm = reactive({ warehouse_id: null, actual_quantity: null })

const filter = reactive({ status: '', product_id: null, from_date: '', to_date: '' })

const statuses = [
  { val: 'pending', label: 'Chờ xử lý' },
  { val: 'in_progress', label: 'Đang SX' },
  { val: 'completed', label: 'Hoàn thành' },
  { val: 'cancelled', label: 'Đã huỷ' },
]
const statCards = [
  { key: 'pending', label: 'Chờ xử lý', bg: '#e6a23c15', border: '#e6a23c40', color: '#cf8b2c' },
  { key: 'in_progress', label: 'Đang SX', bg: '#409eff15', border: '#409eff40', color: '#2e8be8' },
  { key: 'completed', label: 'Hoàn thành', bg: '#67c23a15', border: '#67c23a40', color: '#5dab30' },
  { key: 'cancelled', label: 'Đã huỷ', bg: '#f56c6c15', border: '#f56c6c40', color: '#e84040' },
]

const statusLabel = (s) => ({ pending: 'Chờ xử lý', in_progress: 'Đang SX', completed: 'Hoàn thành', cancelled: 'Đã huỷ' }[s] ?? s ?? '—')
const statusType = (s) => ({ pending: 'warning', in_progress: 'primary', completed: 'success', cancelled: 'danger' }[s] ?? 'info')
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'

const counts = computed(() => {
  const c = { pending: 0, in_progress: 0, completed: 0, cancelled: 0 }
  orders.value.forEach(o => { if (c[o.status] !== undefined) c[o.status]++ })
  return c
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = { page: page.value, per_page: perPage }
    if (filter.status) params.status = filter.status
    if (filter.product_id) params.product_id = filter.product_id
    if (filter.from_date) params.from_date = filter.from_date
    if (filter.to_date) params.to_date = filter.to_date
    const res = await getProductions(params)
    orders.value = res.data ?? []
    total.value = res.meta?.total ?? orders.value.length
  } catch { orders.value = [] }
  finally { loading.value = false }
}

const fetchProducts = async () => {
  loadingProducts.value = true
  try { const r = await getProducts({ per_page: 999 }); products.value = r.data ?? [] } catch {}
  finally { loadingProducts.value = false }
}

const fetchWarehouses = async () => {
  loadingWh.value = true
  try { const r = await getWarehouses({ per_page: 999 }); warehouses.value = r.data ?? [] } catch {}
  finally { loadingWh.value = false }
}

const handleReset = () => { filter.status = ''; filter.product_id = null; filter.from_date = ''; filter.to_date = ''; page.value = 1; fetchData() }
const openForm = (o = null) => { editTarget.value = o; showForm.value = true }
const openDetail = (row) => router.push(`/production/${row.id}`)

const handleStart = (row) => { startTarget.value = row; startForm.warehouse_id = null; showStart.value = true }
const confirmStart = async () => {
  if (!startForm.warehouse_id) return ElMessage.warning('Vui lòng chọn kho')
  actioning.value = true
  try {
    await startProduction(startTarget.value.id, { warehouse_id: startForm.warehouse_id })
    ElMessage.success('Đã bắt đầu sản xuất!'); showStart.value = false; fetchData()
  } catch { ElMessage.error('Không thể bắt đầu') }
  finally { actioning.value = false }
}

const handleComplete = (row) => { completeTarget.value = row; completeForm.warehouse_id = null; completeForm.actual_quantity = row.quantity; showComplete.value = true }
const confirmComplete = async () => {
  if (!completeForm.warehouse_id) return ElMessage.warning('Vui lòng chọn kho')
  actioning.value = true
  try {
    await completeProduction(completeTarget.value.id, { warehouse_id: completeForm.warehouse_id, actual_quantity: completeForm.actual_quantity })
    ElMessage.success('Hoàn thành sản xuất!'); showComplete.value = false; fetchData()
  } catch { ElMessage.error('Không thể hoàn thành') }
  finally { actioning.value = false }
}

const handleCancel = async (row) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(`Lý do huỷ lệnh "${row.order_code}"?`, 'Huỷ lệnh sản xuất', { inputPlaceholder: 'Nhập lý do...' })
    await cancelProduction(row.id, { reason })
    ElMessage.success('Đã huỷ lệnh sản xuất!'); fetchData()
  } catch {}
}

onMounted(() => { fetchData(); fetchProducts(); fetchWarehouses() })
</script>

<style scoped lang="scss">
.production-container {
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;
    .page-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .page-description { font-size: 14px; color: var(--text-secondary); margin: 0; }
    .header-actions { display: flex; gap: 8px; }
  }
  .stat-card { border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 14px; border: 1px solid;
    .stat-num { font-size: 28px; font-weight: 800; }
    .stat-lbl { font-size: 12px; margin-top: 4px; opacity: 0.8; }
  }
  .actual-qty { color: var(--el-color-success); font-weight: 600; }
  .el-table { cursor: pointer; }
  .pagination-bar { display: flex; justify-content: center; margin-top: 16px; }
}
</style>
