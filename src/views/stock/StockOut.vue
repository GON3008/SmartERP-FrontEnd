<template>
  <div class="stock-out-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Xuất kho</h1>
        <p class="page-description">Ghi nhận hàng hoá xuất ra khỏi kho</p>
      </div>
    </div>

    <el-row :gutter="16">
      <!-- Form -->
      <el-col :xs="24" :md="12">
        <el-card>
          <template #header><span class="card-title">Phiếu xuất kho</span></template>
          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="140px"
            :label-position="isMobile ? 'top' : 'left'"
            v-loading="submitting"
          >
            <el-form-item label="Sản phẩm" prop="product_id">
              <el-select v-model="formData.product_id" placeholder="Chọn sản phẩm" filterable style="width:100%" :loading="loadingProducts">
                <el-option v-for="p in products" :key="p.id" :label="`${p.name} (${p.sku})`" :value="p.id" />
              </el-select>
            </el-form-item>

            <el-form-item label="Kho xuất" prop="warehouse_id">
              <el-select v-model="formData.warehouse_id" placeholder="Chọn kho" filterable style="width:100%" :loading="loadingWarehouses">
                <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
              </el-select>
            </el-form-item>

            <el-form-item label="Số lượng" prop="quantity">
              <el-input-number v-model="formData.quantity" :min="1" :controls="false" style="width:100%" placeholder="Nhập số lượng" />
            </el-form-item>

            <el-form-item label="Ngày xuất" prop="export_date">
              <el-date-picker
                v-model="formData.export_date"
                type="date"
                placeholder="Chọn ngày"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
                :disabled-date="(d) => d > new Date()"
                style="width:100%"
              />
            </el-form-item>

            <el-form-item label="Lý do" prop="reason">
              <el-select v-model="formData.reason" placeholder="Chọn lý do" style="width:100%">
                <el-option label="Bán hàng" value="sale" />
                <el-option label="Hỏng hóc" value="damage" />
                <el-option label="Điều chỉnh" value="adjustment" />
                <el-option label="Khác" value="other" />
              </el-select>
            </el-form-item>

            <el-form-item label="Ghi chú">
              <el-input v-model="formData.note" type="textarea" :rows="2" placeholder="Ghi chú (tùy chọn)" />
            </el-form-item>

            <el-form-item>
              <el-button type="warning" :loading="submitting" @click="handleSubmit" size="large" style="width:100%">
                <el-icon class="mr-1"><Download /></el-icon> Xác nhận xuất kho
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- History -->
      <el-col :xs="24" :md="12">
        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="card-title">Lịch sử xuất kho</span>
              <el-button size="small" :icon="Refresh" @click="fetchHistory" :loading="loadingHistory">Làm mới</el-button>
            </div>
          </template>
          <el-table v-loading="loadingHistory" :data="history" stripe max-height="460">
            <el-table-column label="Sản phẩm" min-width="140" show-overflow-tooltip>
              <template #default="{ row }">{{ row.product?.name ?? '—' }}</template>
            </el-table-column>
            <el-table-column label="Kho" min-width="100" show-overflow-tooltip>
              <template #default="{ row }">{{ row.warehouse?.name ?? '—' }}</template>
            </el-table-column>
            <el-table-column prop="quantity" label="SL" width="70" align="center" />
            <el-table-column label="Lý do" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="reasonType(row.reason)" size="small">{{ reasonLabel(row.reason) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!loadingHistory && !history.length" description="Chưa có lịch sử" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import { stockOut, getStockOutHistory } from '@/api/stock'
import { getProducts } from '@/api/product'
import { getWarehouses } from '@/api/warehouse'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()

const formRef = ref(null)
const submitting = ref(false)
const loadingProducts = ref(false)
const loadingWarehouses = ref(false)
const loadingHistory = ref(false)
const products = ref([])
const warehouses = ref([])
const history = ref([])

const defaultForm = () => ({
  product_id: null,
  warehouse_id: null,
  quantity: null,
  export_date: new Date().toISOString().slice(0, 10),
  reason: '',
  note: '',
})
const formData = reactive(defaultForm())

const formRules = {
  product_id: [{ required: true, message: 'Chọn sản phẩm', trigger: 'change' }],
  warehouse_id: [{ required: true, message: 'Chọn kho', trigger: 'change' }],
  quantity: [{ required: true, type: 'number', min: 1, message: 'Số lượng ≥ 1', trigger: 'blur' }],
  export_date: [{ required: true, message: 'Chọn ngày xuất', trigger: 'change' }],
  reason: [{ required: true, message: 'Chọn lý do', trigger: 'change' }],
}

const reasonLabel = (r) => ({ sale: 'Bán hàng', damage: 'Hỏng hóc', adjustment: 'Điều chỉnh', other: 'Khác' }[r] ?? r)
const reasonType = (r) => ({ sale: 'success', damage: 'danger', adjustment: 'warning', other: 'info' }[r] ?? 'info')

const fetchProducts = async () => {
  loadingProducts.value = true
  try { const res = await getProducts({ per_page: 999 }); products.value = res.data ?? [] }
  catch { products.value = [] }
  finally { loadingProducts.value = false }
}

const fetchWarehouses = async () => {
  loadingWarehouses.value = true
  try { const res = await getWarehouses({ per_page: 999 }); warehouses.value = res.data ?? [] }
  catch { warehouses.value = [] }
  finally { loadingWarehouses.value = false }
}

const fetchHistory = async () => {
  loadingHistory.value = true
  try { const res = await getStockOutHistory({ per_page: 20 }); history.value = res.data ?? [] }
  catch { history.value = [] }
  finally { loadingHistory.value = false }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await stockOut(formData)
      ElMessage.success('Xuất kho thành công!')
      Object.assign(formData, defaultForm())
      formRef.value.resetFields()
      fetchHistory()
    } catch (err) {
      ElMessage.error(err.response?.data?.message || 'Xuất kho thất bại')
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => { fetchProducts(); fetchWarehouses(); fetchHistory() })
</script>

<style scoped lang="scss">
.stock-out-container {
  .page-header { margin-bottom: 16px;
    .page-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .page-description { font-size: 14px; color: var(--text-secondary); margin: 0; }
  }
  .card-title { font-weight: 600; font-size: 15px; }
  .mr-1 { margin-right: 4px; }
}
</style>
