<template>
  <el-dialog
    v-model="dialogVisible"
    title="📄 Tạo hóa đơn từ đơn hàng"
    :width="isMobile ? '100%' : '560px'"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
    @open="onOpen"
    @close="handleClose"
    class="invoice-modal"
  >
    <!-- Order / customer summary card -->
    <el-card v-if="orderInfo" class="order-summary" shadow="never">
      <div class="summary-grid">
        <div class="summary-item">
          <span class="si-label">Đơn hàng</span>
          <span class="si-value code">{{ orderInfo.order_code ?? `#${orderInfo.id}` }}</span>
        </div>
        <div class="summary-item">
          <span class="si-label">Khách hàng</span>
          <span class="si-value">{{ orderInfo.customer?.name ?? customerName ?? '—' }}</span>
        </div>
        <div class="summary-item">
          <span class="si-label">Ngày đặt</span>
          <span class="si-value">{{ formatDate(orderInfo.order_date) }}</span>
        </div>
        <div class="summary-item">
          <span class="si-label">Tổng tiền đơn</span>
          <span class="si-value total">{{ formatPrice(orderInfo.total_amount) }} đ</span>
        </div>
      </div>
    </el-card>

    <el-skeleton v-if="loadingOrder" :rows="3" animated style="margin-bottom:16px" />

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-width="isMobile ? '100%' : '130px'"
      :label-position="isMobile ? 'top' : 'left'"
      class="invoice-form"
    >
      <!-- Order ID (editable only when no prop passed) -->
      <el-form-item label="Đơn hàng" prop="order_id">
        <!-- Filterable select when no prop passed -->
        <el-select
          v-if="!hasOrderProp"
          v-model="formData.order_id"
          placeholder="Tìm kiếm mã đơn, khách hàng..."
          filterable
          remote
          :remote-method="searchOrders"
          :loading="loadingOrders"
          clearable
          style="width:100%"
          size="large"
          @change="onOrderSelect"
        >
          <template #prefix><el-icon><Ticket /></el-icon></template>
          <el-option
            v-for="o in orderOptions"
            :key="o.id"
            :value="o.id"
            :label="`#${o.order_code ?? o.id} — ${o.customer?.name ?? ''}`"
          >
            <div class="order-option">
              <span class="order-code">#{{ o.order_code ?? o.id }}</span>
              <span class="order-customer">{{ o.customer?.name ?? '—' }}</span>
              <span class="order-amount">{{ formatPrice(o.total_amount) }} đ</span>
            </div>
          </el-option>
        </el-select>

        <!-- Locked badge when orderId prop is passed -->
        <div v-else class="locked-value">
          <el-icon><Ticket /></el-icon>
          {{ orderInfo?.order_code ?? `Đơn #${formData.order_id}` }}
          <el-tag size="small" type="success" style="margin-left:8px">Đã chọn</el-tag>
        </div>
      </el-form-item>

      <!-- Customer (readonly display) -->
      <el-form-item label="Khách hàng" v-if="customerName || orderInfo?.customer">
        <div class="locked-value">
          <el-icon><User /></el-icon>
          {{ orderInfo?.customer?.name ?? customerName }}
        </div>
      </el-form-item>

      <!-- Tax rate -->
      <el-form-item label="Thuế (%)" prop="tax_rate">
        <el-input-number
          v-model="formData.tax_rate"
          :min="0"
          :max="100"
          :precision="1"
          :step="5"
          style="width:100%"
          size="large"
        />
      </el-form-item>

      <!-- Due date -->
      <el-form-item label="Hạn thanh toán">
        <el-date-picker
          v-model="formData.due_date"
          type="date"
          placeholder="Chọn hạn thanh toán"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          style="width:100%"
          size="large"
          :prefix-icon="Calendar"
          :disabled-date="(d) => d < new Date()"
        />
      </el-form-item>

      <!-- Notes -->
      <el-form-item label="Ghi chú">
        <el-input
          v-model="formData.notes"
          type="textarea"
          :rows="3"
          placeholder="Ghi chú thêm cho hóa đơn..."
        />
      </el-form-item>

      <!-- Estimated total (with tax) -->
      <div v-if="orderInfo" class="estimated-total">
        <div class="et-row">
          <span>Tiền hàng</span>
          <span>{{ formatPrice(orderInfo.total_amount) }} đ</span>
        </div>
        <div class="et-row">
          <span>Thuế ({{ formData.tax_rate }}%)</span>
          <span>{{ formatPrice(taxAmount) }} đ</span>
        </div>
        <div class="et-row grand">
          <span>Tổng hóa đơn</span>
          <span>{{ formatPrice(grandTotal) }} đ</span>
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" size="large">Hủy</el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="loadingOrder"
          @click="handleSubmit"
          size="large"
        >
          <el-icon style="margin-right:4px"><Check /></el-icon>
          Tạo hóa đơn
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Calendar, Check, Ticket, User } from '@element-plus/icons-vue'
import { createInvoice } from '@/api/invoice'
import { getOrder, getOrders } from '@/api/order'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()

// ── Props & emits ─────────────────────────────────────────
const props = defineProps({
  modelValue:  { type: Boolean, default: false },
  orderId:     { type: [Number, String], default: null },  // pre-fill order
  customerId:  { type: [Number, String], default: null },  // informational
  customerName:{ type: String, default: '' },              // show customer name directly
})
const emit = defineEmits(['update:modelValue', 'success'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const hasOrderProp = computed(() => !!props.orderId)

// ── State ─────────────────────────────────────────────────
const formRef       = ref(null)
const loading       = ref(false)
const loadingOrder  = ref(false)
const loadingOrders = ref(false)
const orderInfo     = ref(null)
const orderOptions  = ref([])   // list for el-select
let   _searchTimer  = null

const defaultForm = () => ({
  order_id:  null,
  tax_rate:  10,
  due_date:  '',
  notes:     '',
})
const formData = reactive(defaultForm())

const formRules = {
  order_id: [{ required: true, message: 'Vui lòng chọn đơn hàng', trigger: 'blur' }],
  tax_rate:  [{ required: true, message: 'Nhập % thuế', trigger: 'blur' }],
}

// ── Computed ──────────────────────────────────────────────
const taxAmount = computed(() =>
  Math.round((orderInfo.value?.total_amount ?? 0) * (formData.tax_rate / 100))
)
const grandTotal = computed(() =>
  (orderInfo.value?.total_amount ?? 0) + taxAmount.value
)

// ── Helpers ───────────────────────────────────────────────
function formatPrice(val) {
  return Number(val || 0).toLocaleString('vi-VN')
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN')
}

// ── Load order info ───────────────────────────────────────
async function loadOrder(id) {
  if (!id) { orderInfo.value = null; return }
  loadingOrder.value = true
  try {
    const res = await getOrder(id)
    // Handle { data: {...} } or direct object
    orderInfo.value = (res?.data && typeof res.data === 'object' && !Array.isArray(res.data))
      ? res.data
      : res
  } catch {
    orderInfo.value = null
    if (!hasOrderProp.value) ElMessage.warning('Không tìm thấy đơn hàng #' + id)
  }
  loadingOrder.value = false
}

// Remote search (debounced 350ms)
function searchOrders(query) {
  clearTimeout(_searchTimer)
  _searchTimer = setTimeout(() => fetchOrderOptions(query), 350)
}

async function fetchOrderOptions(search = '') {
  loadingOrders.value = true
  try {
    // Only 'completed' orders without an existing invoice can be invoiced
    const res = await getOrders({ search, per_page: 50, status: 'completed', without_invoice: 1 })
    const list = Array.isArray(res) ? res
                : Array.isArray(res?.data) ? res.data
                : []
    orderOptions.value = list
  } catch { orderOptions.value = [] }
  loadingOrders.value = false
}

// Called when user picks an order from dropdown
async function onOrderSelect(id) {
  if (id) await loadOrder(id)
  else orderInfo.value = null
}

// ── Open / close ──────────────────────────────────────────
async function onOpen() {
  resetForm()
  // Pre-load first batch of orders for the dropdown
  await fetchOrderOptions()
  if (props.orderId) {
    formData.order_id = Number(props.orderId)
    await loadOrder(props.orderId)
  }
}

const handleClose = () => { dialogVisible.value = false }

function resetForm() {
  formRef.value?.clearValidate()
  Object.assign(formData, defaultForm())
  orderInfo.value = null
}

// ── Submit ────────────────────────────────────────────────
const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await createInvoice({
      order_id: formData.order_id,
      tax_rate:  formData.tax_rate  || undefined,
      due_date:  formData.due_date  || undefined,
      notes:     formData.notes     || undefined,
    })
    ElMessage.success('Tạo hóa đơn thành công!')
    emit('success')
    handleClose()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message ?? 'Có lỗi xảy ra')
  }
  loading.value = false
}
</script>

<style scoped lang="scss">
/* ── Dialog ──────────────────────────────────────────────── */
:deep(.invoice-modal) {
  border-radius: 16px;
  .el-dialog__header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border-lighter, #f0f0f0);
    .el-dialog__title { font-size: 18px; font-weight: 700; }
  }
  .el-dialog__body  { padding: 24px; }
  .el-dialog__footer { padding: 16px 24px; border-top: 1px solid var(--border-lighter, #f0f0f0); }

  @media (max-width: 767px) {
    .el-dialog__header { padding: 14px 16px; }
    .el-dialog__body   { padding: 14px 16px; }
    .el-dialog__footer { padding: 10px 16px; position: sticky; bottom: 0; background: var(--bg-color, #fff); }
  }
}

/* ── Order summary card ──────────────────────────────────── */
.order-summary {
  margin-bottom: 20px;
  border-radius: 10px;
  background: var(--el-fill-color-lighter, #f8faff);
  border-color: var(--el-color-primary-light-8, #c6e0ff);
}
.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  .si-label { font-size: 11px; color: var(--el-text-color-secondary); text-transform: uppercase; letter-spacing: .5px; }
  .si-value  { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
  .si-value.code  { color: var(--el-color-primary); font-family: monospace; }
  .si-value.total { color: var(--el-color-success); font-size: 15px; }
}

/* ── Dropdown option row ─────────────────────────────────── */
.order-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  .order-code     { font-family: monospace; font-weight: 700; color: var(--el-color-primary); min-width: 90px; }
  .order-customer { flex: 1; color: var(--el-text-color-regular); font-size: 13px; overflow: hidden; text-overflow: ellipsis; }
  .order-amount   { font-weight: 600; color: var(--el-color-success); font-size: 12px; white-space: nowrap; }
}

/* ── Locked (read-only) value ────────────────────────────── */
.locked-value {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 12px;
  font-weight: 600;
  background: var(--el-fill-color-light, #f5f7fa);
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 6px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

/* ── Estimated total block ───────────────────────────────── */
.estimated-total {
  border-top: 1px dashed var(--el-border-color, #dcdfe6);
  margin: 8px 0 4px;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.et-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--el-text-color-secondary);

  &.grand {
    font-size: 16px;
    font-weight: 800;
    color: var(--el-color-primary);
    border-top: 1px solid var(--el-border-color, #dcdfe6);
    padding-top: 6px;
    margin-top: 2px;
  }
}

/* ── Footer ───────────────────────────────────────────────── */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  @media (max-width: 767px) {
    flex-direction: column-reverse;
    gap: 8px;
    .el-button { width: 100%; margin: 0; }
  }
}

.invoice-form {
  @media (max-width: 767px) {
    :deep(.el-form-item__label) { margin-bottom: 6px; font-weight: 600; }
  }
}
</style>
