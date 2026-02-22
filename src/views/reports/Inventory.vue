<template>
  <div class="report-page">
    <div class="report-header">
      <div class="report-header__left">
        <el-icon class="report-header__icon" style="background:rgba(52,211,153,0.12);color:#10b981"><Box /></el-icon>
        <div>
          <h2>Báo cáo tồn kho</h2>
          <p>Theo dõi số lượng hàng hoá nhập xuất tồn</p>
        </div>
      </div>
      <div class="report-header__actions">
        <el-date-picker v-model="dateRange" type="daterange" range-separator="→"
          start-placeholder="Từ ngày" end-placeholder="Đến ngày"
          size="small" style="width:260px" value-format="YYYY-MM-DD" @change="fetchData" />
        <el-button :icon="Refresh" size="small" circle :loading="loading" @click="fetchData" />
      </div>
    </div>

    <!-- KPI Row -->
    <div class="report-kpi-row" v-loading="loading">
      <div class="report-kpi" style="border-top-color:#10b981">
        <div class="report-kpi__value">{{ (movement.total_stock_in || 0).toLocaleString() }}</div>
        <div class="report-kpi__label">Tổng nhập kho</div>
        <div class="report-kpi__trend up" v-if="movement.total_stock_in">▲ Nhập hàng</div>
      </div>
      <div class="report-kpi" style="border-top-color:#f87171">
        <div class="report-kpi__value">{{ (movement.total_stock_out || 0).toLocaleString() }}</div>
        <div class="report-kpi__label">Tổng xuất kho</div>
        <div class="report-kpi__trend down" v-if="movement.total_stock_out">▼ Xuất hàng</div>
      </div>
      <div class="report-kpi" :style="{ borderTopColor: movement.net_movement >= 0 ? '#10b981' : '#f87171' }">
        <div class="report-kpi__value" :class="movement.net_movement >= 0 ? '' : 'text-danger'">
          {{ movement.net_movement >= 0 ? '+' : '' }}{{ (movement.net_movement || 0).toLocaleString() }}
        </div>
        <div class="report-kpi__label">Biến động tồn kho</div>
        <div class="report-kpi__trend" :class="movement.net_movement >= 0 ? 'up' : 'down'">
          {{ movement.net_movement >= 0 ? '▲ Tăng' : '▼ Giảm' }}
        </div>
      </div>
      <div class="report-kpi" style="border-top-color:#0ea5e9">
        <div class="report-kpi__value">{{ dashInv.total_products?.toLocaleString() ?? '–' }}</div>
        <div class="report-kpi__label">Tổng sản phẩm</div>
        <div class="report-kpi__trend down" v-if="dashInv.low_stock_products">
          ⚠️ {{ dashInv.low_stock_products }} sắp hết
        </div>
      </div>
    </div>

    <!-- Movement visual -->
    <div class="report-card">
      <div class="report-card-header"><h3>Tóm tắt biến động kho</h3></div>
      <div class="movement-bar-section" v-loading="loading">
        <el-empty v-if="!movement.total_stock_in && !movement.total_stock_out && !loading"
          description="Chưa có dữ liệu biến động kho trong kỳ này" />
        <template v-else>
          <div class="mov-row">
            <span class="mov-label">Nhập kho</span>
            <div class="mov-bar-wrap">
              <div class="mov-bar in" :style="{ width: inPct + '%' }">{{ (movement.total_stock_in||0).toLocaleString() }}</div>
            </div>
          </div>
          <div class="mov-row">
            <span class="mov-label">Xuất kho</span>
            <div class="mov-bar-wrap">
              <div class="mov-bar out" :style="{ width: outPct + '%' }">{{ (movement.total_stock_out||0).toLocaleString() }}</div>
            </div>
          </div>
          <div class="mov-row">
            <span class="mov-label">Tồn ròng</span>
            <div class="mov-bar-wrap">
              <div class="mov-bar net" :style="{ width: netPct + '%', background: movement.net_movement >= 0 ? '#34d399' : '#f87171' }">
                {{ movement.net_movement >= 0 ? '+' : '' }}{{ (movement.net_movement||0).toLocaleString() }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Dashboard Inventory Stats -->
    <div class="report-card" v-if="dashInv.total_products">
      <div class="report-card-header"><h3>Thống kê tồn kho hiện tại</h3></div>
      <div class="inv-stat-grid">
        <div class="inv-stat">
          <div class="inv-stat__num">{{ dashInv.total_products?.toLocaleString() }}</div>
          <div class="inv-stat__label">Tổng SP</div>
        </div>
        <div class="inv-stat">
          <div class="inv-stat__num">{{ dashInv.total_quantity?.toLocaleString() }}</div>
          <div class="inv-stat__label">Tổng SL</div>
        </div>
        <div class="inv-stat" style="border-color:#f87171">
          <div class="inv-stat__num" style="color:#f87171">{{ dashInv.low_stock_products }}</div>
          <div class="inv-stat__label">Sắp hết</div>
        </div>
        <div class="inv-stat" style="border-color:#ef4444">
          <div class="inv-stat__num" style="color:#ef4444">{{ dashInv.out_of_stock_products }}</div>
          <div class="inv-stat__label">Hết hàng</div>
        </div>
        <div class="inv-stat" style="border-color:#0ea5e9">
          <div class="inv-stat__num" style="color:#0ea5e9">{{ fmtM(dashInv.total_inventory_value) }}</div>
          <div class="inv-stat__label">Giá trị tồn</div>
        </div>
      </div>
    </div>

    <!-- Low Stock Alert from Products API -->
    <div class="report-card">
      <div class="report-card-header">
        <h3>⚠️ Sản phẩm sắp hết hàng</h3>
        <el-tag type="warning" size="small" effect="light">Cần nhập thêm</el-tag>
      </div>
      <el-table :data="lowStockList" stripe size="small" class="report-table" v-loading="lowStockLoading">
        <el-table-column label="SKU" prop="sku" width="100" />
        <el-table-column label="Tên sản phẩm" prop="name" min-width="200" />
        <el-table-column label="Danh mục" prop="category" width="130" />
        <el-table-column label="Giá" min-width="130">
          <template #default="{ row }">{{ fmtVND(row.price) }}</template>
        </el-table-column>
        <el-table-column label="Tồn tối thiểu" prop="min_stock" width="130" align="center" />
        <el-table-column label="Hành động" width="100" align="center">
          <template #default>
            <el-tag type="danger" size="small" effect="light">Nhập hàng</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Box, Refresh } from '@element-plus/icons-vue'
import { getInventoryMovement, getDashboard } from '@/api/reports'
import request from '@/utils/request'

const dateRange = ref([])
const loading = ref(false)
const lowStockLoading = ref(false)

const movement = ref({})
const dashInv = ref({})
const lowStockList = ref([])

const fmtVND = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0)
const fmtM = (v) => {
  if (!v) return '0'
  if (v >= 1e9) return (v / 1e9).toFixed(2) + ' tỷ'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + ' tr'
  return Number(v).toLocaleString()
}

const maxMov = computed(() => Math.max(movement.value.total_stock_in || 0, movement.value.total_stock_out || 0, 1))
const inPct  = computed(() => Math.round((movement.value.total_stock_in  || 0) / maxMov.value * 90))
const outPct = computed(() => Math.round((movement.value.total_stock_out || 0) / maxMov.value * 90))
const netPct = computed(() => Math.min(Math.round(Math.abs(movement.value.net_movement || 0) / maxMov.value * 90), 90))

async function fetchData() {
  loading.value = true
  try {
    const filters = {}
    if (dateRange.value?.length === 2) {
      filters.from_date = dateRange.value[0]
      filters.to_date   = dateRange.value[1]
    }
    const [movRes, dashRes] = await Promise.all([
      getInventoryMovement(filters),
      getDashboard()
    ])
    movement.value = movRes || {}
    dashInv.value  = dashRes?.inventory || {}
  } catch (e) {
    ElMessage.error('Lỗi tải dữ liệu tồn kho')
  } finally {
    loading.value = false
  }
}

async function fetchLowStock() {
  lowStockLoading.value = true
  try {
    const res = await request.get('/products/low-stock')
    lowStockList.value = res.data || res || []
  } catch {} finally {
    lowStockLoading.value = false
  }
}

onMounted(() => { fetchData(); fetchLowStock() })
</script>

<style scoped lang="scss">
@use './report-shared.scss';
.movement-bar-section { display: flex; flex-direction: column; gap: 20px; padding: 8px 0; }
.mov-row { display: flex; align-items: center; gap: 16px; }
.mov-label { width: 80px; font-size: 13px; color: var(--text-secondary); flex-shrink: 0; }
.mov-bar-wrap { flex: 1; background: var(--bg-page); border-radius: 8px; height: 32px; overflow: hidden; }
.mov-bar { height: 100%; border-radius: 8px; display: flex; align-items: center; padding: 0 12px; font-size: 13px; font-weight: 600; color: #fff; transition: width 0.8s ease; min-width: 60px; &.in { background: linear-gradient(90deg, #10b981, #34d399); } &.out { background: linear-gradient(90deg, #ef4444, #f87171); } }
.inv-stat-grid { display: flex; gap: 16px; flex-wrap: wrap; }
.inv-stat { flex: 1; min-width: 120px; background: var(--bg-page); border-radius: 12px; padding: 16px; border: 1px solid var(--border-color); text-align: center; }
.inv-stat__num { font-size: 22px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.inv-stat__label { font-size: 12px; color: var(--text-secondary); }
.text-danger { color: #f87171; }
</style>
