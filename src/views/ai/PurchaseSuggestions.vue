<template>
  <div class="ai-suggestions-page">

    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="ai-badge">
          <span class="ai-star">✦</span> AI
        </div>
        <div>
          <h1 class="page-title">Đề xuất nhập hàng</h1>
          <p class="page-sub">Phân tích tồn kho & doanh số bằng <strong>Gemini AI</strong></p>
        </div>
      </div>
      <!-- Gemini Status -->
      <div class="gemini-status" :class="geminiOnline ? 'online' : 'offline'">
        <span class="status-dot"></span>
        <span>{{ geminiOnline ? `Gemini · ${geminiModel}` : 'Gemini offline' }}</span>
      </div>
    </div>

    <!-- Config Panel -->
    <el-card class="config-card">
      <el-form :model="form" inline>
        <el-form-item label="Phân tích">
          <el-select v-model="form.analysis_days" style="width:160px">
            <el-option label="30 ngày gần đây" :value="30" />
            <el-option label="60 ngày gần đây" :value="60" />
            <el-option label="90 ngày gần đây" :value="90" />
            <el-option label="180 ngày gần đây" :value="180" />
          </el-select>
        </el-form-item>
        <el-form-item label="Dự báo">
          <el-select v-model="form.forecast_days" style="width:150px">
            <el-option label="7 ngày tới" :value="7" />
            <el-option label="14 ngày tới" :value="14" />
            <el-option label="30 ngày tới" :value="30" />
            <el-option label="60 ngày tới" :value="60" />
          </el-select>
        </el-form-item>
        <el-form-item label="Lọc sản phẩm">
          <el-checkbox v-model="form.low_stock_only">Chỉ sản phẩm thiếu hàng</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="generating"
            :disabled="!geminiOnline"
            @click="runGenerate"
          >
            <span v-if="!generating">✦ Phân tích & Đề xuất</span>
            <span v-else>Đang phân tích AI...</span>
          </el-button>
          <el-button @click="loadSaved">Xem đề xuất đã lưu</el-button>
        </el-form-item>
      </el-form>
      <el-alert
        v-if="!geminiOnline"
        type="warning"
        :closable="false"
        show-icon
        style="margin-top:8px"
      >
        <template #title>Gemini API chưa được cấu hình. Thêm <code>GEMINI_API_KEY</code> vào file <code>.env</code></template>
      </el-alert>
    </el-card>

    <!-- Generating animation -->
    <div v-if="generating" class="thinking-box">
      <div class="thinking-dots"><span></span><span></span><span></span></div>
      <p>AI đang phân tích dữ liệu tồn kho và tạo đề xuất nhập hàng...</p>
    </div>

    <!-- Summary bar -->
    <div v-if="suggestions.length && !generating" class="summary-bar">
      <div v-for="s in summaryStats" :key="s.label" class="summary-item" :style="{ borderColor: s.color, color: s.color }">
        <span class="sum-num">{{ s.value }}</span>
        <span class="sum-lbl">{{ s.label }}</span>
      </div>
    </div>

    <!-- Results table -->
    <el-card v-if="suggestions.length && !generating" class="results-card" v-loading="loading">
      <template #header>
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px">
          <span class="card-title">{{ suggestions.length }} sản phẩm cần nhập hàng</span>
          <div style="display:flex; gap:8px">
            <el-select v-model="filterPriority" placeholder="Ưu tiên" clearable size="small" style="width:130px">
              <el-option label="🔴 Khẩn cấp" value="high" />
              <el-option label="🟡 Trung bình" value="medium" />
              <el-option label="🟢 Thấp" value="low" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="filteredSuggestions" stripe>
        <el-table-column label="Ưu tiên" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="priorityTag(row.priority)" effect="dark" size="small" round>
              {{ priorityLabel(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Sản phẩm" min-width="180">
          <template #default="{ row }">
            <div class="product-cell">
              <span class="product-name">{{ row.product_name }}</span>
              <span class="product-sku">{{ row.product_sku }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Danh mục" prop="category" width="110" />

        <el-table-column label="Tồn kho" width="120" align="center">
          <template #default="{ row }">
            <div class="stock-cell">
              <span class="stock-current" :class="{ danger: row.current_stock <= row.min_stock }">
                {{ row.current_stock ?? '—' }}
              </span>
              <span class="stock-min">/ tối thiểu {{ row.min_stock }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="TB/ngày" width="90" align="center">
          <template #default="{ row }">{{ row.avg_daily_sales }}</template>
        </el-table-column>

        <el-table-column label="Đề xuất nhập" width="130" align="center">
          <template #default="{ row }">
            <span class="recommend-qty">+{{ row.recommended_quantity }} {{ row.unit }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Chi phí ước tính" width="140" align="right">
          <template #default="{ row }">
            <span v-if="row.estimated_cost" class="price">{{ fmtPrice(row.estimated_cost) }} đ</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>

        <el-table-column label="Lý do AI" min-width="200">
          <template #default="{ row }">
            <span class="ai-reason">{{ row.ai_summary || '—' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="" width="60" align="center">
          <template #default="{ row }">
            <el-button
              type="danger" icon="Delete" size="small" link
              @click="removeSuggestion(row)"
            />
          </template>
        </el-table-column>
      </el-table>

      <!-- Total cost estimate -->
      <div class="total-bar">
        <span class="total-label">Tổng chi phí ước tính:</span>
        <span class="total-amount">{{ fmtPrice(totalCost) }} đ</span>
      </div>
    </el-card>

    <!-- Empty state -->
    <el-empty
      v-if="!suggestions.length && !generating && !loading"
      :image-size="80"
      description="Nhấn 'Phân tích & Đề xuất' để AI phân tích tồn kho và tạo gợi ý nhập hàng"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAiSuggestions, generateAiSuggestions,
  deleteAiSuggestion, checkAiHealth,
} from '@/api/aiSuggestion'

// ── State ─────────────────────────────────────────────────────────
const suggestions    = ref([])
const generating     = ref(false)
const loading        = ref(false)
const geminiOnline   = ref(false)
const geminiModel    = ref('gemini-2.5-flash')
const filterPriority = ref('')

const form = ref({
  analysis_days:  90,
  forecast_days:  30,
  low_stock_only: false,
})

// ── Computed ──────────────────────────────────────────────────────
const filteredSuggestions = computed(() =>
  filterPriority.value
    ? suggestions.value.filter(s => s.priority === filterPriority.value)
    : suggestions.value
)

const totalCost = computed(() =>
  suggestions.value.reduce((sum, s) => sum + (s.estimated_cost || 0), 0)
)

const summaryStats = computed(() => {
  const high   = suggestions.value.filter(s => s.priority === 'high').length
  const medium = suggestions.value.filter(s => s.priority === 'medium').length
  const low    = suggestions.value.filter(s => s.priority === 'low').length
  return [
    { label: 'Khẩn cấp',   value: high,   color: '#f56c6c' },
    { label: 'Trung bình',  value: medium, color: '#e6a23c' },
    { label: 'Thấp',        value: low,    color: '#67c23a' },
    { label: 'Tổng sản phẩm', value: suggestions.value.length, color: '#409eff' },
  ]
})

// ── Methods ───────────────────────────────────────────────────────
const fmtPrice = v => Number(v || 0).toLocaleString('vi-VN')

const priorityLabel = p => ({ high: 'Khẩn cấp', medium: 'TB', low: 'Thấp' }[p] ?? p)
const priorityTag   = p => ({ high: 'danger', medium: 'warning', low: 'success' }[p] ?? 'info')

async function checkHealth() {
  try {
    const res = await checkAiHealth()
    geminiOnline.value = res.online ?? false
    geminiModel.value  = res.current_model ?? 'gemini-2.5-flash'
  } catch {
    geminiOnline.value = false
  }
}

async function loadSaved() {
  loading.value = true
  try {
    const res = await getAiSuggestions({ per_page: 100 })
    suggestions.value = res.data ?? []
    if (!suggestions.value.length) ElMessage.info('Chưa có đề xuất nào được lưu.')
  } catch {
    ElMessage.error('Không tải được đề xuất đã lưu.')
  } finally {
    loading.value = false
  }
}

async function runGenerate() {
  generating.value = true
  suggestions.value = []
  try {
    const res = await generateAiSuggestions({
      analysis_days:  form.value.analysis_days,
      forecast_days:  form.value.forecast_days,
      low_stock_only: form.value.low_stock_only,
    })
    if (res.success) {
      suggestions.value = res.data ?? []
      ElMessage.success(res.message ?? 'Phân tích hoàn tất!')
    } else {
      ElMessage.error(res.message ?? 'Lỗi phân tích AI')
    }
  } catch (e) {
    const msg = e?.response?.data?.message ?? 'Không thể kết nối Gemini API'
    ElMessage.error(msg)
  } finally {
    generating.value = false
  }
}

async function removeSuggestion(row) {
  try {
    await ElMessageBox.confirm(`Xóa đề xuất cho "${row.product_name}"?`, 'Xác nhận', {
      confirmButtonText: 'Xóa', cancelButtonText: 'Huỷ', type: 'warning',
    })
    await deleteAiSuggestion(row.id)
    suggestions.value = suggestions.value.filter(s => s.id !== row.id)
    ElMessage.success('Đã xóa đề xuất!')
  } catch {}
}

onMounted(() => { checkHealth() })
</script>

<style scoped lang="scss">
.ai-suggestions-page { max-width: 1200px; }

.page-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px; flex-wrap: wrap; gap: 12px;
  .header-left { display: flex; align-items: center; gap: 14px; }
  .ai-badge {
    width: 48px; height: 48px; border-radius: 14px;
    background: linear-gradient(135deg, #6366f1, #0ea5e9);
    display: flex; align-items: center; justify-content: center;
    font-weight: 900; font-size: 16px; color: #fff; flex-shrink: 0;
    .ai-star { font-size: 20px; }
  }
  .page-title { font-size: 22px; font-weight: 700; margin: 0; }
  .page-sub   { font-size: 13px; color: var(--text-secondary); margin: 0; }
}

.gemini-status {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;
  .status-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  }
  &.online  { background: #f0fdf4; color: #16a34a; .status-dot { background: #22c55e; box-shadow: 0 0 6px #22c55e; } }
  &.offline { background: #fef2f2; color: #dc2626; .status-dot { background: #ef4444; } }
}

.config-card {
  margin-bottom: 16px;
  :deep(.el-form--inline .el-form-item) {
    flex-wrap: wrap;
  }
}

.thinking-box {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 48px; color: var(--text-secondary);
  .thinking-dots { display: flex; gap: 8px;
    span {
      width: 12px; height: 12px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #0ea5e9);
      animation: bounce 1.2s ease-in-out infinite;
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }
}
@keyframes bounce { 0%,80%,100% { transform: scale(.6); opacity:.4; } 40% { transform: scale(1); opacity:1; } }

.summary-bar {
  display: flex; gap: 12px; margin-bottom: 14px; flex-wrap: wrap;
  .summary-item {
    flex: 1; min-width: 100px;
    border: 2px solid; border-radius: 12px; padding: 10px 14px;
    background: #fff; display: flex; flex-direction: column; align-items: center;
    .sum-num { font-size: 28px; font-weight: 800; line-height: 1; }
    .sum-lbl { font-size: 11px; opacity: .8; margin-top: 4px; }
  }
}

.results-card {
  .card-title { font-size: 15px; font-weight: 600; }
  .product-cell { display: flex; flex-direction: column;
    .product-name { font-weight: 600; }
    .product-sku  { font-size: 11px; color: var(--text-secondary); font-family: monospace; }
  }
  .stock-cell {
    .stock-current { font-size: 18px; font-weight: 700;
      &.danger { color: var(--el-color-danger); }
    }
    .stock-min { font-size: 11px; color: var(--text-secondary); display: block; }
  }
  .recommend-qty { font-weight: 700; color: var(--el-color-primary); font-size: 15px; }
  .price  { font-weight: 600; color: #059669; }
  .muted  { color: var(--text-secondary); }
  .ai-reason { font-size: 12.5px; color: var(--text-secondary); line-height: 1.5; }
  .total-bar {
    display: flex; justify-content: flex-end; align-items: center;
    gap: 12px; margin-top: 12px; padding: 12px 0 4px;
    border-top: 1px solid var(--el-border-color);
    .total-label  { font-size: 14px; color: var(--text-secondary); }
    .total-amount { font-size: 20px; font-weight: 800; color: #059669; }
  }
}

// ── Mobile / Tablet ───────────────────────────────────────────
@media (max-width: 768px) {
  .page-header {
    .page-title { font-size: 18px; }
    .page-sub   { font-size: 12px; }
    .ai-badge   { width: 38px; height: 38px; .ai-star { font-size: 16px; } }
  }

  .gemini-status { font-size: 12px; padding: 4px 10px; }

  .config-card {
    :deep(.el-form--inline) {
      display: flex; flex-direction: column; gap: 0;
      .el-form-item {
        display: flex; flex-direction: column; align-items: flex-start; width: 100%;
        .el-form-item__label { padding-bottom: 4px; }
        .el-select, .el-date-editor { width: 100% !important; }
      }
    }
  }

  .summary-bar .summary-item {
    min-width: calc(50% - 6px);
    .sum-num { font-size: 22px; }
  }

  .results-card {
    overflow-x: auto;
    :deep(.el-table) { min-width: 700px; }
    .total-bar {
      flex-direction: column; align-items: flex-end; gap: 4px;
      .total-amount { font-size: 17px; }
    }
  }
}

@media (max-width: 480px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .gemini-status { align-self: flex-start; }
  .summary-bar { gap: 8px;
    .summary-item { padding: 8px; .sum-num { font-size: 18px; } }
  }
  .thinking-box { padding: 30px 16px; }
}
</style>
