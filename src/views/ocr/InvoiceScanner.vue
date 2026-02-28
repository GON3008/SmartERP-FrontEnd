<template>
  <div class="ocr-page">

    <!-- Header -->
    <div class="ocr-header">
      <div class="header-left">
        <div class="ocr-icon">🧾</div>
        <div>
          <h1 class="page-title">OCR – Đọc hóa đơn / phiếu nhập</h1>
          <p class="page-sub">Upload ảnh hoặc dán văn bản để AI trích xuất và nhập kho tự động</p>
        </div>
      </div>
      <!-- AI Status badge -->
      <div class="ai-status" :class="aiStatus.vision ? 'online' : aiStatus.text ? 'partial' : 'offline'">
        <span class="dot"></span>
        {{ aiStatus.vision ? 'Vision AI sẵn sàng' : aiStatus.text ? 'Text AI (không ảnh)' : 'AI offline' }}
      </div>
    </div>

    <el-row :gutter="16">
      <!-- ── LEFT: Input panel ── -->
      <el-col :xs="24" :lg="13">

        <!-- Mode tabs -->
        <el-card class="input-card">
          <el-tabs v-model="inputMode" class="mode-tabs">

            <!-- IMAGE tab -->
            <el-tab-pane label="📷 Upload ảnh hóa đơn" name="image">
              <div
                class="drop-zone"
                :class="{ 'drop-active': isDragging, 'has-file': previewUrl }"
                @dragover.prevent="isDragging = true"
                @dragleave="isDragging = false"
                @drop.prevent="onDrop"
                @click="$refs.fileInput.click()"
              >
                <input ref="fileInput" type="file" accept="image/*" hidden @change="onFile" />
                <div v-if="!previewUrl" class="drop-hint">
                  <div class="drop-icon">📄</div>
                  <p>Kéo thả ảnh hóa đơn vào đây</p>
                  <p class="drop-sub">hoặc click để chọn file (JPG, PNG, WEBP)</p>
                </div>
                <div v-else class="preview-wrap">
                  <img :src="previewUrl" class="preview-img" alt="Hóa đơn" />
                  <div class="preview-overlay">
                    <el-button type="danger" size="small" @click.stop="clearFile">✕ Xóa</el-button>
                  </div>
                </div>
              </div>
              <el-button
                type="primary" size="large" class="scan-btn"
                :loading="scanning" :disabled="!selectedFile"
                @click="doScanImage"
              >
                {{ scanning ? 'AI đang phân tích...' : '🔍 Phân tích hóa đơn' }}
              </el-button>
              <div v-if="scanning" class="progress-wrap">
                <el-progress :percentage="progressPct" :stroke-width="6" striped striped-flow :duration="15" />
                <span class="progress-tip">{{ scanTip }}</span>
              </div>
            </el-tab-pane>

            <!-- TEXT tab -->
            <el-tab-pane label="📋 Dán văn bản" name="text">
              <el-input
                v-model="pastedText"
                type="textarea"
                :rows="12"
                placeholder="Dán nội dung hóa đơn vào đây (copy từ PDF, email, phần mềm kế toán...)"
                resize="vertical"
              />
              <el-button
                type="primary" size="large" class="scan-btn"
                :loading="scanning" :disabled="pastedText.trim().length < 20"
                @click="doScanText"
              >
                {{ scanning ? 'AI đang phân tích...' : '🤖 Trích xuất dữ liệu' }}
              </el-button>
            </el-tab-pane>

          </el-tabs>
        </el-card>

        <!-- Example tips -->
        <el-card class="tips-card" v-if="!result">
          <div class="tips-title">💡 Hướng dẫn sử dụng</div>
          <ul class="tips-list">
            <li>Hỗ trợ ảnh chụp hóa đơn, phiếu nhập kho, receipt</li>
            <li>Ảnh rõ nét, đủ ánh sáng cho kết quả tốt nhất</li>
            <li>Dùng tab "Dán văn bản" nếu bạn có bản PDF text</li>
            <li>Sau khi AI trích xuất, bạn có thể chỉnh sửa trước khi xác nhận nhập kho</li>
            <li>Hệ thống tự ghép tên sản phẩm với sản phẩm đã có trong kho</li>
          </ul>
          <el-alert v-if="!aiStatus.vision && !aiStatus.text" type="warning" :closable="false" show-icon
            title="Gemini API chưa được cấu hình. Thêm GEMINI_API_KEY vào file .env" />
          <el-alert v-else-if="!aiStatus.vision" type="info" :closable="false" show-icon
            title="Chưa có vision model. Kiểm tra GEMINI_API_KEY trong .env" />
        </el-card>

      </el-col>

      <!-- ── RIGHT: Result panel ── -->
      <el-col :xs="24" :lg="11">
        <el-card class="result-card" v-loading="scanning">
          <template #header>
            <div class="card-hd">
              <span>📊 Kết quả trích xuất</span>
              <el-button v-if="result" type="success" :loading="confirming" @click="showConfirm = true">
                ✅ Xác nhận nhập kho
              </el-button>
            </div>
          </template>

          <!-- Empty -->
          <el-empty v-if="!result && !scanning" :image-size="70"
            description="Upload ảnh hoặc dán văn bản để bắt đầu" />

          <!-- Extracted data form -->
          <div v-if="result" class="result-form">

            <!-- Invoice meta -->
            <div class="meta-grid">
              <el-form-item label="Nhà cung cấp">
                <el-input v-model="result.vendor_name" placeholder="—" size="small" />
              </el-form-item>
              <el-form-item label="Số hóa đơn">
                <el-input v-model="result.invoice_number" placeholder="—" size="small" />
              </el-form-item>
              <el-form-item label="Ngày hóa đơn">
                <el-date-picker v-model="result.invoice_date" type="date" value-format="YYYY-MM-DD"
                  size="small" style="width:100%" placeholder="Chọn ngày" />
              </el-form-item>
              <el-form-item label="Ghi chú">
                <el-input v-model="result.notes" placeholder="—" size="small" />
              </el-form-item>
            </div>

            <el-divider>📦 Danh sách sản phẩm ({{ result.items.length }} mặt hàng)</el-divider>

            <!-- Items table -->
            <div v-for="(item, idx) in result.items" :key="idx" class="item-row" :class="{ unmatched: !item.matched }">
              <div class="item-head">
                <el-tag size="small" :type="item.matched ? 'success' : 'warning'">
                  {{ item.matched ? '✓ Đã ghép' : '⚠ Chưa ghép' }}
                </el-tag>
                <span class="item-name">{{ item.product_name || item.name }}</span>
                <el-button link type="danger" size="small" @click="result.items.splice(idx,1)">✕</el-button>
              </div>

              <el-row :gutter="8" class="item-fields">
                <el-col :span="8">
                  <div class="field-lbl">Sản phẩm trong kho</div>
                  <el-select
                    v-model="item.product_id"
                    filterable remote :remote-method="q => searchProducts(q, idx)"
                    size="small" style="width:100%"
                    :placeholder="item.matched ? item.product_name : 'Chọn sản phẩm...'"
                    @change="id => onProductSelect(id, idx)"
                  >
                    <el-option v-for="p in (searchResults[idx] || [])" :key="p.id"
                      :label="`${p.sku} – ${p.name}`" :value="p.id" />
                  </el-select>
                </el-col>
                <el-col :span="4">
                  <div class="field-lbl">Số lượng</div>
                  <el-input-number v-model="item.quantity" :min="0.01" size="small" style="width:100%" />
                </el-col>
                <el-col :span="4">
                  <div class="field-lbl">ĐVT</div>
                  <el-input v-model="item.unit" size="small" />
                </el-col>
                <el-col :span="8">
                  <div class="field-lbl">Đơn giá</div>
                  <el-input-number v-model="item.unit_price" :min="0" size="small" style="width:100%"
                    :formatter="v => v.toLocaleString('vi-VN')" />
                </el-col>
              </el-row>
            </div>

            <!-- Add line -->
            <el-button link type="primary" @click="addItem">+ Thêm dòng</el-button>

            <el-divider />

            <!-- Totals -->
            <div class="totals">
              <div class="total-row">
                <span>Thuế:</span>
                <span>{{ fmtVND(result.tax_amount) }}</span>
              </div>
              <div class="total-row grand">
                <span>Tổng cộng:</span>
                <span class="grand-value">{{ fmtVND(result.total_amount) }}</span>
              </div>
            </div>

          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Confirm dialog -->
    <el-dialog v-model="showConfirm" title="Xác nhận nhập kho từ hóa đơn OCR" width="460px" :close-on-click-modal="false">
      <div class="confirm-body">
        <el-form label-position="top">
          <el-form-item label="Kho nhập hàng *">
            <el-select v-model="warehouseId" style="width:100%" placeholder="Chọn kho...">
              <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
            </el-select>
          </el-form-item>
        </el-form>
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            Sẽ tạo <strong>{{ validItems.length }}</strong> phiếu nhập kho cho
            <strong>{{ validItems.length }}</strong> sản phẩm đã ghép.
            <span v-if="unmatchedCount > 0" class="warn-text">
              {{ unmatchedCount }} sản phẩm chưa chọn sẽ bị bỏ qua.
            </span>
          </template>
        </el-alert>
      </div>
      <template #footer>
        <el-button @click="showConfirm = false">Hủy</el-button>
        <el-button type="success" :loading="confirming" :disabled="!warehouseId || validItems.length === 0" @click="doCreateStockIn">
          Nhập kho
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOcrStatus, scanInvoiceImage, scanInvoiceText, createStockInFromOcr } from '@/api/ocr'
import { getProducts } from '@/api/product'
import { getWarehouses } from '@/api/warehouse'

// ── State ─────────────────────────────────────────────────────
const inputMode   = ref('image')
const selectedFile = ref(null)
const previewUrl   = ref('')
const pastedText   = ref('')
const isDragging   = ref(false)
const scanning     = ref(false)
const progressPct  = ref(0)
const result       = ref(null)
const showConfirm  = ref(false)
const confirming   = ref(false)
const warehouseId  = ref(null)
const warehouses   = ref([])
const searchResults = reactive({})
const aiStatus     = ref({ vision: false, text: false, models: [] })

const SCAN_TIPS = [
  'AI đang phân tích ảnh hóa đơn...',
  'Đang nhận diện ký tự và số liệu...',
  'Đang trích xuất danh mục sản phẩm...',
  'Đang ghép mặt hàng với kho...',
  'Gần xong, vui lòng chờ...',
]
const scanTip = ref(SCAN_TIPS[0])
let tipInterval = null

// ── Computed ──────────────────────────────────────────────────
const validItems = computed(() =>
  (result.value?.items ?? []).filter(i => i.product_id && i.quantity > 0)
)
const unmatchedCount = computed(() =>
  (result.value?.items ?? []).filter(i => !i.product_id).length
)

// ── Init ──────────────────────────────────────────────────────
onMounted(async () => {
  const [statusRes, whRes] = await Promise.allSettled([getOcrStatus(), getWarehouses()])
  if (statusRes.status === 'fulfilled') aiStatus.value = statusRes.value.data ?? {}
  if (whRes.status === 'fulfilled') warehouses.value = whRes.value.data ?? []
})

// ── File handling ─────────────────────────────────────────────
function onFile(e) {
  const file = e.target.files[0]
  if (file) setFile(file)
}
function onDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) setFile(file)
  else ElMessage.warning('Chỉ hỗ trợ file ảnh (JPG, PNG, WEBP)')
}
function setFile(file) {
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  result.value = null
}
function clearFile() {
  selectedFile.value = null
  previewUrl.value = ''
  result.value = null
}

// ── Scan ──────────────────────────────────────────────────────
function startProgress() {
  progressPct.value = 0
  let tip = 0
  scanTip.value = SCAN_TIPS[0]
  tipInterval = setInterval(() => {
    progressPct.value = Math.min(progressPct.value + 4, 92)
    if (progressPct.value % 20 === 0) {
      tip = Math.min(tip + 1, SCAN_TIPS.length - 1)
      scanTip.value = SCAN_TIPS[tip]
    }
  }, 800)
}
function stopProgress() {
  clearInterval(tipInterval)
  progressPct.value = 100
}

async function doScanImage() {
  if (!selectedFile.value) return
  scanning.value = true
  startProgress()
  try {
    const fd = new FormData()
    fd.append('file', selectedFile.value)
    const res = await scanInvoiceImage(fd)
    result.value = res.data
    preloadSearchResults()
    ElMessage.success('Phân tích hóa đơn thành công!')
  } catch (e) {
    ElMessage.error(e?.response?.data?.message ?? 'Lỗi phân tích ảnh')
  } finally {
    scanning.value = false
    stopProgress()
  }
}

async function doScanText() {
  scanning.value = true
  startProgress()
  try {
    const res = await scanInvoiceText(pastedText.value)
    result.value = res.data
    preloadSearchResults()
    ElMessage.success('Trích xuất dữ liệu thành công!')
  } catch (e) {
    ElMessage.error(e?.response?.data?.message ?? 'Lỗi phân tích văn bản')
  } finally {
    scanning.value = false
    stopProgress()
  }
}

// ── Product matching ──────────────────────────────────────────
async function preloadSearchResults() {
  if (!result.value?.items) return
  for (let i = 0; i < result.value.items.length; i++) {
    const item = result.value.items[i]
    if (item.product_name || item.name) {
      try {
        const res = await getProducts({ search: item.product_name ?? item.name, per_page: 10 })
        searchResults[i] = res.data ?? []
        // If a product_id was matched, pre-set search options to include it
        if (item.product_id && !searchResults[i].find(p => p.id === item.product_id)) {
          searchResults[i].unshift({ id: item.product_id, sku: item.product_sku, name: item.product_name })
        }
      } catch {}
    }
  }
}

async function searchProducts(query, idx) {
  if (!query) return
  try {
    const res = await getProducts({ search: query, per_page: 15 })
    searchResults[idx] = res.data ?? []
  } catch {}
}

function onProductSelect(id, idx) {
  const product = (searchResults[idx] ?? []).find(p => p.id === id)
  if (product && result.value?.items[idx]) {
    result.value.items[idx].matched = true
    result.value.items[idx].product_name = product.name
    result.value.items[idx].product_sku  = product.sku
  }
}

function addItem() {
  result.value?.items?.push({
    name: '', sku: null, quantity: 1, unit: 'cái',
    unit_price: 0, total_price: 0,
    product_id: null, matched: false, product_name: '',
  })
}

// ── Create StockIn ────────────────────────────────────────────
async function doCreateStockIn() {
  if (!warehouseId.value) { ElMessage.warning('Vui lòng chọn kho'); return }
  if (validItems.value.length === 0) { ElMessage.warning('Không có sản phẩm hợp lệ'); return }

  confirming.value = true
  try {
    const res = await createStockInFromOcr({
      warehouse_id:   warehouseId.value,
      vendor_name:    result.value.vendor_name,
      invoice_number: result.value.invoice_number,
      invoice_date:   result.value.invoice_date,
      notes:          result.value.notes,
      items: validItems.value.map(i => ({
        product_id: i.product_id,
        quantity:   i.quantity,
        unit_price: i.unit_price,
      })),
    })
    ElMessage.success(res.message ?? 'Nhập kho thành công!')
    showConfirm.value = false
    result.value = null
    pastedText.value = ''
    clearFile()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message ?? 'Lỗi tạo phiếu nhập kho')
  } finally {
    confirming.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────
const fmtVND = v => Number(v || 0).toLocaleString('vi-VN') + ' đ'
</script>

<style scoped lang="scss">
.ocr-page { max-width: 1200px; }

.ocr-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 18px; flex-wrap: wrap; gap: 12px;
  .header-left { display: flex; align-items: center; gap: 14px; }
  .ocr-icon {
    width: 50px; height: 50px; border-radius: 14px; font-size: 26px;
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .page-title { font-size: 22px; font-weight: 700; margin: 0; }
  .page-sub   { font-size: 13px; color: var(--text-secondary); margin: 0; }
  .ai-status {
    display: flex; align-items: center; gap: 8px; padding: 6px 14px;
    border-radius: 20px; font-size: 13px; font-weight: 600;
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    &.online  { background: #f0fdf4; color: #16a34a; .dot { background: #22c55e; box-shadow: 0 0 6px #22c55e; animation: pulse 1.5s infinite; } }
    &.partial { background: #fffbeb; color: #d97706; .dot { background: #f59e0b; } }
    &.offline { background: #fef2f2; color: #dc2626; .dot { background: #ef4444; } }
  }
}
@keyframes pulse { 0%,100%{ opacity:1; } 50%{ opacity:.4; } }

// ── Drop Zone ─────────────────────────────────────────────────
.drop-zone {
  border: 2px dashed var(--el-border-color); border-radius: 12px;
  cursor: pointer; transition: all .2s; min-height: 240px;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden; background: var(--el-fill-color-lighter);
  &:hover, &.drop-active { border-color: var(--el-color-primary); background: #409eff08; }
  &.has-file { border-style: solid; border-color: var(--el-color-success); padding: 0; }
  .drop-hint { text-align: center; color: var(--text-secondary); padding: 32px;
    .drop-icon { font-size: 48px; margin-bottom: 12px; }
    p { margin: 4px 0; font-size: 14px; }
    .drop-sub { font-size: 12px; opacity: .7; }
  }
  .preview-wrap { width: 100%; position: relative;
    .preview-img { width: 100%; max-height: 320px; object-fit: contain; display: block; }
    .preview-overlay {
      position: absolute; top: 8px; right: 8px;
      background: rgba(0,0,0,.5); border-radius: 6px; padding: 2px;
    }
  }
}

.scan-btn { width: 100%; margin-top: 12px; }
.progress-wrap { margin-top: 8px;
  .progress-tip { font-size: 12px; color: var(--text-secondary); margin-top: 4px; display: block; }
}

// ── Tips ──────────────────────────────────────────────────────
.tips-card { margin-top: 12px;
  .tips-title { font-weight: 700; margin-bottom: 10px; font-size: 14px; }
  .tips-list { margin: 0; padding-left: 18px; color: var(--text-secondary);
    li { font-size: 13px; margin-bottom: 6px; }
  }
}

// ── Result ────────────────────────────────────────────────────
.card-hd { display: flex; justify-content: space-between; align-items: center; font-weight: 600; }

.result-form {
  .meta-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px;
    :deep(.el-form-item) { margin-bottom: 10px; }
    :deep(.el-form-item__label) { font-size: 12px; color: var(--text-secondary); padding-bottom: 2px; }
  }

  .item-row {
    border: 1px solid var(--el-border-color); border-radius: 8px;
    padding: 10px 12px; margin-bottom: 8px; transition: border-color .2s;
    &.unmatched { border-color: #f59e0b; background: #fffbeb08; }
    .item-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
      .item-name { flex: 1; font-weight: 600; font-size: 13px; truncate: clip; }
    }
    .item-fields { }
    .field-lbl { font-size: 11px; color: var(--text-secondary); margin-bottom: 3px; }
  }

  .totals { text-align: right;
    .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: var(--text-secondary); }
    .grand { font-size: 16px; font-weight: 800; color: var(--text-primary);
      .grand-value { color: #059669; }
    }
  }
}

// ── Confirm ───────────────────────────────────────────────────
.confirm-body { .warn-text { color: #d97706; } }

// ── Mobile ────────────────────────────────────────────────────
@media (max-width: 768px) {
  .ocr-header { flex-direction: column; align-items: flex-start;
    .page-title { font-size: 18px; }
  }
  .result-form .meta-grid { grid-template-columns: 1fr; }
  .item-fields :deep(.el-col) { margin-bottom: 8px; }
}
</style>
