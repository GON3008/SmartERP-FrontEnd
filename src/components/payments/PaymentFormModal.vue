<template>
  <el-dialog
    v-model="dialogVisible"
    title="💳 Ghi nhận thanh toán"
    :width="isMobile ? '100%' : '580px'"
    :fullscreen="isMobile"
    :close-on-click-modal="true"
    @open="onOpen"
    @close="handleClose"
    class="payment-modal"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-width="isMobile ? '100%' : '130px'"
      :label-position="isMobile ? 'top' : 'left'"
      class="payment-form"
    >
      <!-- Loại chứng từ -->
      <el-form-item label="Loại chứng từ" prop="payable_type">
        <el-select v-model="formData.payable_type" style="width:100%" size="large" @change="onTypeChange">
          <template #prefix><el-icon><Document /></el-icon></template>
          <el-option label="🧾 Hóa đơn (Invoice)" value="App\Models\Invoice" />
          <el-option label="🛒 Phiếu mua (PO)" value="App\Models\PurchaseOrder" />
        </el-select>
      </el-form-item>

      <!-- Searchable chứng từ -->
      <el-form-item label="Chứng từ" prop="payable_id">
        <el-select
          v-model="formData.payable_id"
          filterable
          remote
          :remote-method="searchDocuments"
          :loading="loadingDocs"
          clearable
          placeholder="Tìm mã chứng từ..."
          style="width:100%"
          size="large"
          @change="onDocSelect"
        >
          <template #prefix><el-icon><Tickets /></el-icon></template>
          <el-option
            v-for="doc in docOptions"
            :key="doc.id"
            :value="doc.id"
            :label="doc._label"
          >
            <div class="doc-option">
              <span class="doc-code">{{ doc._code }}</span>
              <span class="doc-meta">{{ doc._meta }}</span>
              <span class="doc-amount">{{ fmt(doc.total_amount) }} ₫</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- Selected doc info -->
      <div v-if="selectedDoc" class="doc-info-card">
        <div class="doc-info-row">
          <span class="doc-info-label">Mã:</span>
          <span class="doc-info-val mono">{{ selectedDoc._code }}</span>
        </div>
        <div class="doc-info-row">
          <span class="doc-info-label">{{ formData.payable_type.includes('Invoice') ? 'Khách hàng' : 'Nhà CC' }}:</span>
          <span class="doc-info-val">{{ selectedDoc._meta }}</span>
        </div>
        <div class="doc-info-row">
          <span class="doc-info-label">Tổng tiền:</span>
          <span class="doc-info-val">{{ fmt(selectedDoc.total_amount) }} ₫</span>
        </div>
        <div v-if="selectedDoc._remaining !== undefined" class="doc-info-row">
          <span class="doc-info-label">Còn lại:</span>
          <span class="doc-info-val" :style="selectedDoc._remaining > 0 ? 'color:var(--el-color-danger);font-weight:700' : 'color:var(--el-color-success)'">
            {{ fmt(selectedDoc._remaining) }} ₫
          </span>
        </div>
      </div>

      <!-- Số tiền -->
      <el-form-item label="Số tiền" prop="amount">
        <el-input-number v-model="formData.amount" :min="1" :precision="0" style="width:100%" size="large" />
      </el-form-item>

      <!-- Phương thức -->
      <el-form-item label="Phương thức">
        <el-select v-model="formData.payment_method" style="width:100%" size="large">
          <template #prefix><el-icon><CreditCard /></el-icon></template>
          <el-option label="💵 Tiền mặt" value="cash" />
          <el-option label="🏦 Chuyển khoản" value="bank_transfer" />
          <el-option label="💳 Thẻ" value="card" />
          <el-option label="📋 Khác" value="other" />
        </el-select>
      </el-form-item>

      <!-- Ngày TT -->
      <el-form-item label="Ngày TT">
        <el-date-picker v-model="formData.payment_date" type="date" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width:100%" size="large" :prefix-icon="Calendar" />
      </el-form-item>

      <!-- Mã tham chiếu -->
      <el-form-item label="Mã tham chiếu">
        <el-input v-model="formData.reference" clearable size="large" placeholder="VD: TK1234, GD0001">
          <template #prefix><el-icon><Link /></el-icon></template>
        </el-input>
      </el-form-item>

      <!-- Ghi chú -->
      <el-form-item label="Ghi chú">
        <el-input v-model="formData.notes" type="textarea" :rows="2" placeholder="Ghi chú thêm..." />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" size="large">Hủy</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit" size="large">
          <el-icon style="margin-right:4px"><Check /></el-icon>Ghi nhận
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, CreditCard, Calendar, Link, Check, Tickets } from '@element-plus/icons-vue'
import { createPayment } from '@/api/payment'
import { getInvoices } from '@/api/invoice'
import { getPurchaseOrders } from '@/api/purchaseOrder'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  invoiceId: { type: [Number, String], default: null },
  purchaseOrderId: { type: [Number, String], default: null },
})
const emit = defineEmits(['update:modelValue', 'success'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref(null)
const loading = ref(false)
const loadingDocs = ref(false)
const docOptions = ref([])
const selectedDoc = ref(null)
let _searchTimer = null

const defaultForm = () => ({
  payable_type: 'App\\Models\\Invoice',
  payable_id: null,
  amount: 0,
  payment_method: 'cash',
  payment_date: new Date().toISOString().slice(0, 10),
  reference: '',
  notes: ''
})

const formData = reactive(defaultForm())

const formRules = {
  payable_type: [{ required: true, message: 'Vui lòng chọn loại', trigger: 'change' }],
  payable_id: [{ required: true, message: 'Vui lòng chọn chứng từ', trigger: 'change' }],
  amount: [{ required: true, validator: (r, v, cb) => v > 0 ? cb() : cb(new Error('Số tiền phải > 0')), trigger: 'blur' }]
}

const fmt = (v) => Number(v || 0).toLocaleString('vi-VN')

// Map API response items to display format
function mapDocOptions(list, isInvoice) {
  return (list || []).map(doc => ({
    ...doc,
    _code: isInvoice ? (doc.invoice_code ?? `#${doc.id}`) : (doc.po_code ?? `#${doc.id}`),
    _meta: isInvoice ? (doc.customer?.name ?? doc.customer_name ?? '') : (doc.supplier?.name ?? ''),
    _label: isInvoice
      ? `${doc.invoice_code ?? doc.id} — ${doc.customer?.name ?? ''}`
      : `${doc.po_code ?? doc.id} — ${doc.supplier?.name ?? ''}`,
    _remaining: isInvoice
      ? Math.max(0, Number(doc.total_amount || 0) - Number(doc.paid_amount || 0))
      : undefined,
  }))
}

async function fetchDocs(search = '') {
  loadingDocs.value = true
  try {
    const isInvoice = formData.payable_type.includes('Invoice')
    let list = []
    if (isInvoice) {
      const res = await getInvoices({ search, per_page: 30, status: 'sent,unpaid,partial,overdue' })
      list = Array.isArray(res) ? res : (res?.data ?? [])
    } else {
      const res = await getPurchaseOrders({ search, per_page: 30, status: 'confirmed' })
      list = Array.isArray(res) ? res : (res?.data ?? [])
    }
    docOptions.value = mapDocOptions(list, isInvoice)
  } catch { docOptions.value = [] }
  loadingDocs.value = false
}

function searchDocuments(query) {
  clearTimeout(_searchTimer)
  _searchTimer = setTimeout(() => fetchDocs(query), 350)
}

function onDocSelect(id) {
  selectedDoc.value = docOptions.value.find(d => d.id === id) ?? null
  if (selectedDoc.value) {
    // Pre-fill amount with remaining balance (invoices) or total (PO)
    const isInvoice = formData.payable_type.includes('Invoice')
    formData.amount = isInvoice
      ? (selectedDoc.value._remaining || Number(selectedDoc.value.total_amount || 0))
      : Number(selectedDoc.value.total_amount || 0)
  }
}

function onTypeChange() {
  formData.payable_id = null
  selectedDoc.value = null
  docOptions.value = []
  fetchDocs()
}

async function onOpen() {
  resetForm()
  // If pre-set props
  if (props.invoiceId) {
    formData.payable_type = 'App\\Models\\Invoice'
    formData.payable_id = Number(props.invoiceId)
  } else if (props.purchaseOrderId) {
    formData.payable_type = 'App\\Models\\PurchaseOrder'
    formData.payable_id = Number(props.purchaseOrderId)
  }
  await fetchDocs()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await createPayment({ ...formData })
      ElMessage.success('Ghi nhận thanh toán thành công!')
      emit('success')
      handleClose()
    } catch (e) { ElMessage.error(e.response?.data?.message || 'Có lỗi') }
    loading.value = false
  })
}

const handleClose = () => { dialogVisible.value = false }
const resetForm = () => { formRef.value?.resetFields(); Object.assign(formData, defaultForm()); selectedDoc.value = null; docOptions.value = [] }
</script>

<style scoped lang="scss">
.dialog-footer {
  display: flex; justify-content: flex-end; gap: 12px;
  @media (max-width: 767px) { flex-direction: column-reverse; gap: 8px; .el-button { width: 100%; margin: 0; } }
}
:deep(.payment-modal) {
  border-radius: 16px;
  .el-dialog__header { padding: 20px 24px 16px; border-bottom: 1px solid var(--border-lighter, #f0f0f0); .el-dialog__title { font-size: 18px; font-weight: 700; } }
  .el-dialog__body { padding: 24px; max-height: 70vh; overflow-y: auto; }
  .el-dialog__footer { padding: 16px 24px; border-top: 1px solid var(--border-lighter, #f0f0f0); }
  @media (max-width: 767px) {
    .el-dialog__header { padding: 16px; }
    .el-dialog__body { padding: 16px; max-height: calc(100vh - 130px); }
    .el-dialog__footer { padding: 12px 16px; position: sticky; bottom: 0; background: var(--bg-color, #fff); }
  }
}
.payment-form {
  :deep(.el-input__prefix) { color: var(--el-color-primary); }
}

// Doc option in dropdown
.doc-option {
  display: flex; align-items: center; gap: 8px; width: 100%;
  .doc-code { font-family: monospace; font-weight: 700; color: var(--el-color-primary); min-width: 120px; }
  .doc-meta { flex: 1; color: var(--el-text-color-regular); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .doc-amount { font-weight: 600; color: var(--el-color-success); font-size: 12px; white-space: nowrap; }
}

// Selected doc summary card
.doc-info-card {
  background: var(--el-fill-color-light, #f5f7fa);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex; flex-wrap: wrap; gap: 8px 24px;
}
.doc-info-row {
  display: flex; align-items: center; gap: 6px;
  .doc-info-label { font-size: 12px; color: var(--el-text-color-secondary); white-space: nowrap; }
  .doc-info-val { font-size: 13px; font-weight: 600; }
  .mono { font-family: monospace; color: var(--el-color-primary); }
}
</style>
