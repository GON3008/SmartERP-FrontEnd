<template>
  <div class="report-page">
    <div class="report-header">
      <div class="report-header__left">
        <el-icon class="report-header__icon" style="background:rgba(14,165,233,0.12);color:#0ea5e9"><TrendCharts /></el-icon>
        <div>
          <h2>Báo cáo doanh số</h2>
          <p>Phân tích doanh thu và đơn hàng theo thời gian</p>
        </div>
      </div>
      <div class="report-header__actions">
        <el-select v-model="period" size="small" style="width:140px" @change="fetchSales">
          <el-option label="Theo ngày"   value="daily" />
          <el-option label="Theo tuần"   value="weekly" />
          <el-option label="Theo tháng"  value="monthly" />
          <el-option label="Theo năm"    value="yearly" />
        </el-select>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="→"
          start-placeholder="Từ ngày" end-placeholder="Đến ngày"
          size="small" style="width:260px" value-format="YYYY-MM-DD"
          @change="fetchSales" />
        <el-button :icon="Refresh" size="small" circle :loading="loading" @click="fetchSales" />
      </div>
    </div>

    <!-- KPI Row -->
    <div class="report-kpi-row" v-loading="loading">
      <div class="report-kpi" style="border-top-color:#0ea5e9">
        <div class="report-kpi__value">{{ fmtM(summary.total_revenue) }}</div>
        <div class="report-kpi__label">Tổng doanh thu</div>
        <div class="report-kpi__sub">từ {{ summary.total_orders?.toLocaleString() }} đơn</div>
      </div>
      <div class="report-kpi" style="border-top-color:#34d399">
        <div class="report-kpi__value">{{ summary.total_orders?.toLocaleString() ?? 0 }}</div>
        <div class="report-kpi__label">Tổng đơn hàng</div>
        <div class="report-kpi__sub">hoàn thành</div>
      </div>
      <div class="report-kpi" style="border-top-color:#fb923c">
        <div class="report-kpi__value">{{ fmtM(summary.average_order_value) }}</div>
        <div class="report-kpi__label">Bình quân/đơn</div>
        <div class="report-kpi__sub">giá trị đơn hàng</div>
      </div>
      <div class="report-kpi" style="border-top-color:#a78bfa">
        <div class="report-kpi__value">{{ tableData.length }}</div>
        <div class="report-kpi__label">Số kỳ</div>
        <div class="report-kpi__sub">{{ period === 'monthly' ? 'tháng' : period === 'daily' ? 'ngày' : period === 'weekly' ? 'tuần' : 'năm' }}</div>
      </div>
    </div>

    <!-- Revenue Chart -->
    <div class="report-card">
      <div class="report-card-header">
        <h3>Biểu đồ doanh thu</h3>
        <span style="font-size:12px;color:var(--text-secondary)">Đơn vị: VNĐ</span>
      </div>
      <div class="line-chart-wrap" v-loading="loading">
        <div v-if="tableData.length === 0 && !loading" style="display:flex;justify-content:center;padding:40px 0">
          <el-empty description="Không có dữ liệu trong khoảng thời gian này" />
        </div>
        <svg v-else viewBox="0 0 800 220" class="line-svg" preserveAspectRatio="xMidYMid meet">
          <line v-for="i in 5" :key="i" x1="50" :y1="i*36" x2="800" :y2="i*36"
            stroke="rgba(148,163,184,0.12)" stroke-width="1" stroke-dasharray="4,4"/>
          <text v-for="i in 5" :key="'y'+i" x="45" :y="i*36+4" text-anchor="end"
            font-size="10" fill="rgba(148,163,184,0.7)">{{ fmtShort(maxR * (6-i) / 5) }}</text>
          <polygon v-if="pointList.length" :points="areaPoints" fill="url(#areaGrad1)" opacity="0.15"/>
          <polyline v-if="pointList.length" :points="linePoints" fill="none" stroke="#0ea5e9" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round"/>
          <circle v-for="(pt, i) in pointList" :key="i" :cx="pt.x" :cy="pt.y" r="3.5"
            fill="#0ea5e9" stroke="#fff" stroke-width="2"/>
          <text v-for="(row, i) in tableData" :key="'x'+i"
            :x="50 + i * chartStepX" y="215" text-anchor="middle"
            font-size="8" fill="rgba(148,163,184,0.8)">{{ row.period }}</text>
          <defs>
            <linearGradient id="areaGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0ea5e9"/>
              <stop offset="100%" stop-color="#0ea5e9" stop-opacity="0"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>

    <!-- Table -->
    <div class="report-card">
      <div class="report-card-header">
        <h3>Chi tiết theo kỳ</h3>
        <el-input v-model="search" placeholder="Tìm kỳ..." size="small" :prefix-icon="Search" style="width:180px" clearable />
      </div>
      <el-table :data="filteredTable" stripe size="small" class="report-table" v-loading="loading">
        <el-table-column label="Kỳ" prop="period" width="120" />
        <el-table-column label="Doanh thu" min-width="160">
          <template #default="{ row }"><span class="text-blue">{{ fmtVND(row.revenue) }}</span></template>
        </el-table-column>
        <el-table-column label="Số đơn" prop="orders_count" width="100" align="center" />
        <el-table-column label="Bình quân/đơn" min-width="160">
          <template #default="{ row }">{{ fmtVND(row.avg_order_value) }}</template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Top Products -->
    <div class="report-card">
      <div class="report-card-header">
        <h3>Sản phẩm bán chạy nhất</h3>
      </div>
      <el-table :data="topProducts" stripe size="small" class="report-table" v-loading="topLoading">
        <el-table-column label="#" width="50" align="center">
          <template #default="{ $index }">{{ $index + 1 }}</template>
        </el-table-column>
        <el-table-column label="SKU" prop="sku" width="100" />
        <el-table-column label="Tên sản phẩm" prop="name" min-width="180" />
        <el-table-column label="Danh mục" prop="category" width="120" />
        <el-table-column label="SL bán" prop="total_sold" width="100" align="center">
          <template #default="{ row }">{{ Number(row.total_sold).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="Doanh thu" min-width="160">
          <template #default="{ row }"><span class="text-blue">{{ fmtVND(row.total_revenue) }}</span></template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { TrendCharts, Refresh, Search } from '@element-plus/icons-vue'
import { getSalesReport, getTopProducts } from '@/api/reports'

const period = ref('monthly')
const dateRange = ref([])
const search = ref('')
const loading = ref(false)
const topLoading = ref(false)

const summary = ref({})
const tableData = ref([])
const topProducts = ref([])

// Chart helpers
const W = 800, H = 200, padX = 50, padY = 10
const maxR = computed(() => Math.max(...tableData.value.map(r => Number(r.revenue) || 0), 1))
const chartStepX = computed(() => tableData.value.length > 1 ? (W - padX) / (tableData.value.length - 1) : W - padX)

const pointList = computed(() =>
  tableData.value.map((r, i) => ({
    x: padX + i * chartStepX.value,
    y: H - ((Number(r.revenue) || 0) / maxR.value) * (H - padY)
  }))
)
const linePoints = computed(() => pointList.value.map(p => `${p.x},${p.y}`).join(' '))
const areaPoints = computed(() => {
  if (!pointList.value.length) return ''
  return `${pointList.value[0].x},${H} ${linePoints.value} ${pointList.value[pointList.value.length-1].x},${H}`
})

const filteredTable = computed(() =>
  tableData.value.filter(r => String(r.period).includes(search.value))
)

const fmtVND = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0)
const fmtM = (v) => {
  if (!v) return '0'
  if (v >= 1e9) return (v / 1e9).toFixed(2) + ' tỷ'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + ' tr'
  return Number(v).toLocaleString()
}
const fmtShort = (v) => {
  if (v >= 1e9) return (v/1e9).toFixed(1)+'B'
  if (v >= 1e6) return (v/1e6).toFixed(0)+'M'
  return v
}

async function fetchSales() {
  loading.value = true
  try {
    const filters = {}
    if (dateRange.value?.length === 2) {
      filters.from_date = dateRange.value[0]
      filters.to_date   = dateRange.value[1]
    }
    const res = await getSalesReport(period.value, filters)
    tableData.value = res.data || []
    summary.value   = res.summary || {}
  } catch (e) {
    ElMessage.error('Lỗi tải dữ liệu doanh số')
  } finally {
    loading.value = false
  }
}

async function fetchTop() {
  topLoading.value = true
  try {
    const res = await getTopProducts(10)
    topProducts.value = res.data || []
  } catch {} finally {
    topLoading.value = false
  }
}

onMounted(() => { fetchSales(); fetchTop() })
</script>

<style scoped lang="scss">
@use './report-shared.scss';
.report-kpi__sub { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
</style>
