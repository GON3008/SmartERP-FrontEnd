<template>
  <div class="report-page">
    <div class="report-header">
      <div class="report-header__left">
        <el-icon class="report-header__icon" style="background:rgba(251,146,60,0.12);color:#f59e0b"><DataAnalysis /></el-icon>
        <div>
          <h2>Hiệu suất sản xuất</h2>
          <p>Chỉ số hoàn thành, lệnh sản xuất và năng suất</p>
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
      <div class="report-kpi" style="border-top-color:#f59e0b">
        <div class="report-kpi__value">{{ data.total_orders?.toLocaleString() ?? '–' }}</div>
        <div class="report-kpi__label">Tổng lệnh SX</div>
      </div>
      <div class="report-kpi" style="border-top-color:#34d399">
        <div class="report-kpi__value">{{ data.completed_orders?.toLocaleString() ?? '–' }}</div>
        <div class="report-kpi__label">Đã hoàn thành</div>
        <div class="report-kpi__trend up" v-if="data.completed_orders">▲ Hoàn thành</div>
      </div>
      <div class="report-kpi" :style="{ borderTopColor: data.completion_rate >= 70 ? '#34d399' : '#f87171' }">
        <div class="report-kpi__value">{{ data.completion_rate ?? 0 }}%</div>
        <div class="report-kpi__label">Tỉ lệ hoàn thành</div>
        <div class="report-kpi__trend" :class="data.completion_rate >= 70 ? 'up' : 'down'">
          {{ data.completion_rate >= 70 ? '▲ Tốt' : '▼ Cần cải thiện' }}
        </div>
      </div>
      <div class="report-kpi" style="border-top-color:#0ea5e9">
        <div class="report-kpi__value">{{ data.total_quantity_produced?.toLocaleString() ?? '–' }}</div>
        <div class="report-kpi__label">Tổng SL sản xuất</div>
      </div>
    </div>

    <!-- Completion Rate Gauge -->
    <div class="two-col-grid">
      <div class="report-card">
        <div class="report-card-header"><h3>📊 Tỉ lệ hoàn thành lệnh SX</h3></div>
        <div v-if="loading" style="height:200px;display:flex;align-items:center;justify-content:center">
          <el-icon class="is-loading" style="font-size:32px"><Refresh /></el-icon>
        </div>
        <div v-else class="gauge-center">
          <svg viewBox="0 0 200 130" class="gauge-svg-big">
            <path d="M25,110 A90,90 0 0,1 175,110" fill="none" stroke="rgba(148,163,184,0.15)" stroke-width="18" stroke-linecap="round"/>
            <path :d="bigArcPath(data.completion_rate || 0)" fill="none"
              :stroke="data.completion_rate >= 70 ? '#34d399' : data.completion_rate >= 40 ? '#fb923c' : '#f87171'"
              stroke-width="18" stroke-linecap="round"/>
            <text x="100" y="92" text-anchor="middle" font-size="32" font-weight="900" fill="var(--text-primary)">
              {{ data.completion_rate ?? 0 }}%
            </text>
            <text x="100" y="112" text-anchor="middle" font-size="11" fill="rgba(148,163,184,0.8)">Tỉ lệ hoàn thành</text>
          </svg>
          <div class="gauge-meta">
            <div class="gauge-meta-item">
              <span>Hoàn thành</span>
              <strong style="color:#34d399">{{ data.completed_orders ?? 0 }}</strong>
            </div>
            <div class="gauge-meta-item">
              <span>Tổng lệnh</span>
              <strong>{{ data.total_orders ?? 0 }}</strong>
            </div>
            <div class="gauge-meta-item" v-if="data.average_production_time">
              <span>Thời gian TB</span>
              <strong>{{ (data.average_production_time || 0).toFixed(1) }} ngày</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Dashboard Production stats -->
      <div class="report-card">
        <div class="report-card-header"><h3>📦 Trạng thái lệnh sản xuất</h3></div>
        <div class="prod-status-list" v-loading="loading">
          <el-empty v-if="!data.total_orders && !loading" description="Không có dữ liệu" :image-size="60" />
          <template v-else>
            <div class="prod-status-item" v-for="s in statusList" :key="s.label">
              <div class="prod-status-header">
                <span class="prod-status-label">
                  <span class="prod-dot" :style="{ background: s.color }"></span>
                  {{ s.label }}
                </span>
                <span class="prod-status-val">{{ s.count }}</span>
              </div>
              <div class="prod-bar-wrap">
                <div class="prod-bar" :style="{ width: s.pct + '%', background: s.color }"></div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Production Orders list -->
    <div class="report-card">
      <div class="report-card-header">
        <h3>Danh sách lệnh sản xuất</h3>
      </div>
      <el-table :data="productionOrders" stripe size="small" class="report-table" v-loading="ordersLoading">
        <el-table-column label="Mã lệnh" prop="id" width="90" />
        <el-table-column label="Sản phẩm" min-width="180">
          <template #default="{ row }">{{ row.product?.name ?? '–' }}</template>
        </el-table-column>
        <el-table-column label="SL" prop="quantity" width="80" align="center" />
        <el-table-column label="Trạng thái" width="130">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'completed' ? 'success' : row.status === 'in_progress' ? 'primary' : row.status === 'cancelled' ? 'danger' : 'info'"
              size="small" effect="light">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Bắt đầu" prop="start_date" width="120" />
        <el-table-column label="Kết thúc" prop="end_date" width="120" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Refresh } from '@element-plus/icons-vue'
import { getProductionEfficiency } from '@/api/reports'
import request from '@/utils/request'

const dateRange = ref([])
const loading = ref(false)
const ordersLoading = ref(false)
const data = ref({})
const productionOrders = ref([])

const statusLabel = (s) => ({ pending: 'Chờ SX', in_progress: 'Đang SX', completed: 'Hoàn thành', cancelled: 'Huỷ' })[s] || s

const statusList = computed(() => {
  const total = data.value.total_orders || 1
  return [
    { label: 'Hoàn thành', count: data.value.completed_orders || 0, color: '#34d399', pct: Math.round((data.value.completed_orders||0)/total*100) },
    { label: 'Đang SX',    count: (data.value.total_orders||0) - (data.value.completed_orders||0) - (data.value.pending||0), color: '#0ea5e9', pct: Math.round(((data.value.total_orders||0)-(data.value.completed_orders||0)-(data.value.pending||0))/total*100) },
    { label: 'Chờ xử lý', count: data.value.pending || 0, color: '#fb923c', pct: Math.round((data.value.pending||0)/total*100) },
  ]
})

const bigArcPath = (pct) => {
  const r = 90, cx = 100, cy = 110
  const startAngle = Math.PI
  const sweep = Math.PI * (pct / 100)
  const endAngle = Math.PI - sweep
  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy - r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy - r * Math.sin(endAngle)
  return `M${x1},${y1} A${r},${r} 0 ${sweep > Math.PI ? 1 : 0},1 ${x2},${y2}`
}

async function fetchData() {
  loading.value = true
  try {
    const filters = {}
    if (dateRange.value?.length === 2) {
      filters.from_date = dateRange.value[0]
      filters.to_date   = dateRange.value[1]
    }
    data.value = await getProductionEfficiency(filters) || {}
  } catch (e) {
    ElMessage.error('Lỗi tải dữ liệu sản xuất')
  } finally {
    loading.value = false
  }
}

async function fetchOrders() {
  ordersLoading.value = true
  try {
    const res = await request.get('/production', { params: { per_page: 20 } })
    productionOrders.value = res.data || []
  } catch {} finally {
    ordersLoading.value = false
  }
}

onMounted(() => { fetchData(); fetchOrders() })
</script>

<style scoped lang="scss">
@use './report-shared.scss';
.two-col-grid { display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px;@media(max-width:768px){grid-template-columns:1fr;} }
.gauge-center { display:flex;flex-direction:column;align-items:center;gap:16px; }
.gauge-svg-big { width:220px;height:140px; }
.gauge-meta { display:flex;gap:20px;flex-wrap:wrap;justify-content:center; }
.gauge-meta-item { text-align:center;font-size:13px; span{display:block;color:var(--text-secondary);margin-bottom:2px;} strong{font-size:16px;color:var(--text-primary);} }
.prod-status-list { display:flex;flex-direction:column;gap:16px; }
.prod-status-header { display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px; }
.prod-status-label { display:flex;align-items:center;gap:8px;color:var(--text-secondary); }
.prod-dot { width:10px;height:10px;border-radius:50%; }
.prod-status-val { font-weight:700;color:var(--text-primary); }
.prod-bar-wrap { height:8px;background:var(--bg-page);border-radius:4px;overflow:hidden; }
.prod-bar { height:100%;border-radius:4px;transition:width 0.8s ease; }
</style>
