<template>
  <div class="det-container" v-loading="loading">
    <!-- Header -->
    <div class="det-header">
      <div class="det-header__left">
        <el-button :icon="ArrowLeft" @click="$router.back()" text>Quay lại</el-button>
        <div class="det-header__info" v-if="po.id">
          <h1 class="det-title">{{ po.po_code || '—' }}</h1>
          <el-tag :type="statusType(po.status)" effect="light" round>{{ statusLabel(po.status) }}</el-tag>
        </div>
      </div>
      <div class="det-header__actions" v-if="po.id">
        <el-button v-if="po.status === 'draft'" type="success" :icon="Check" :loading="saving" @click="handleConfirm">Xác nhận PO</el-button>
        <el-button v-if="po.status === 'confirmed'" type="primary" :icon="Box" @click="openReceive">Nhận hàng vào kho</el-button>
        <el-button v-if="po.status === 'confirmed'" type="primary" plain :icon="CreditCard" @click="showPayForm = true">Ghi nhận TT</el-button>
        <el-button v-if="!['received','cancelled'].includes(po.status)" type="danger" :icon="CircleClose" :loading="saving" @click="handleCancel">Hủy PO</el-button>
      </div>
    </div>

    <!-- Not found -->
    <el-result v-if="!loading && !po.id" icon="error" title="Không tìm thấy phiếu mua hàng">
      <template #extra>
        <el-button type="primary" @click="$router.push('/purchase-orders')">Về danh sách</el-button>
      </template>
    </el-result>

    <template v-if="po.id">
      <!-- Stat cards -->
      <el-row :gutter="14" class="det-stats">
        <el-col :xs="12" :sm="6">
          <div class="scard" style="background:linear-gradient(135deg,#667eea,#764ba2)">
            <el-icon class="scard__icon"><Money /></el-icon>
            <div><div class="scard__val">{{ fmt(po.total_amount) }}</div><div class="scard__lbl">Tổng giá trị (₫)</div></div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="scard" style="background:linear-gradient(135deg,#11998e,#38ef7d)">
            <el-icon class="scard__icon"><Box /></el-icon>
            <div><div class="scard__val">{{ (po.items || []).length }}</div><div class="scard__lbl">Sản phẩm</div></div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="scard" style="background:linear-gradient(135deg,#f093fb,#f5576c)">
            <el-icon class="scard__icon"><OfficeBuilding /></el-icon>
            <div><div class="scard__val" style="font-size:14px">{{ po.supplier?.name || '—' }}</div><div class="scard__lbl">Nhà cung cấp</div></div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="scard" style="background:linear-gradient(135deg,#4facfe,#00f2fe)">
            <el-icon class="scard__icon"><Calendar /></el-icon>
            <div><div class="scard__val" style="font-size:14px">{{ po.expected_date || '—' }}</div><div class="scard__lbl">Dự kiến nhận</div></div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <!-- Left: PO info -->
        <el-col :xs="24" :md="10">
          <el-card shadow="never" class="det-card">
            <template #header>
              <span class="det-card__title"><el-icon><Tickets /></el-icon> Thông tin phiếu mua</span>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="Mã PO">
                <span class="mono-code">{{ po.po_code }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="Nhà cung cấp">
                <el-icon style="vertical-align:-2px;margin-right:4px"><OfficeBuilding /></el-icon>{{ po.supplier?.name || '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="Ngày đặt">
                <el-icon style="vertical-align:-2px;margin-right:4px;color:#6b7280"><Calendar /></el-icon>{{ po.order_date || '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="Dự kiến nhận">
                <el-icon style="vertical-align:-2px;margin-right:4px;color:#6b7280"><Timer /></el-icon>{{ po.expected_date || '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="Tổng giá trị">
                <strong class="text-warning" style="font-size:1.1rem">{{ fmt(po.total_amount) }} ₫</strong>
              </el-descriptions-item>
              <el-descriptions-item label="Ghi chú">{{ po.notes || '—' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <!-- Right: Items table -->
        <el-col :xs="24" :md="14">
          <el-card shadow="never" class="det-card">
            <template #header>
              <div class="det-card__head">
                <span class="det-card__title"><el-icon><Box /></el-icon> Danh sách sản phẩm</span>
                <el-tag type="info" size="small">{{ (po.items || []).length }} SP</el-tag>
              </div>
            </template>
            <el-table :data="po.items || []" stripe size="small">
              <el-table-column label="Sản phẩm" min-width="180">
                <template #default="{ row }">
                  <span style="font-weight:600">{{ row.product_name }}</span>
                  <span style="color:#999;margin-left:6px;font-size:12px">({{ row.product_sku }})</span>
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="SL" width="70" align="center" />
              <el-table-column label="Đơn giá" width="130" align="right">
                <template #default="{ row }">{{ fmt(row.unit_price) }} ₫</template>
              </el-table-column>
              <el-table-column label="Thành tiền" width="140" align="right">
                <template #default="{ row }"><span class="fw-700 text-primary">{{ fmt(row.total_price) }} ₫</span></template>
              </el-table-column>
              <el-table-column label="Đã nhận" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.received_quantity >= row.quantity ? 'success' : 'warning'" size="small">
                    {{ row.received_quantity ?? 0 }}/{{ row.quantity }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <!-- Total bar -->
            <div class="pay-summary">
              <div class="pay-summary__row pay-summary__row--total">
                <span>Tổng giá trị</span>
                <strong>{{ fmt(po.total_amount) }} ₫</strong>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- Receive Dialog -->
    <el-dialog v-model="showReceive" title="📦 Nhận hàng vào kho" :width="isMobile ? '100%' : '420px'" :fullscreen="isMobile">
      <el-form :label-width="isMobile ? '100%' : '100px'" :label-position="isMobile ? 'top' : 'left'">
        <el-form-item label="Kho nhận" required>
          <el-select v-model="receiveWarehouseId" filterable placeholder="Chọn kho nhận hàng" style="width:100%">
            <el-option v-for="w in warehouseList" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReceive = false">Hủy</el-button>
        <el-button type="success" :loading="saving" :icon="Box" @click="handleReceive">Xác nhận nhận hàng</el-button>
      </template>
    </el-dialog>

    <!-- Payment Dialog -->
    <el-dialog v-model="showPayForm" title="💳 Ghi nhận thanh toán" :width="isMobile ? '100%' : '480px'" :fullscreen="isMobile">
      <el-form ref="payFormRef" :model="payForm" :label-width="isMobile ? '100%' : '130px'" :label-position="isMobile ? 'top' : 'left'">
        <el-form-item label="Số tiền" prop="amount" :rules="[{required:true,message:'Nhập số tiền',trigger:'blur'}]">
          <el-input-number v-model="payForm.amount" :min="1" :precision="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="Phương thức">
          <el-select v-model="payForm.payment_method" style="width:100%">
            <el-option label="💵 Tiền mặt" value="cash" />
            <el-option label="🏦 Chuyển khoản" value="bank_transfer" />
            <el-option label="💳 Thẻ" value="card" />
            <el-option label="📋 Khác" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="Ngày TT">
          <el-date-picker v-model="payForm.payment_date" type="date" format="DD/MM/YYYY" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="Mã tham chiếu">
          <el-input v-model="payForm.reference" clearable />
        </el-form-item>
        <el-form-item label="Ghi chú">
          <el-input v-model="payForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPayForm = false">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handlePaySubmit">Ghi nhận</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Tickets, OfficeBuilding, Calendar, Timer, Check, Box, CreditCard, CircleClose, Money } from '@element-plus/icons-vue'
import { getPurchaseOrder, confirmPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder } from '@/api/purchaseOrder'
import { createPayment } from '@/api/payment'
import { getWarehouses } from '@/api/warehouse'
import { useResponsive } from '@/composables/useResponsive'

const route  = useRoute()
const router = useRouter()
const { isMobile } = useResponsive()

const loading              = ref(false)
const saving               = ref(false)
const po                   = ref({})
const showReceive          = ref(false)
const showPayForm          = ref(false)
const payFormRef           = ref(null)
const warehouseList        = ref([])
const receiveWarehouseId   = ref(null)
const payForm              = ref({ amount: 0, payment_method: 'cash', payment_date: '', reference: '', notes: '' })

const fmt         = (v) => Number(v || 0).toLocaleString('vi-VN')
const statusType  = (s) => ({ draft:'info', confirmed:'warning', received:'success', cancelled:'danger' }[s] || 'info')
const statusLabel = (s) => ({ draft:'Nháp', confirmed:'Đã xác nhận', received:'Đã nhận hàng', cancelled:'Đã hủy' }[s] || s)

const load = async () => {
  loading.value = true
  try {
    const res = await getPurchaseOrder(route.params.id)
    po.value = res.data ?? res
    payForm.value.amount = Number(po.value.total_amount || 0)
  } catch { ElMessage.error('Không tải được phiếu mua hàng') }
  loading.value = false
}

const handleConfirm = async () => {
  saving.value = true
  try { const r = await confirmPurchaseOrder(po.value.id); po.value = r.data ?? r; ElMessage.success('Xác nhận PO thành công!') }
  catch (e) { ElMessage.error(e.response?.data?.message || 'Có lỗi') }
  saving.value = false
}

const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('Hủy phiếu mua này?', 'Xác nhận', { type: 'warning', confirmButtonText: 'Hủy PO', cancelButtonText: 'Thôi' })
    saving.value = true
    const r = await cancelPurchaseOrder(po.value.id)
    po.value = r.data ?? r
    ElMessage.success('Đã hủy PO!')
  } catch (e) { if (e !== 'cancel') ElMessage.error(e.response?.data?.message || 'Có lỗi') }
  saving.value = false
}

const openReceive = async () => {
  receiveWarehouseId.value = null
  try { const r = await getWarehouses({ per_page: 999 }); warehouseList.value = r.data || r } catch {}
  showReceive.value = true
}

const handleReceive = async () => {
  if (!receiveWarehouseId.value) return ElMessage.warning('Vui lòng chọn kho!')
  saving.value = true
  try {
    const r = await receivePurchaseOrder(po.value.id, { warehouse_id: receiveWarehouseId.value })
    po.value = r.data ?? r
    showReceive.value = false
    ElMessage.success('Nhận hàng thành công!')
  } catch (e) { ElMessage.error(e.response?.data?.message || 'Có lỗi') }
  saving.value = false
}

const handlePaySubmit = async () => {
  await payFormRef.value?.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      await createPayment({ payable_type: 'App\\Models\\PurchaseOrder', payable_id: po.value.id, ...payForm.value })
      ElMessage.success('Ghi nhận thanh toán thành công!')
      showPayForm.value = false
      await load()
    } catch (e) { ElMessage.error(e.response?.data?.message || 'Có lỗi') }
    saving.value = false
  })
}

onMounted(load)
</script>

<style scoped lang="scss">
@import '@/views/finance/_detail-shared.scss';
</style>
