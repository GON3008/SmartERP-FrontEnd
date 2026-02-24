<template>
  <div class="scanner-page">

    <!-- Header -->
    <div class="scanner-header">
      <div class="header-left">
        <div class="scan-icon-wrap">
          <span class="scan-icon">⬛</span>
        </div>
        <div>
          <h1 class="page-title">Barcode / QR Scanner</h1>
          <p class="page-sub">Quét mã vạch hoặc QR để tra cứu sản phẩm</p>
        </div>
      </div>
      <el-radio-group v-model="mode" size="small">
        <el-radio-button value="scan">📷 Camera</el-radio-button>
        <el-radio-button value="manual">⌨️ Nhập tay</el-radio-button>
        <el-radio-button value="generate">🖨 In mã</el-radio-button>
      </el-radio-group>
    </div>

    <el-row :gutter="16">
      <!-- Left: Scanner / Input panel -->
      <el-col :xs="24" :lg="12">

        <!-- ── CAMERA SCAN mode ── -->
        <el-card v-if="mode === 'scan'" class="scanner-card">
          <template #header>
            <div class="card-hd">
              <span>📷 Quét bằng camera</span>
              <el-tag :type="cameraActive ? 'success' : 'info'" size="small" round>
                {{ cameraActive ? 'Đang quét' : 'Chờ khởi động' }}
              </el-tag>
            </div>
          </template>

          <!-- Camera viewport -->
          <div class="camera-wrap">
            <div id="qr-reader" class="qr-reader"></div>
            <div v-if="!cameraActive" class="camera-placeholder">
              <div class="placeholder-icon">📷</div>
              <p>Nhấn "Bắt đầu quét" để mở camera</p>
            </div>
            <!-- Scan laser animation -->
            <div v-if="cameraActive" class="scan-laser"></div>
          </div>

          <div class="camera-controls">
            <el-button v-if="!cameraActive" type="primary" @click="startCamera" :loading="cameraLoading">
              Bắt đầu quét
            </el-button>
            <el-button v-else type="danger" @click="stopCamera">Dừng camera</el-button>
            <el-select v-if="cameras.length > 1" v-model="selectedCamera" size="small" style="width:160px"
              @change="switchCamera" placeholder="Chọn camera">
              <el-option v-for="c in cameras" :key="c.id" :label="c.label" :value="c.id" />
            </el-select>
          </div>

          <el-alert v-if="cameraError" type="error" :title="cameraError" :closable="false" show-icon style="margin-top:10px" />
        </el-card>

        <!-- ── MANUAL mode ── -->
        <el-card v-else-if="mode === 'manual'" class="scanner-card">
          <template #header><span>⌨️ Nhập mã thủ công / USB Scanner</span></template>
          <div class="manual-input">
            <el-input
              ref="manualInputRef"
              v-model="manualCode"
              placeholder="Nhập SKU hoặc mã sản phẩm..."
              size="large"
              clearable
              @keyup.enter="lookupCode(manualCode)"
            >
              <template #prefix><span>🔍</span></template>
            </el-input>
            <el-button type="primary" size="large" :loading="searching" @click="lookupCode(manualCode)">
              Tra cứu
            </el-button>
          </div>
          <p class="manual-hint">💡 Nếu dùng USB barcode scanner, chỉ cần đặt con trỏ vào ô trên và quét — nó sẽ tự điền và tìm kiếm.</p>

          <!-- History -->
          <div v-if="history.length" class="scan-history">
            <div class="history-title">Lịch sử tra cứu gần đây</div>
            <div v-for="h in history.slice(0,5)" :key="h.code" class="history-item" @click="lookupCode(h.code)">
              <span class="history-code">{{ h.code }}</span>
              <span class="history-name">{{ h.name }}</span>
              <el-tag size="small" :type="stockTag(h.status)">{{ stockLabel(h.status) }}</el-tag>
            </div>
          </div>
        </el-card>

        <!-- ── GENERATE mode ── -->
        <el-card v-else class="scanner-card">
          <template #header><span>🖨 Tạo và in mã vạch / QR</span></template>
          <el-form inline>
            <el-form-item label="Tìm sản phẩm">
              <el-select
                v-model="selectedProductId"
                filterable remote
                :remote-method="searchProducts"
                placeholder="Gõ tên hoặc SKU..."
                style="width:260px"
                @change="loadProductBarcode"
              >
                <el-option v-for="p in productOptions" :key="p.id" :label="`${p.sku} - ${p.name}`" :value="p.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="Loại mã">
              <el-radio-group v-model="codeType" size="small">
                <el-radio-button value="barcode">Barcode</el-radio-button>
                <el-radio-button value="qr">QR Code</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="Số lượng">
              <el-input-number v-model="printQty" :min="1" :max="100" size="small" style="width:90px" />
            </el-form-item>
          </el-form>

          <div v-if="barcodeData" class="barcode-preview">
            <div class="barcode-box" ref="barcodeBox">
              <!-- Barcode (SVG via JsBarcode) or QR (canvas) -->
              <svg v-if="codeType === 'barcode'" id="barcode-svg"></svg>
              <canvas v-else id="qr-canvas" width="200" height="200"></canvas>
              <div class="barcode-label">{{ barcodeData.name }}</div>
              <div class="barcode-sku">{{ barcodeData.sku }}</div>
            </div>
            <div class="barcode-actions">
              <el-button type="primary" :icon="Printer" @click="printBarcode">In {{ printQty }} nhãn</el-button>
              <el-button :icon="Download" @click="downloadBarcode">Tải PNG</el-button>
            </div>
          </div>
          <el-empty v-else :image-size="60" description="Chọn sản phẩm để xem và in mã" />
        </el-card>

      </el-col>

      <!-- Right: Result panel -->
      <el-col :xs="24" :lg="12">
        <el-card class="result-card" v-loading="searching">
          <template #header>
            <div class="card-hd">
              <span>📦 Kết quả tra cứu</span>
              <el-button v-if="result" link @click="result = null">Xóa</el-button>
            </div>
          </template>

          <!-- Result -->
          <div v-if="result" class="result-body">
            <!-- Status badge -->
            <div class="result-status" :class="`status-${result.stock_status}`">
              <span class="status-dot"></span>
              {{ stockLabel(result.stock_status) }}
            </div>

            <!-- Product info -->
            <div class="result-name">{{ result.name }}</div>
            <div class="result-sku">SKU: {{ result.sku }}</div>

            <el-divider />

            <div class="result-grid">
              <div class="rg-item">
                <span class="rg-label">Danh mục</span>
                <span class="rg-value">{{ result.category || '—' }}</span>
              </div>
              <div class="rg-item">
                <span class="rg-label">Đơn vị</span>
                <span class="rg-value">{{ result.unit || '—' }}</span>
              </div>
              <div class="rg-item">
                <span class="rg-label">Giá bán</span>
                <span class="rg-value price">{{ fmtPrice(result.price) }} đ</span>
              </div>
              <div class="rg-item">
                <span class="rg-label">Tồn kho tối thiểu</span>
                <span class="rg-value">{{ result.min_stock }}</span>
              </div>
              <div class="rg-item full">
                <span class="rg-label">Tổng tồn kho</span>
                <span class="rg-value stock" :class="`stock-${result.stock_status}`">
                  {{ result.total_stock }} {{ result.unit }}
                </span>
              </div>
            </div>

            <!-- Per-warehouse breakdown -->
            <div v-if="result.inventories?.length" class="warehouse-list">
              <div class="wh-title">Tồn kho theo kho</div>
              <div v-for="inv in result.inventories" :key="inv.warehouse_id" class="wh-item">
                <el-icon><OfficeBuilding /></el-icon>
                <span class="wh-name">{{ inv.warehouse_name }}</span>
                <el-tag size="small" :type="inv.quantity > 0 ? 'success' : 'danger'">
                  {{ inv.quantity }} {{ result.unit }}
                </el-tag>
              </div>
            </div>

            <!-- Actions -->
            <div class="result-actions">
              <el-button size="small" type="primary" @click="$router.push(`/products/${result.id}`)">Xem chi tiết</el-button>
              <el-button size="small" @click="switchToGenerate(result)">In mã</el-button>
            </div>
          </div>

          <!-- Not found -->
          <div v-else-if="notFound" class="not-found">
            <div class="nf-icon">🔎</div>
            <p>Không tìm thấy sản phẩm với mã:</p>
            <el-tag type="danger" size="large">{{ lastCode }}</el-tag>
          </div>

          <!-- Empty state -->
          <el-empty v-else :image-size="70" description="Quét hoặc nhập mã để tra cứu sản phẩm" />

          <!-- Scan counter -->
          <div v-if="scanCount > 0" class="scan-counter">
            <el-icon><CircleCheck /></el-icon> {{ scanCount }} lần quét thành công trong phiên này
          </div>
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Printer, Download, OfficeBuilding, CircleCheck } from '@element-plus/icons-vue'
import { scanBarcode, getBarcodeForProduct } from '@/api/barcode'
import { getProducts } from '@/api/product'

// ── State ─────────────────────────────────────────────────────
const mode              = ref('scan')
const manualCode        = ref('')
const manualInputRef    = ref(null)
const searching         = ref(false)
const result            = ref(null)
const notFound          = ref(false)
const lastCode          = ref('')
const scanCount         = ref(0)
const history           = ref([])

// Camera
const cameraActive      = ref(false)
const cameraLoading     = ref(false)
const cameraError       = ref('')
const cameras           = ref([])
const selectedCamera    = ref('')
let   html5QrCode       = null

// Generate
const selectedProductId = ref(null)
const productOptions    = ref([])
const barcodeData       = ref(null)
const codeType          = ref('barcode')
const printQty          = ref(1)
const barcodeBox        = ref(null)

// ── Helpers ───────────────────────────────────────────────────
const fmtPrice = v => Number(v || 0).toLocaleString('vi-VN')
const stockLabel = s => ({ ok: 'Còn hàng', low: 'Sắp hết', out: 'Hết hàng' }[s] ?? s)
const stockTag   = s => ({ ok: 'success', low: 'warning', out: 'danger' }[s] ?? 'info')

// ── Lookup ────────────────────────────────────────────────────
async function lookupCode(code) {
  code = (code || '').trim()
  if (!code) return
  lastCode.value = code
  searching.value = true
  notFound.value  = false
  result.value    = null
  try {
    const res = await scanBarcode(code)
    if (res.success) {
      result.value = res.data
      scanCount.value++
      addHistory(res.data)
      ElMessage.success(`Tìm thấy: ${res.data.name}`)
    } else {
      notFound.value = true
    }
  } catch (e) {
    if (e?.response?.status === 404) {
      notFound.value = true
      ElMessage.warning(`Không tìm thấy mã: ${code}`)
    } else {
      ElMessage.error('Lỗi kết nối API')
    }
  } finally {
    searching.value = false
    if (mode.value === 'manual') manualCode.value = ''
  }
}

function addHistory(data) {
  const existing = history.value.findIndex(h => h.code === data.sku)
  if (existing > -1) history.value.splice(existing, 1)
  history.value.unshift({ code: data.sku, name: data.name, status: data.stock_status })
  if (history.value.length > 10) history.value.pop()
}

// ── Camera ────────────────────────────────────────────────────
async function startCamera() {
  cameraError.value   = ''
  cameraLoading.value = true
  try {
    const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')

    // List cameras
    const devices = await Html5Qrcode.getCameras()
    cameras.value = devices.map(d => ({ id: d.id, label: d.label || d.id }))
    selectedCamera.value = devices.find(d => d.label.toLowerCase().includes('back'))?.id
      || devices[devices.length - 1]?.id
      || devices[0]?.id

    html5QrCode = new Html5Qrcode('qr-reader', {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.CODE_39,
      ],
    })

    await html5QrCode.start(
      { deviceId: { exact: selectedCamera.value } },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      onScanSuccess,
      () => {} // silent error
    )
    cameraActive.value = true
  } catch (err) {
    cameraError.value = `Không thể mở camera: ${err?.message ?? err}`
  } finally {
    cameraLoading.value = false
  }
}

function onScanSuccess(decodedText) {
  if (searching.value) return
  lookupCode(decodedText)
}

async function stopCamera() {
  if (html5QrCode) {
    try { await html5QrCode.stop() } catch {}
    html5QrCode = null
  }
  cameraActive.value = false
}

async function switchCamera() {
  await stopCamera()
  await startCamera()
}

// ── Generate ──────────────────────────────────────────────────
async function searchProducts(query) {
  if (!query) return
  try {
    const res = await getProducts({ search: query, per_page: 20 })
    productOptions.value = res.data ?? []
  } catch {}
}

async function loadProductBarcode(id) {
  if (!id) return
  try {
    const res = await getBarcodeForProduct(id)
    barcodeData.value = res.data
    await nextTick()
    renderCode()
  } catch {}
}

async function renderCode() {
  if (!barcodeData.value) return
  if (codeType.value === 'barcode') {
    const JsBarcode = (await import('jsbarcode')).default
    JsBarcode('#barcode-svg', barcodeData.value.sku, {
      format: 'CODE128',
      width: 2, height: 80,
      displayValue: true,
      fontSize: 14,
      margin: 10,
    })
  } else {
    const QRCode = (await import('qrcode')).default
    await QRCode.toCanvas(
      document.getElementById('qr-canvas'),
      barcodeData.value.qr_content ?? barcodeData.value.sku,
      { width: 200, margin: 2 }
    )
  }
}

watch(codeType, () => { if (barcodeData.value) nextTick(renderCode) })

function printBarcode() {
  const win = window.open('', '_blank')
  const box = barcodeBox.value
  if (!win || !box) return
  win.document.write(`
    <html><head><title>In mã vạch - ${barcodeData.value?.name}</title>
    <style>
      body { margin: 0; display: flex; flex-wrap: wrap; gap: 8px; padding: 10px; }
      .label { display: flex; flex-direction: column; align-items: center; border: 1px solid #ddd;
        padding: 6px 10px; border-radius: 4px; page-break-inside: avoid; }
      .lbl-name { font-size: 11px; font-weight: 600; margin-top: 4px; }
      .lbl-sku  { font-size: 10px; color: #666; }
    </style></head><body>
    ${'<div class="label">' + box.innerHTML + '</div>'.repeat(printQty.value)}
    <script>window.onload = () => { window.print(); window.close(); }<\/script>
    </body></html>
  `)
  win.document.close()
}

async function downloadBarcode() {
  const canvas = document.createElement('canvas')
  canvas.width = 240; canvas.height = 120
  const ctx = canvas.getContext('2d')
  const img = new Image()
  const svgEl = document.getElementById('barcode-svg')
  const qrEl  = document.getElementById('qr-canvas')
  const src = codeType.value === 'barcode'
    ? 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(svgEl))
    : qrEl.toDataURL()
  img.onload = () => {
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,240,120)
    ctx.drawImage(img, 0, 0, 240, 100)
    const a = document.createElement('a')
    a.download = `${barcodeData.value?.sku ?? 'barcode'}.png`
    a.href = canvas.toDataURL(); a.click()
  }
  img.src = src
}

function switchToGenerate(product) {
  mode.value = 'generate'
  selectedProductId.value = product.id
  barcodeData.value = { id: product.id, sku: product.sku, name: product.name, qr_content: JSON.stringify({ id: product.id, sku: product.sku }) }
  productOptions.value = [{ id: product.id, name: product.name, sku: product.sku }]
  nextTick(renderCode)
}

// Switch to manual: focus input
watch(mode, async (val) => {
  if (val !== 'scan') await stopCamera()
  if (val === 'manual') nextTick(() => manualInputRef.value?.focus())
})

onUnmounted(() => stopCamera())
</script>

<style scoped lang="scss">
.scanner-page { max-width: 1200px; }

.scanner-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 18px; flex-wrap: wrap; gap: 12px;
  .header-left { display: flex; align-items: center; gap: 14px; }
  .scan-icon-wrap {
    width: 48px; height: 48px; border-radius: 14px;
    background: linear-gradient(135deg, #0ea5e9, #6366f1);
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; flex-shrink: 0;
  }
  .page-title { font-size: 22px; font-weight: 700; margin: 0; }
  .page-sub   { font-size: 13px; color: var(--text-secondary); margin: 0; }
}

.scanner-card, .result-card { height: 100%; }
.card-hd { display: flex; align-items: center; justify-content: space-between; font-weight: 600; }

// ── Camera ────────────────────────────────────────────────────
.camera-wrap {
  position: relative; width: 100%; border-radius: 12px; overflow: hidden;
  background: #0a0a0a; min-height: 260px;
  .camera-placeholder {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 260px; color: #666;
    .placeholder-icon { font-size: 48px; margin-bottom: 12px; }
    p { font-size: 14px; }
  }
  .qr-reader { width: 100%; }
  .scan-laser {
    position: absolute; left: 10%; right: 10%; height: 2px;
    background: linear-gradient(90deg, transparent, #0ea5e9, transparent);
    box-shadow: 0 0 8px #0ea5e9;
    animation: laserScan 2s ease-in-out infinite;
    pointer-events: none;
  }
}
@keyframes laserScan {
  0%   { top: 20%; }
  50%  { top: 78%; }
  100% { top: 20%; }
}
:deep(#qr-reader video) { border-radius: 8px; }
:deep(#qr-reader__dashboard) { display: none; }

.camera-controls { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }

// ── Manual ────────────────────────────────────────────────────
.manual-input {
  display: flex; gap: 10px; align-items: flex-start;
  .el-input { flex: 1; }
}
.manual-hint { font-size: 12px; color: var(--text-secondary); margin: 10px 0 0; }

.scan-history { margin-top: 16px;
  .history-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; color: var(--text-secondary); }
  .history-item {
    display: flex; align-items: center; gap: 10px; padding: 8px 10px;
    border-radius: 8px; cursor: pointer; transition: background .15s;
    &:hover { background: var(--el-fill-color-light); }
    .history-code { font-family: monospace; font-weight: 700; font-size: 13px; flex-shrink: 0; }
    .history-name { flex: 1; font-size: 13px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  }
}

// ── Generate  ─────────────────────────────────────────────────
.barcode-preview {
  display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 16px 0;
  .barcode-box {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    padding: 14px 20px; border: 1px solid var(--el-border-color); border-radius: 10px; background: #fff;
    .barcode-label { font-size: 13px; font-weight: 600; color: #222; }
    .barcode-sku   { font-size: 11px; color: #666; font-family: monospace; }
  }
  .barcode-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
}

// ── Result ─────────────────────────────────────────────────────
.result-body {
  .result-status {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 12px;
    .status-dot { width: 8px; height: 8px; border-radius: 50%; }
    &.status-ok  { background: #f0fdf4; color: #16a34a; .status-dot { background: #22c55e; } }
    &.status-low { background: #fffbeb; color: #d97706; .status-dot { background: #f59e0b; } }
    &.status-out { background: #fef2f2; color: #dc2626; .status-dot { background: #ef4444; } }
  }
  .result-name { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
  .result-sku  { font-size: 13px; color: var(--text-secondary); font-family: monospace; }

  .result-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 8px 0;
    .rg-item { display: flex; flex-direction: column; gap: 2px;
      &.full { grid-column: 1/-1; }
      .rg-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .5px; }
      .rg-value { font-size: 15px; font-weight: 600;
        &.price { color: #059669; }
        &.stock-ok  { color: #16a34a; }
        &.stock-low { color: #d97706; }
        &.stock-out { color: #dc2626; }
      }
    }
  }

  .warehouse-list { margin: 8px 0;
    .wh-title { font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: .5px; }
    .wh-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--el-border-color-extra-light);
      &:last-child { border-bottom: none; }
      .wh-name { flex: 1; font-size: 13px; }
      .el-icon { color: var(--text-secondary); }
    }
  }

  .result-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
}

.not-found { text-align: center; padding: 32px 0;
  .nf-icon { font-size: 48px; margin-bottom: 12px; }
  p { color: var(--text-secondary); margin-bottom: 10px; }
}

.scan-counter {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #16a34a; margin-top: 14px;
  padding-top: 10px; border-top: 1px solid var(--el-border-color-extra-light);
}

// ── Mobile ────────────────────────────────────────────────────
@media (max-width: 768px) {
  .scanner-header {
    flex-direction: column; align-items: flex-start;
    .page-title { font-size: 18px; }
  }
  .manual-input { flex-direction: column;
    .el-button { width: 100%; }
  }
  .result-grid { grid-template-columns: 1fr; }
  .barcode-preview .barcode-actions { flex-direction: column; width: 100%; }
}
</style>
