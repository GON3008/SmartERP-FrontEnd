<template>
  <div class="list-page">
    <!-- Header -->
    <div class="lp-header">
      <div class="lp-header__text">
        <h1 class="lp-header__title">🛒 Phiếu mua hàng</h1>
        <p class="lp-header__desc">Danh sách đơn đặt hàng nhà cung cấp</p>
      </div>
      <el-button v-if="!isMobile" type="primary" :icon="Plus" @click="showForm = true" size="large">Tạo PO</el-button>
    </div>

    <!-- Stat Cards -->
    <div class="lp-stats" v-if="stats">
      <div class="stat-card stat-card--purple">
        <el-icon class="sc-icon"><Tickets /></el-icon>
        <div class="sc-body"><span class="sc-val">{{ stats.total ?? 0 }}</span><span class="sc-lbl">Tổng PO</span></div>
      </div>
      <div class="stat-card stat-card--blue">
        <el-icon class="sc-icon"><EditPen /></el-icon>
        <div class="sc-body"><span class="sc-val">{{ stats.draft ?? 0 }}</span><span class="sc-lbl">Nháp</span></div>
      </div>
      <div class="stat-card stat-card--green">
        <el-icon class="sc-icon"><CircleCheckFilled /></el-icon>
        <div class="sc-body"><span class="sc-val">{{ stats.received ?? 0 }}</span><span class="sc-lbl">Đã nhận</span></div>
      </div>
      <div class="stat-card stat-card--amber">
        <el-icon class="sc-icon"><Money /></el-icon>
        <div class="sc-body"><span class="sc-val">{{ fmt(stats.total_amount) }}</span><span class="sc-lbl">Tổng giá trị</span></div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="lp-filter">
      <span class="lp-lbl">Tìm kiếm</span>
      <el-input v-model="filters.search" placeholder="Mã PO, nhà cung cấp..." clearable :prefix-icon="Search"
        class="lp-filter__search" @keyup.enter="fetchData()" @clear="fetchData()" />
      <span class="lp-lbl">Trạng thái</span>
      <el-select v-model="filters.status" placeholder="Tất cả" clearable @change="fetchData()" style="width:145px">
        <el-option label="Nháp" value="draft" />
        <el-option label="Đã xác nhận" value="confirmed" />
        <el-option label="Đã nhận hàng" value="received" />
        <el-option label="Đã hủy" value="cancelled" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="fetchData()">Tìm kiếm</el-button>
      <el-button :icon="Refresh" @click="onReset">Đặt lại</el-button>
    </div>

    <!-- Desktop Table -->
    <el-card v-if="!isMobile" shadow="never" class="lp-table-card">
      <el-table :data="orders" v-loading="loading" stripe :header-cell-style="headerStyle">
        <el-table-column prop="po_code" label="Mã PO" width="165">
          <template #default="{ row }">
            <el-link type="primary" underline="never" @click="$router.push(`/purchase-orders/${row.id}`)" class="code-tag">
              <el-icon style="vertical-align:-2px;margin-right:3px"><Tickets /></el-icon>{{ row.po_code }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="Nhà cung cấp" min-width="180">
          <template #default="{ row }">
            <span class="contact-cell"><el-icon color="#7c3aed"><OfficeBuilding /></el-icon>{{ row.supplier?.name || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Ngày đặt" width="120">
          <template #default="{ row }">
            <span class="date-cell"><el-icon><Calendar /></el-icon>{{ row.order_date || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Ngày dự kiến" width="125">
          <template #default="{ row }">
            <span class="date-cell"><el-icon><Timer /></el-icon>{{ row.expected_date || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Tổng tiền" width="155" align="right">
          <template #default="{ row }"><span class="text-amount">{{ fmt(row.total_amount) }} ₫</span></template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="145" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light" round>{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" :icon="View" @click="$router.push(`/purchase-orders/${row.id}`)">Chi tiết</el-button>
            <el-button v-if="row.status === 'draft'" size="small" link type="success" :icon="Check" @click="handleConfirm(row.id)">Xác nhận</el-button>
            <el-button v-if="row.status === 'confirmed'" size="small" link type="warning" :icon="Box" @click="openReceive(row)">Nhận hàng</el-button>
            <el-button v-if="row.status !== 'received' && row.status !== 'cancelled'" size="small" link type="danger" :icon="CloseBold" @click="handleCancel(row.id)">Hủy</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="lp-pagination">
        <el-pagination background layout="total, sizes, prev, pager, next"
          :total="meta.total" :page-size="meta.per_page" :current-page="meta.current_page"
          :page-sizes="[10, 20, 50]"
          @size-change="s => { meta.per_page = s; fetchData() }"
          @current-change="p => fetchData(p)" />
      </div>
    </el-card>

    <!-- Mobile Cards -->
    <div v-else class="lp-mobile" v-loading="loading">
      <MobileCard v-for="o in orders" :key="o.id" :title="o.po_code" :icon="Tickets"
        :actions="getCardActions(o)" @action="cmd => handleCardAction(cmd, o)">
        <CardInfoRow :icon="OfficeBuilding" :value="o.supplier?.name || '—'" />
        <CardInfoRow :icon="Calendar" :value="o.order_date || '—'" />
        <div class="card-foot">
          <span class="text-amount">{{ fmt(o.total_amount) }} ₫</span>
          <el-tag :type="statusType(o.status)" effect="light" round size="small">{{ statusLabel(o.status) }}</el-tag>
        </div>
      </MobileCard>
      <el-empty v-if="!loading && !orders.length" description="Không có phiếu mua hàng nào" />
      <div class="lp-mob-page" v-if="orders.length">
        <el-pagination background layout="prev, pager, next" size="small" :total="meta.total" :page-size="meta.per_page" :current-page="meta.current_page" @current-change="p => fetchData(p)" />
      </div>
    </div>

    <el-button v-if="isMobile" type="primary" :icon="Plus" circle size="large" class="lp-fab" @click="showForm = true" />
    <PurchaseOrderFormModal v-model="showForm" @success="fetchData" />

    <!-- Receive Dialog -->
    <el-dialog v-model="showReceive" title="📦 Nhận hàng vào kho" :width="isMobile ? '100%' : '420px'" :fullscreen="isMobile">
      <el-form :label-width="isMobile ? '100%' : '100px'" :label-position="isMobile ? 'top' : 'left'">
        <el-form-item label="Kho nhận" required>
          <el-select v-model="receiveWarehouseId" filterable placeholder="Chọn kho nhận hàng" style="width:100%" size="large">
            <el-option v-for="w in warehouseList" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showReceive = false" size="large">Hủy</el-button>
          <el-button type="success" :loading="saving" :icon="Box" @click="handleReceive" size="large">Xác nhận nhận hàng</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, Refresh, View, Check, CloseBold, Box, Tickets, OfficeBuilding, Calendar, Timer, Money, EditPen, CircleCheckFilled } from '@element-plus/icons-vue'
import { getPurchaseOrders, confirmPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder, getPurchaseOrderStatistics } from '@/api/purchaseOrder'
import { getWarehouses } from '@/api/warehouse'
import { useResponsive } from '@/composables/useResponsive'
import { useRouter } from 'vue-router'
import MobileCard from '@/components/common/MobileCard.vue'
import CardInfoRow from '@/components/common/CardInfoRow.vue'
import PurchaseOrderFormModal from '@/components/purchase-orders/PurchaseOrderFormModal.vue'

const { isMobile } = useResponsive()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const showForm = ref(false)
const showReceive = ref(false)
const orders = ref([])
const warehouseList = ref([])
const stats = ref(null)
const meta = reactive({ total: 0, per_page: 15, current_page: 1 })
const filters = reactive({ search: '', status: '' })
const receivingPOId = ref(null)
const receiveWarehouseId = ref(null)

const fmt = (v) => Number(v || 0).toLocaleString('vi-VN')
const headerStyle = { background: 'var(--el-fill-color-light)', fontWeight: '600', color: 'var(--el-text-color-primary)' }
const statusType = (s) => ({ draft: 'info', confirmed: 'warning', received: 'success', cancelled: 'danger' }[s] || 'info')
const statusLabel = (s) => ({ draft: 'Nháp', confirmed: 'Đã xác nhận', received: 'Đã nhận', cancelled: 'Đã hủy' }[s] || s)

const getCardActions = (o) => {
  const a = [{ command: 'view', label: 'Chi tiết', icon: View }]
  if (o.status === 'draft') a.push({ command: 'confirm', label: 'Xác nhận', icon: Check })
  if (o.status === 'confirmed') a.push({ command: 'receive', label: 'Nhận hàng', icon: Box })
  if (o.status !== 'received' && o.status !== 'cancelled') a.push({ command: 'cancel', label: 'Hủy', icon: CloseBold })
  return a
}
const handleCardAction = (cmd, o) => {
  if (cmd === 'view') router.push(`/purchase-orders/${o.id}`)
  else if (cmd === 'confirm') handleConfirm(o.id)
  else if (cmd === 'receive') openReceive(o)
  else if (cmd === 'cancel') handleCancel(o.id)
}

const fetchData = async (page = 1) => {
  loading.value = true
  try {
    const [res, statRes] = await Promise.all([
      getPurchaseOrders({ ...filters, page, per_page: meta.per_page }),
      getPurchaseOrderStatistics()
    ])
    orders.value = res.data ?? []
    Object.assign(meta, res.meta ?? { total: res.total, per_page: res.per_page, current_page: res.current_page })
    stats.value = statRes.data ?? statRes
  } catch { ElMessage.error('Lỗi tải dữ liệu') }
  loading.value = false
}

const handleConfirm = async (id) => {
  try { await confirmPurchaseOrder(id); ElMessage.success('Xác nhận thành công!'); fetchData() }
  catch (e) { ElMessage.error(e.response?.data?.message || 'Có lỗi') }
}
const openReceive = async (row) => {
  receivingPOId.value = row.id; receiveWarehouseId.value = null
  try { const r = await getWarehouses({ per_page: 999 }); warehouseList.value = r.data || r } catch {}
  showReceive.value = true
}
const handleReceive = async () => {
  if (!receiveWarehouseId.value) return ElMessage.warning('Vui lòng chọn kho!')
  saving.value = true
  try {
    await receivePurchaseOrder(receivingPOId.value, { warehouse_id: receiveWarehouseId.value })
    ElMessage.success('Nhận hàng thành công!'); showReceive.value = false; fetchData()
  } catch (e) { ElMessage.error(e.response?.data?.message || 'Có lỗi') }
  saving.value = false
}
const handleCancel = async (id) => {
  try { await cancelPurchaseOrder(id); ElMessage.success('Hủy PO thành công!'); fetchData() }
  catch (e) { ElMessage.error(e.response?.data?.message || 'Có lỗi') }
}
const onReset = () => { filters.search = ''; filters.status = ''; fetchData() }
onMounted(() => fetchData())
</script>

<style scoped lang="scss">
@import '@/views/finance/_list-shared.scss';
.stat-card--purple { background: linear-gradient(135deg,#7c3aed,#a78bfa); }
.stat-card--blue   { background: linear-gradient(135deg,#3b82f6,#60a5fa); }
.stat-card--green  { background: linear-gradient(135deg,#10b981,#34d399); }
.stat-card--amber  { background: linear-gradient(135deg,#f59e0b,#fbbf24); }
.date-cell { display:inline-flex;align-items:center;gap:5px;color:var(--el-text-color-regular); }
</style>
