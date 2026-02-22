<template>
  <div class="production-detail" v-loading="loading">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="$router.back()">Quay lại</el-button>
      <div class="header-right" v-if="order">
        <el-button v-if="order.status === 'pending'" :icon="Edit" @click="showForm = true">Chỉnh sửa</el-button>
        <el-button v-if="order.status === 'pending'" type="success" :icon="VideoPlay" @click="showStart = true">Bắt đầu SX</el-button>
        <el-button v-if="order.status === 'in_progress'" type="primary" :icon="Checked" @click="showComplete = true">Hoàn thành</el-button>
        <el-button v-if="['pending','in_progress'].includes(order?.status)" type="danger" :icon="Close" @click="handleCancel">Huỷ lệnh</el-button>
      </div>
    </div>

    <div v-if="order" class="detail-layout">
      <!-- Left: Info -->
      <div class="detail-left">
        <el-card class="mb-md">
          <template #header>
            <div class="card-header">
              <span class="card-title">Thông tin lệnh SX</span>
              <el-tag :type="statusType(order.status)" effect="dark">{{ statusLabel(order.status) }}</el-tag>
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="Mã lệnh">
              <span class="mono">{{ order.order_code }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="Sản phẩm">{{ order.product?.name ?? order.product_name ?? '—' }}</el-descriptions-item>
            <el-descriptions-item label="Số lượng kế hoạch">{{ order.quantity }}</el-descriptions-item>
            <el-descriptions-item label="Số lượng thực tế">
              <span :class="{ 'text-success': order.actual_quantity >= order.quantity }">
                {{ order.actual_quantity ?? '—' }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="Ngày bắt đầu">{{ fmtDate(order.start_date) }}</el-descriptions-item>
            <el-descriptions-item label="Ngày kết thúc">{{ fmtDate(order.end_date) }}</el-descriptions-item>
            <el-descriptions-item label="Ngày tạo">{{ fmtDate(order.created_at) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- Progress -->
        <el-card>
          <template #header><span class="card-title">Tiến độ</span></template>
          <div class="progress-section">
            <div class="progress-status" v-for="(s, i) in progressSteps" :key="s.key"
              :class="{ done: stepDone(i), active: stepActive(i) }">
              <div class="step-dot"></div>
              <div class="step-content">
                <div class="step-name">{{ s.label }}</div>
                <div class="step-sub" v-if="stepActive(i)">Đang thực hiện</div>
                <div class="step-sub done-text" v-else-if="stepDone(i)">Hoàn thành</div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- Right: BOM/Materials -->
      <div class="detail-right">
        <el-card>
          <template #header>
            <div class="card-header">
              <span class="card-title">Nguyên vật liệu (BOM)</span>
            </div>
          </template>
          <div v-if="order.product?.bom?.length || order.materials?.length">
            <el-table :data="order.materials ?? order.product?.bom ?? []" stripe size="small">
              <el-table-column label="NVL" min-width="140">
                <template #default="{ row }">{{ row.material?.name ?? row.material_name ?? row.name ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="Số lượng cần" width="120" align="center">
                <template #default="{ row }">{{ (row.quantity_per_unit ?? row.quantity ?? 0) * order.quantity }}</template>
              </el-table-column>
              <el-table-column label="Đơn vị" width="90" align="center">
                <template #default="{ row }">{{ row.material?.unit ?? row.unit ?? '—' }}</template>
              </el-table-column>
            </el-table>
          </div>
          <el-empty v-else description="Không có thông tin BOM" :image-size="60" />
        </el-card>
      </div>
    </div>

    <!-- Start Dialog -->
    <el-dialog v-model="showStart" title="Bắt đầu sản xuất" width="400px" :close-on-click-modal="false">
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
    <el-dialog v-model="showComplete" title="Hoàn thành sản xuất" width="400px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="Kho xuất thành phẩm">
          <el-select v-model="completeForm.warehouse_id" placeholder="Chọn kho" filterable style="width:100%" :loading="loadingWh">
            <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Số lượng thực tế sản xuất">
          <el-input-number v-model="completeForm.actual_quantity" :min="1" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showComplete = false">Huỷ</el-button>
        <el-button type="primary" :loading="actioning" @click="confirmComplete">Xác nhận</el-button>
      </template>
    </el-dialog>

    <ProductionFormModal v-if="showForm" v-model="showForm" :order="order" :products="products" @saved="fetchOrder" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit, VideoPlay, Checked, Close } from '@element-plus/icons-vue'
import { getProductions, startProduction, completeProduction, cancelProduction } from '@/api/production'
import { getProducts } from '@/api/product'
import { getWarehouses } from '@/api/warehouse'
import ProductionFormModal from '@/components/production/ProductionFormModal.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const actioning = ref(false)
const loadingWh = ref(false)
const order = ref(null)
const warehouses = ref([])
const products = ref([])
const showForm = ref(false)
const showStart = ref(false)
const showComplete = ref(false)
const startForm = reactive({ warehouse_id: null })
const completeForm = reactive({ warehouse_id: null, actual_quantity: null })

const progressSteps = [
  { key: 'pending', label: 'Chờ xử lý' },
  { key: 'in_progress', label: 'Đang sản xuất' },
  { key: 'completed', label: 'Hoàn thành' },
]
const statusOrder = ['pending', 'in_progress', 'completed']
const currentStepIdx = computed(() => statusOrder.indexOf(order.value?.status ?? 'pending'))
const stepDone = (i) => i < currentStepIdx.value
const stepActive = (i) => i === currentStepIdx.value

const statusLabel = (s) => ({ pending: 'Chờ xử lý', in_progress: 'Đang SX', completed: 'Hoàn thành', cancelled: 'Đã huỷ' }[s] ?? s ?? '—')
const statusType = (s) => ({ pending: 'warning', in_progress: 'primary', completed: 'success', cancelled: 'danger' }[s] ?? 'info')
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'

// Load order from list (no show endpoint) — get by filtering by ID won't work, using store state or refetch list
const fetchOrder = async () => {
  loading.value = true
  try {
    // Fetch all and find matching id (no GET /production/{id} endpoint)
    const res = await getProductions({ per_page: 999 })
    const all = res.data ?? []
    order.value = all.find(o => o.id == route.params.id) ?? null
    if (order.value) completeForm.actual_quantity = order.value.quantity
  } catch { order.value = null }
  finally { loading.value = false }
}

const fetchSupportData = async () => {
  loadingWh.value = true
  try {
    const [pw, pr] = await Promise.allSettled([getWarehouses({ per_page: 999 }), getProducts({ per_page: 999 })])
    warehouses.value = pw.value?.data ?? []
    products.value = pr.value?.data ?? []
  } catch {}
  finally { loadingWh.value = false }
}

const confirmStart = async () => {
  if (!startForm.warehouse_id) return ElMessage.warning('Vui lòng chọn kho')
  actioning.value = true
  try {
    await startProduction(order.value.id, { warehouse_id: startForm.warehouse_id })
    ElMessage.success('Đã bắt đầu sản xuất!'); showStart.value = false; fetchOrder()
  } catch { ElMessage.error('Không thể bắt đầu') }
  finally { actioning.value = false }
}

const confirmComplete = async () => {
  if (!completeForm.warehouse_id) return ElMessage.warning('Vui lòng chọn kho')
  actioning.value = true
  try {
    await completeProduction(order.value.id, { warehouse_id: completeForm.warehouse_id, actual_quantity: completeForm.actual_quantity })
    ElMessage.success('Hoàn thành sản xuất!'); showComplete.value = false; fetchOrder()
  } catch { ElMessage.error('Không thể hoàn thành') }
  finally { actioning.value = false }
}

const handleCancel = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt('Lý do huỷ?', 'Huỷ lệnh sản xuất', { inputPlaceholder: 'Nhập lý do...' })
    await cancelProduction(order.value.id, { reason })
    ElMessage.success('Đã huỷ!'); router.push('/production')
  } catch {}
}

onMounted(() => { fetchOrder(); fetchSupportData() })
</script>

<style scoped lang="scss">
.production-detail {
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;
    .header-right { display: flex; gap: 8px; flex-wrap: wrap; }
  }
  .card-header { display: flex; justify-content: space-between; align-items: center; }
  .card-title { font-weight: 600; font-size: 15px; }
  .mono { font-family: monospace; font-weight: 700; font-size: 15px; }
  .text-success { color: var(--el-color-success); font-weight: 600; }
  .detail-layout { display: grid; grid-template-columns: 380px 1fr; gap: 16px;
    @media (max-width: 900px) { grid-template-columns: 1fr; }
  }
  .progress-section { display: flex; flex-direction: column; gap: 0;
    .progress-status { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; position: relative;
      &:not(:last-child):before { content:''; position:absolute; left:9px; top:28px; width:2px; height:calc(100% - 16px); background: var(--border-color); }
      .step-dot { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border-color); background: var(--bg-card); flex-shrink: 0; margin-top: 2px; }
      .step-name { font-weight: 500; }
      .step-sub { font-size: 12px; color: var(--text-secondary); }
      .done-text { color: var(--el-color-success); }
      &.done .step-dot { background: var(--el-color-success); border-color: var(--el-color-success); }
      &.active .step-dot { background: var(--el-color-primary); border-color: var(--el-color-primary); animation: pulse 1.5s infinite; }
    }
  }
  @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 #409eff40; } 50% { box-shadow: 0 0 0 6px transparent; } }
}
</style>
