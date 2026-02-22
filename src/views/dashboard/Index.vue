<template>
  <div class="dashboard">
    <!-- Page Header -->
    <div class="dash-header">
      <div>
        <h1 class="dash-title">Tổng quan hệ thống</h1>
        <p class="dash-subtitle">Chào mừng trở lại, <strong>{{ authStore.currentUser?.name || 'Admin' }}</strong> · {{ todayStr }}</p>
      </div>
      <div class="dash-actions">
        <el-button :icon="Refresh" circle size="small" :loading="loading" @click="fetchAll" title="Làm mới" />
        <el-button type="primary" size="small" :icon="Download" @click="exportReport">Xuất báo cáo</el-button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-grid" v-loading="loading">
      <div v-for="kpi in kpis" :key="kpi.key" class="kpi-card" :class="`kpi-${kpi.color}`">
        <div class="kpi-body">
          <div class="kpi-icon-wrap">
            <el-icon><component :is="kpi.icon" /></el-icon>
          </div>
          <div class="kpi-info">
            <div class="kpi-value">{{ kpi.formatted }}</div>
            <div class="kpi-label">{{ kpi.label }}</div>
          </div>
        </div>
        <div class="kpi-footer" v-if="kpi.sub">
          <span class="kpi-sub">{{ kpi.sub }}</span>
        </div>
        <svg class="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
          <polyline :points="kpi.spark" fill="none" :stroke="kpi.sparkColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="chart-grid">
      <!-- Revenue Bar Chart -->
      <div class="chart-card chart-main">
        <div class="chart-card-header">
          <div>
            <h3>Doanh thu theo tháng</h3>
            <p v-if="!salesLoading && salesData.length">{{ salesPeriodLabel }}</p>
            <p v-else>Đang tải...</p>
          </div>
          <div class="chart-legend">
            <span class="legend-dot" style="background:#0ea5e9"></span> Đơn hàng
            <span class="legend-dot" style="background:#34d399;margin-left:12px"></span> Doanh thu
          </div>
        </div>
        <div class="bar-chart-wrap" v-loading="salesLoading">
          <div v-if="salesData.length === 0 && !salesLoading" class="empty-chart">
            <el-empty description="Không có dữ liệu doanh số" :image-size="80" />
          </div>
          <svg v-else viewBox="0 0 700 220" class="bar-svg" preserveAspectRatio="xMidYMid meet">
            <line v-for="i in 5" :key="i" x1="10" :y1="i * 36" x2="700" :y2="i * 36"
              stroke="rgba(148,163,184,0.12)" stroke-width="1" />
            <g v-for="(row, idx) in salesData.slice(0,12)" :key="idx">
              <!-- Revenue bar -->
              <rect
                :x="idx * 56 + 20"
                :y="200 - (row.revenue / maxRevenue) * 180"
                width="24"
                :height="(row.revenue / maxRevenue) * 180"
                rx="3" fill="url(#barGrad)" class="bar-rect"
              >
                <title>{{ fmtVND(row.revenue) }}</title>
              </rect>
              <!-- Orders dot -->
              <circle
                :cx="idx * 56 + 32"
                :cy="210 - (row.orders_count / maxOrders) * 60"
                r="4" fill="#34d399" stroke="#fff" stroke-width="1.5"
              >
                <title>{{ row.orders_count }} đơn</title>
              </circle>
              <text :x="idx * 56 + 32" y="218" text-anchor="middle"
                font-size="8" fill="rgba(148,163,184,0.8)">{{ row.period }}</text>
            </g>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38bdf8" />
                <stop offset="100%" stop-color="#0369a1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <!-- Donut — Order Status -->
      <div class="chart-card chart-donut">
        <div class="chart-card-header">
          <div>
            <h3>Trạng thái đơn hàng</h3>
            <p>Tổng cộng</p>
          </div>
        </div>
        <div class="donut-wrap" v-loading="loading">
          <svg viewBox="0 0 140 140" class="donut-svg">
            <circle cx="70" cy="70" r="52" fill="none" stroke="rgba(148,163,184,0.1)" stroke-width="20" />
            <!-- Completed -->
            <circle cx="70" cy="70" r="52" fill="none" stroke="#34d399" stroke-width="20"
              :stroke-dasharray="`${completedArc} 327`" stroke-dashoffset="0" stroke-linecap="round" />
            <!-- Pending -->
            <circle cx="70" cy="70" r="52" fill="none" stroke="#0ea5e9" stroke-width="20"
              :stroke-dasharray="`${pendingArc} 327`" :stroke-dashoffset="`-${completedArc}`" stroke-linecap="round" />
            <!-- Cancelled -->
            <circle cx="70" cy="70" r="52" fill="none" stroke="#f87171" stroke-width="20"
              :stroke-dasharray="`${cancelledArc} 327`" :stroke-dashoffset="`-${completedArc + pendingArc}`" stroke-linecap="round" />
            <text x="70" y="65" text-anchor="middle" font-size="20" font-weight="700" fill="var(--text-primary)">
              {{ dashData?.sales?.total_orders ?? '–' }}
            </text>
            <text x="70" y="82" text-anchor="middle" font-size="9" fill="rgba(148,163,184,0.8)">Tổng đơn</text>
          </svg>
          <div class="donut-legend">
            <div class="donut-legend-item">
              <span class="donut-dot" style="background:#34d399"></span>
              <span class="donut-legend-label">Hoàn thành</span>
              <span class="donut-legend-val">{{ dashData?.sales?.completed_orders ?? 0 }}</span>
            </div>
            <div class="donut-legend-item">
              <span class="donut-dot" style="background:#0ea5e9"></span>
              <span class="donut-legend-label">Đang xử lý</span>
              <span class="donut-legend-val">{{ dashData?.sales?.pending_orders ?? 0 }}</span>
            </div>
            <div class="donut-legend-item">
              <span class="donut-dot" style="background:#f87171"></span>
              <span class="donut-legend-label">Đã huỷ</span>
              <span class="donut-legend-val">{{ dashData?.sales?.cancelled_orders ?? 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Row -->
    <div class="bottom-grid">
      <!-- Top Products -->
      <div class="dash-panel">
        <div class="panel-header">
          <h3><el-icon><Box /></el-icon> Sản phẩm bán chạy</h3>
          <router-link to="/products" class="see-all">Xem tất cả →</router-link>
        </div>
        <div class="top-products" v-loading="topProductsLoading">
          <el-empty v-if="topProducts.length === 0 && !topProductsLoading" description="Không có dữ liệu" :image-size="60" />
          <div v-for="(p, idx) in topProducts" :key="p.id" class="product-row">
            <span class="product-rank" :class="`rank-${idx + 1}`">{{ idx + 1 }}</span>
            <div class="product-name-wrap">
              <span class="product-name">{{ p.name }}</span>
              <div class="progress-bar-wrap">
                <div class="progress-bar" :style="{ width: Math.round(p.total_sold / topProducts[0]?.total_sold * 100) + '%', background: rankColors[idx] }"></div>
              </div>
            </div>
            <span class="product-sold">{{ p.total_sold?.toLocaleString() }} sp</span>
          </div>
        </div>
      </div>

      <!-- HR & Production Stats -->
      <div class="dash-panel">
        <div class="panel-header">
          <h3><el-icon><Avatar /></el-icon> Nhân sự & Sản xuất</h3>
        </div>
        <div class="stats-list" v-loading="loading">
          <div class="stat-item">
            <span class="stat-item-label">Nhân viên</span>
            <span class="stat-item-value">{{ dashData?.hr?.total_employees ?? '–' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-item-label">Đang làm việc</span>
            <span class="stat-item-value text-green">{{ dashData?.hr?.active_employees ?? '–' }}</span>
          </div>
          <div class="stat-item">
            <div class="divider"></div>
          </div>
          <div class="stat-item">
            <span class="stat-item-label">Lệnh sản xuất</span>
            <span class="stat-item-value">{{ dashData?.production?.total_orders ?? '–' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-item-label">Đang sản xuất</span>
            <span class="stat-item-value text-amber">{{ dashData?.production?.in_progress ?? '–' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-item-label">Hoàn thành</span>
            <span class="stat-item-value text-green">{{ dashData?.production?.completed ?? '–' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-item-label">Tổng SL sản xuất</span>
            <span class="stat-item-value">{{ dashData?.production?.total_quantity_produced?.toLocaleString() ?? '–' }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Links to Reports -->
      <div class="dash-panel">
        <div class="panel-header">
          <h3><el-icon><PieChart /></el-icon> Báo cáo nhanh</h3>
        </div>
        <div class="quick-reports">
          <router-link v-for="r in quickReports" :key="r.to" :to="r.to" class="report-link-card">
            <el-icon class="report-link-icon" :style="{ color: r.color }">
              <component :is="r.icon" />
            </el-icon>
            <div>
              <div class="report-link-title">{{ r.title }}</div>
              <div class="report-link-sub">{{ r.sub }}</div>
            </div>
            <el-icon class="report-arrow"><ArrowRight /></el-icon>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  TrendCharts, Document, User, Box, PieChart,
  ArrowRight, Download, DataAnalysis, Avatar, Refresh
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { getDashboard, getSalesReport, getTopProducts } from '@/api/reports'

const authStore = useAuthStore()
const loading = ref(false)
const salesLoading = ref(false)
const topProductsLoading = ref(false)

const dashData = ref(null)
const salesData = ref([])
const topProducts = ref([])

const todayStr = new Date().toLocaleDateString('vi-VN', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
})

const fmtVND = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0)
const fmtMillions = (v) => {
  if (!v) return '0'
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + ' tỷ'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' tr'
  return v.toLocaleString()
}

// ─── KPI Cards computed from API ─────────────────────────────
const kpis = computed(() => {
  const s = dashData.value?.sales || {}
  const inv = dashData.value?.inventory || {}
  const ov = dashData.value?.overview || {}
  return [
    {
      key: 'revenue', label: 'Doanh thu tháng', color: 'blue',
      formatted: fmtMillions(s.total_revenue || ov.month_revenue),
      sub: `Hôm nay: ${fmtMillions(ov.today_revenue)}`,
      icon: 'TrendCharts',
      spark: '0,28 15,20 30,25 45,10 60,18 75,5 100,12',
      sparkColor: 'rgba(56,189,248,0.7)'
    },
    {
      key: 'orders', label: 'Tổng đơn hàng', color: 'green',
      formatted: (s.total_orders || 0).toLocaleString(),
      sub: `Hôm nay: ${ov.today_orders || 0} đơn`,
      icon: 'Document',
      spark: '0,22 20,15 40,18 55,8 70,14 85,6 100,10',
      sparkColor: 'rgba(52,211,153,0.7)'
    },
    {
      key: 'products', label: 'Tổng sản phẩm', color: 'amber',
      formatted: (inv.total_products || 0).toLocaleString(),
      sub: `Sắp hết: ${inv.low_stock_products || 0} sp`,
      icon: 'Box',
      spark: '0,20 25,16 45,22 60,12 75,18 88,8 100,14',
      sparkColor: 'rgba(251,146,60,0.7)'
    },
    {
      key: 'inventory_value', label: 'Giá trị tồn kho', color: 'purple',
      formatted: fmtMillions(inv.total_inventory_value),
      sub: `Tổng SL: ${(inv.total_quantity || 0).toLocaleString()}`,
      icon: 'DataAnalysis',
      spark: '0,10 20,18 38,14 55,22 70,16 85,20 100,15',
      sparkColor: 'rgba(167,139,250,0.7)'
    },
  ]
})

// ─── Donut arcs (circumference = 327) ────────────────────────
const completedArc = computed(() => {
  const s = dashData.value?.sales || {}
  const total = s.total_orders || 1
  return Math.round((s.completed_orders || 0) / total * 327)
})
const pendingArc = computed(() => {
  const s = dashData.value?.sales || {}
  const total = s.total_orders || 1
  return Math.round((s.pending_orders || 0) / total * 327)
})
const cancelledArc = computed(() => {
  const s = dashData.value?.sales || {}
  const total = s.total_orders || 1
  return Math.round((s.cancelled_orders || 0) / total * 327)
})

// ─── Bar chart helpers ────────────────────────────────────────
const maxRevenue = computed(() => {
  if (!salesData.value.length) return 1
  return Math.max(...salesData.value.map(r => r.revenue || 0)) || 1
})
const maxOrders = computed(() => {
  if (!salesData.value.length) return 1
  return Math.max(...salesData.value.map(r => r.orders_count || 0)) || 1
})
const salesPeriodLabel = computed(() => {
  if (!salesData.value.length) return ''
  return `${salesData.value[0]?.period} → ${salesData.value[salesData.value.length - 1]?.period}`
})

const rankColors = ['#0ea5e9','#34d399','#fb923c','#a78bfa','#f87171']

// ─── Quick Reports ────────────────────────────────────────────
const quickReports = [
  { to: '/reports/sales',                title: 'Báo cáo doanh số',       sub: 'Theo tháng / quý',    icon: 'TrendCharts', color: '#0ea5e9' },
  { to: '/reports/inventory',            title: 'Báo cáo tồn kho',        sub: 'Nhập xuất tồn',       icon: 'Box',         color: '#34d399' },
  { to: '/reports/production-efficiency',title: 'Hiệu suất sản xuất',     sub: 'Lệnh SX & hoàn thành',icon: 'DataAnalysis',color: '#fb923c' },
  { to: '/reports/customers',            title: 'Báo cáo khách hàng',     sub: 'Top KH & phân tích',  icon: 'User',        color: '#a78bfa' },
  { to: '/reports/financial',            title: 'Tổng kết tài chính',     sub: 'Lãi lỗ & chi phí',    icon: 'PieChart',    color: '#f87171' },
]

// ─── Fetch ────────────────────────────────────────────────────
async function fetchDashboard() {
  loading.value = true
  try {
    const res = await getDashboard()
    dashData.value = res
  } catch (e) {
    ElMessage.error('Không thể tải dữ liệu tổng quan')
  } finally {
    loading.value = false
  }
}

async function fetchSales() {
  salesLoading.value = true
  try {
    const res = await getSalesReport('monthly')
    salesData.value = res.data || []
  } catch (e) {
    // silent
  } finally {
    salesLoading.value = false
  }
}

async function fetchTopProducts() {
  topProductsLoading.value = true
  try {
    const res = await getTopProducts(5)
    topProducts.value = res.data || []
  } catch (e) {
    // silent
  } finally {
    topProductsLoading.value = false
  }
}

async function fetchAll() {
  await Promise.all([fetchDashboard(), fetchSales(), fetchTopProducts()])
}

const exportReport = () => ElMessage.info('Tính năng xuất báo cáo đang phát triển')

onMounted(fetchAll)
</script>

<style scoped lang="scss">
.dashboard { min-height: 100%; }

// ─── Header ───────────────────────────────────────────────────
.dash-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 28px; gap: 16px; flex-wrap: wrap;
}
.dash-title { font-size: 22px; font-weight: 800; color: var(--text-primary); margin: 0 0 4px; }
.dash-subtitle { font-size: 13.5px; color: var(--text-secondary); margin: 0; strong { color: var(--primary-color); } }
.dash-actions { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }

// ─── KPI Grid ─────────────────────────────────────────────────
.kpi-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 24px;
  @media(max-width:1100px){grid-template-columns:repeat(2,1fr);}
  @media(max-width:580px){grid-template-columns:1fr;}
}
.kpi-card {
  background: var(--bg-card); border-radius: 16px; padding: 20px 20px 10px;
  border: 1px solid var(--border-color); position: relative; overflow: hidden;
  transition: transform 0.25s, box-shadow 0.25s;
  &:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.12); }
  &::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:16px 16px 0 0; }
  &.kpi-blue::before   { background: linear-gradient(90deg, #0ea5e9, #38bdf8); }
  &.kpi-green::before  { background: linear-gradient(90deg, #10b981, #34d399); }
  &.kpi-amber::before  { background: linear-gradient(90deg, #f59e0b, #fb923c); }
  &.kpi-purple::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
}
.kpi-body { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
.kpi-icon-wrap {
  width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center;
  justify-content: center; font-size: 24px; flex-shrink: 0;
  .kpi-blue &   { background: rgba(14,165,233,0.12); color: #0ea5e9; }
  .kpi-green &  { background: rgba(16,185,129,0.12); color: #10b981; }
  .kpi-amber &  { background: rgba(245,158,11,0.12); color: #f59e0b; }
  .kpi-purple & { background: rgba(139,92,246,0.12); color: #8b5cf6; }
}
.kpi-value { font-size: 24px; font-weight: 800; color: var(--text-primary); line-height:1; margin-bottom: 4px; }
.kpi-label { font-size: 13px; color: var(--text-secondary); }
.kpi-footer { margin-bottom: 8px; }
.kpi-sub { font-size: 11.5px; color: var(--text-secondary); }
.sparkline { width: 100%; height: 28px; display: block; opacity: 0.7; }

// ─── Chart Grid ───────────────────────────────────────────────
.chart-grid { display: grid; grid-template-columns: 1fr 320px; gap: 18px; margin-bottom: 24px; @media(max-width:1024px){grid-template-columns:1fr;} }
.chart-card { background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border-color); padding: 24px; transition: box-shadow 0.25s; &:hover{box-shadow:0 4px 24px rgba(0,0,0,0.08);} }
.chart-card-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; flex-wrap:wrap; gap:10px; h3{font-size:15px;font-weight:700;color:var(--text-primary);margin:0 0 3px;} p{font-size:12px;color:var(--text-secondary);margin:0;} }
.chart-legend { display:flex;align-items:center;font-size:12.5px;color:var(--text-secondary); }
.legend-dot { display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px; }
.bar-chart-wrap { overflow-x:auto; min-height: 220px; }
.bar-svg { width:100%;min-width:500px;height:230px; .bar-rect{cursor:pointer;transition:opacity 0.2s;&:hover{opacity:0.8;}} }
.empty-chart { display:flex;align-items:center;justify-content:center;height:200px; }

// Donut
.donut-wrap { display:flex;flex-direction:column;align-items:center;gap:16px; }
.donut-svg { width:160px;height:160px; }
.donut-legend { width:100%;display:flex;flex-direction:column;gap:10px; }
.donut-legend-item { display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary); }
.donut-dot { width:10px;height:10px;border-radius:50%;flex-shrink:0; }
.donut-legend-label { flex:1; }
.donut-legend-val { font-weight:600;color:var(--text-primary); }

// ─── Bottom Grid ──────────────────────────────────────────────
.bottom-grid { display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:18px; @media(max-width:1100px){grid-template-columns:1fr 1fr;} @media(max-width:680px){grid-template-columns:1fr;} }
.dash-panel { background:var(--bg-card);border-radius:16px;border:1px solid var(--border-color);padding:20px;transition:box-shadow 0.25s;&:hover{box-shadow:0 4px 24px rgba(0,0,0,0.08);} }
.panel-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:16px; h3{display:flex;align-items:center;gap:8px;font-size:14.5px;font-weight:700;color:var(--text-primary);margin:0;.el-icon{color:var(--primary-color);}} }
.see-all { font-size:12.5px;color:var(--primary-color);text-decoration:none;&:hover{text-decoration:underline;} }

// Top Products
.top-products { display:flex;flex-direction:column;gap:14px;min-height:80px; }
.product-row { display:flex;align-items:center;gap:12px; }
.product-rank { width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0; &.rank-1{background:#fbbf24;color:#fff;} &.rank-2{background:rgba(148,163,184,0.3);color:var(--text-primary);} &.rank-3{background:rgba(180,120,80,0.25);color:#b45309;} &.rank-4,&.rank-5{background:var(--bg-page);color:var(--text-secondary);} }
.product-name-wrap { flex:1;min-width:0; }
.product-name { font-size:12.5px;color:var(--text-primary);display:block;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.progress-bar-wrap { height:4px;background:var(--bg-page);border-radius:4px;overflow:hidden; }
.progress-bar { height:100%;border-radius:4px;transition:width 0.8s ease; }
.product-sold { font-size:12px;color:var(--text-secondary);white-space:nowrap; }

// Stats list
.stats-list { display:flex;flex-direction:column;gap:0; }
.stat-item { display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:8px;font-size:13px;transition:background 0.15s;&:hover{background:var(--bg-page);} .divider{width:100%;height:1px;background:var(--border-color);} }
.stat-item-label { color:var(--text-secondary); }
.stat-item-value { font-weight:700;color:var(--text-primary); }
.text-green { color:#10b981!important; }
.text-amber { color:#f59e0b!important; }

// Quick Reports
.quick-reports { display:flex;flex-direction:column;gap:8px; }
.report-link-card { display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;background:var(--bg-page);text-decoration:none;transition:all 0.2s;border:1px solid transparent;&:hover{background:rgba(14,165,233,0.06);border-color:rgba(14,165,233,0.2);transform:translateX(3px);} }
.report-link-icon { font-size:20px;flex-shrink:0; }
.report-link-title { font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:1px; }
.report-link-sub { font-size:11.5px;color:var(--text-secondary); }
.report-arrow { margin-left:auto;color:var(--text-secondary);font-size:14px; }
</style>
