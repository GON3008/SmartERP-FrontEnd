<template>
  <div class="report-page">
    <div class="report-header">
      <div class="report-header__left">
        <el-icon class="report-header__icon" style="background:rgba(248,113,113,0.12);color:#ef4444"><PieChart /></el-icon>
        <div>
          <h2>Tổng kết tài chính</h2>
          <p>Báo cáo doanh thu, chi phí và lợi nhuận
            <el-tag type="danger" size="small" effect="light" style="margin-left:8px">Admin</el-tag>
          </p>
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
      <div class="report-kpi" style="border-top-color:#0ea5e9">
        <div class="report-kpi__value">{{ fmtM(data.revenue) }}</div>
        <div class="report-kpi__label">Tổng doanh thu</div>
        <div class="report-kpi__sub">{{ periodLabel }}</div>
      </div>
      <div class="report-kpi" style="border-top-color:#f87171">
        <div class="report-kpi__value" style="color:#f87171">{{ fmtM(data.expenses) }}</div>
        <div class="report-kpi__label">Tổng chi phí lương</div>
        <div class="report-kpi__sub">Từ bảng lương</div>
      </div>
      <div class="report-kpi" :style="{ borderTopColor: data.profit >= 0 ? '#34d399' : '#f87171' }">
        <div class="report-kpi__value" :style="{ color: data.profit >= 0 ? '#10b981' : '#f87171' }">
          {{ data.profit >= 0 ? '+' : '' }}{{ fmtM(data.profit) }}
        </div>
        <div class="report-kpi__label">Lợi nhuận</div>
        <div class="report-kpi__trend" :class="data.profit >= 0 ? 'up' : 'down'">
          {{ data.profit >= 0 ? '▲ Có lãi' : '▼ Lỗ' }}
        </div>
      </div>
      <div class="report-kpi" :style="{ borderTopColor: data.profit_margin >= 20 ? '#34d399' : '#fb923c' }">
        <div class="report-kpi__value">{{ data.profit_margin ?? 0 }}%</div>
        <div class="report-kpi__label">Biên lợi nhuận</div>
        <div class="report-kpi__trend" :class="data.profit_margin >= 20 ? 'up' : 'down'">
          {{ data.profit_margin >= 20 ? '▲ Tốt' : '▼ Cần cải thiện' }}
        </div>
      </div>
    </div>

    <!-- Main Financial Cards -->
    <div class="two-col-grid">
      <!-- P&L Summary -->
      <div class="report-card">
        <div class="report-card-header"><h3>📊 Báo cáo lãi lỗ (P&L)</h3></div>
        <div v-loading="loading">
          <el-empty v-if="!data.revenue && !loading" description="Chưa có dữ liệu tài chính" :image-size="60" />
          <div v-else class="pl-table">
            <div class="pl-row">
              <span class="pl-label">Doanh thu</span>
              <span class="pl-value" style="color:#0ea5e9">{{ fmtVND(data.revenue) }}</span>
            </div>
            <div class="pl-row separator">
              <span class="pl-label">Chi phí lương (từ bảng lương)</span>
              <span class="pl-value" style="color:#f87171">- {{ fmtVND(data.expenses) }}</span>
            </div>
            <div class="pl-row bold separator">
              <span class="pl-label">Lợi nhuận gộp</span>
              <span class="pl-value" :style="{ color: data.profit >= 0 ? '#10b981' : '#f87171' }">
                {{ fmtVND(data.profit) }}
              </span>
            </div>
            <div class="pl-row separator">
              <span class="pl-label">Biên lợi nhuận</span>
              <span class="pl-value">{{ data.profit_margin ?? 0 }}%</span>
            </div>
          </div>
        </div>

        <!-- Margin visual ring -->
        <div v-if="data.profit_margin !== undefined" class="margin-ring">
          <svg viewBox="0 0 120 120" width="120" height="120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(148,163,184,0.1)" stroke-width="12"/>
            <circle cx="60" cy="60" r="50" fill="none"
              :stroke="data.profit_margin >= 20 ? '#34d399' : '#fb923c'"
              stroke-width="12" stroke-linecap="round"
              :stroke-dasharray="`${Math.min(data.profit_margin, 100) * 3.14} 314`"
              stroke-dashoffset="78.5" />
            <text x="60" y="56" text-anchor="middle" font-size="18" font-weight="800" fill="var(--text-primary)">{{ data.profit_margin }}%</text>
            <text x="60" y="73" text-anchor="middle" font-size="9" fill="rgba(148,163,184,0.8)">Biên LN</text>
          </svg>
          <div class="margin-ring-label">
            <strong :class="data.profit_margin >= 20 ? 'ok' : 'warn'">
              {{ data.profit_margin >= 30 ? 'Tuyệt vời' : data.profit_margin >= 20 ? 'Tốt' : data.profit_margin >= 10 ? 'Trung bình' : 'Thấp' }}
            </strong>
            <span>Biên lợi nhuận {{ data.profit_margin >= 20 ? 'đạt mục tiêu' : 'chưa đạt mục tiêu' }}</span>
          </div>
        </div>
      </div>

      <!-- Revenue vs Expense Bar -->
      <div class="report-card">
        <div class="report-card-header"><h3>💰 Doanh thu vs Chi phí</h3></div>
        <div v-loading="loading">
          <el-empty v-if="!data.revenue && !loading" description="Không có dữ liệu" :image-size="60"/>
          <div v-else class="rev-exp-bars">
            <div class="re-row">
              <div class="re-header">
                <span>Doanh thu</span>
                <span class="text-blue">{{ fmtM(data.revenue) }}</span>
              </div>
              <div class="re-bar-wrap">
                <div class="re-bar revenue" style="width:100%"></div>
              </div>
            </div>
            <div class="re-row">
              <div class="re-header">
                <span>Chi phí lương</span>
                <span style="color:#f87171">{{ fmtM(data.expenses) }}</span>
              </div>
              <div class="re-bar-wrap">
                <div class="re-bar expense" :style="{ width: Math.min(Math.round(data.expenses/data.revenue*100), 100) + '%' }"></div>
              </div>
            </div>
            <div class="re-row">
              <div class="re-header">
                <span>Lợi nhuận</span>
                <span :style="{ color: data.profit >= 0 ? '#10b981' : '#f87171' }">{{ fmtM(data.profit) }}</span>
              </div>
              <div class="re-bar-wrap">
                <div class="re-bar profit" :style="{ width: Math.max(Math.round(data.profit/data.revenue*100), 0) + '%' }"></div>
              </div>
            </div>

            <div class="fin-period" v-if="data.period">
              <el-icon><Calendar /></el-icon>
              <span>Kỳ: {{ formatDate(data.period?.from) }} → {{ formatDate(data.period?.to) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { PieChart, Refresh, Calendar } from '@element-plus/icons-vue'
import { getFinancialSummary } from '@/api/reports'

const dateRange = ref([])
const loading = ref(false)
const data = ref({})

const fmtVND = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0)
const fmtM = (v) => {
  if (!v) return '0'
  const n = Number(v)
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' tỷ'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + ' tr'
  return n.toLocaleString()
}
const formatDate = (d) => {
  if (!d) return '–'
  return new Date(d).toLocaleDateString('vi-VN')
}

const periodLabel = computed(() => {
  if (!data.value.period) return ''
  return `${formatDate(data.value.period.from)} – ${formatDate(data.value.period.to)}`
})

async function fetchData() {
  loading.value = true
  try {
    const filters = {}
    if (dateRange.value?.length === 2) {
      filters.from_date = dateRange.value[0]
      filters.to_date   = dateRange.value[1]
    }
    data.value = await getFinancialSummary(filters) || {}
  } catch (e) {
    if (e?.response?.status === 403) {
      ElMessage.error('Bạn không có quyền xem báo cáo tài chính (yêu cầu: Admin / Kế toán)')
    } else {
      ElMessage.error('Lỗi tải dữ liệu tài chính')
    }
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped lang="scss">
@use './report-shared.scss';
.two-col-grid { display:grid;grid-template-columns:1fr 1fr;gap:18px;@media(max-width:768px){grid-template-columns:1fr;} }
.report-kpi__sub { font-size:11px;color:var(--text-secondary);margin-top:2px; }

// P&L
.pl-table { display:flex;flex-direction:column;gap:0;margin-bottom:20px; }
.pl-row { display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:6px;font-size:13px;color:var(--text-secondary);transition:background 0.15s;&:hover{background:var(--bg-page);} &.separator{border-top:1px solid var(--border-color);margin-top:4px;padding-top:12px;} &.bold{font-weight:700;color:var(--text-primary);} }
.pl-value { font-weight:600;font-size:13px; }

.margin-ring { display:flex;align-items:center;gap:16px;padding:12px 12px;background:var(--bg-page);border-radius:12px; }
.margin-ring-label { font-size:13px;color:var(--text-secondary); strong{display:block;font-size:15px;margin-bottom:2px;&.ok{color:#10b981;}&.warn{color:#fb923c;}} }

// Rev/Expense Bars
.rev-exp-bars { display:flex;flex-direction:column;gap:20px; }
.re-header { display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;color:var(--text-secondary); }
.re-bar-wrap { height:12px;background:var(--bg-page);border-radius:6px;overflow:hidden; }
.re-bar { height:100%;border-radius:6px;transition:width 0.8s ease; &.revenue{background:linear-gradient(90deg,#0ea5e9,#38bdf8);} &.expense{background:linear-gradient(90deg,#ef4444,#f87171);} &.profit{background:linear-gradient(90deg,#10b981,#34d399);} }

.fin-period { display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);margin-top:20px;padding:10px 12px;background:var(--bg-page);border-radius:8px; }
</style>
