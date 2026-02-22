<template>
  <div class="transfer-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Chuyển kho</h1>
        <p class="page-description">Điều chuyển hàng hoá giữa các kho</p>
      </div>
    </div>

    <el-row :gutter="16">
      <!-- Form -->
      <el-col :xs="24" :md="12">
        <el-card>
          <template #header><span class="card-title">Phiếu chuyển kho</span></template>
          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="150px"
            :label-position="isMobile ? 'top' : 'left'"
            v-loading="submitting"
          >
            <el-form-item label="Sản phẩm" prop="product_id">
              <el-select v-model="formData.product_id" placeholder="Chọn sản phẩm" filterable style="width:100%" :loading="loadingProducts">
                <el-option v-for="p in products" :key="p.id" :label="`${p.name} (${p.sku})`" :value="p.id" />
              </el-select>
            </el-form-item>

            <el-form-item label="Kho xuất (từ)" prop="from_warehouse_id">
              <el-select v-model="formData.from_warehouse_id" placeholder="Chọn kho xuất" filterable style="width:100%">
                <el-option
                  v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id"
                  :disabled="w.id === formData.to_warehouse_id"
                />
              </el-select>
            </el-form-item>

            <!-- Arrow indicator -->
            <div class="transfer-arrow">
              <el-icon size="24" color="var(--el-color-primary)"><ArrowDown /></el-icon>
            </div>

            <el-form-item label="Kho nhập (đến)" prop="to_warehouse_id">
              <el-select v-model="formData.to_warehouse_id" placeholder="Chọn kho nhập" filterable style="width:100%">
                <el-option
                  v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id"
                  :disabled="w.id === formData.from_warehouse_id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="Số lượng" prop="quantity">
              <el-input-number v-model="formData.quantity" :min="1" :controls="false" style="width:100%" placeholder="Nhập số lượng" />
            </el-form-item>

            <el-form-item label="Ghi chú">
              <el-input v-model="formData.note" type="textarea" :rows="2" placeholder="Ghi chú (tùy chọn)" maxlength="500" show-word-limit />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="submitting" @click="handleSubmit" size="large" style="width:100%">
                <el-icon class="mr-1"><Switch /></el-icon> Xác nhận chuyển kho
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- Summary card -->
      <el-col :xs="24" :md="12">
        <el-card class="mb-md summary-card">
          <template #header><span class="card-title">Lưu ý khi chuyển kho</span></template>
          <el-alert type="info" :closable="false" show-icon title="Thông tin quan trọng" class="mb-md">
            <template #default>
              <ul class="hint-list">
                <li>Kho xuất và kho nhập phải khác nhau.</li>
                <li>Số lượng chuyển không được vượt quá tồn kho hiện tại của kho xuất.</li>
                <li>Thao tác này sẽ tạo phiếu xuất kho tại kho xuất và phiếu nhập kho tại kho nhập.</li>
                <li>Thao tác không thể hoàn tác sau khi xác nhận.</li>
              </ul>
            </template>
          </el-alert>

          <!-- Preview -->
          <div class="transfer-preview" v-if="formData.from_warehouse_id && formData.to_warehouse_id && formData.product_id">
            <div class="preview-title">Xem trước giao dịch</div>
            <div class="preview-row">
              <span class="preview-label">Sản phẩm:</span>
              <span class="preview-value">{{ productName }}</span>
            </div>
            <div class="preview-row">
              <span class="preview-label">Từ kho:</span>
              <el-tag type="warning">{{ fromWarehouseName }}</el-tag>
            </div>
            <div class="preview-row">
              <span class="preview-label">Đến kho:</span>
              <el-tag type="success">{{ toWarehouseName }}</el-tag>
            </div>
            <div class="preview-row">
              <span class="preview-label">Số lượng:</span>
              <span class="preview-value font-bold">{{ formData.quantity ?? '—' }}</span>
            </div>
          </div>
        </el-card>

        <!-- Recent -->
        <el-card>
          <template #header><span class="card-title">Chuyển kho gần đây</span></template>
          <el-empty v-if="!recentTransfers.length" description="Chưa có dữ liệu" />
          <div v-else class="recent-list">
            <div v-for="t in recentTransfers" :key="t.id" class="recent-item">
              <div class="recent-product">{{ t.product?.name ?? '—' }}</div>
              <div class="recent-info">
                <el-tag type="warning" size="small">{{ t.from_warehouse?.name ?? '—' }}</el-tag>
                <el-icon><ArrowRight /></el-icon>
                <el-tag type="success" size="small">{{ t.to_warehouse?.name ?? '—' }}</el-tag>
                <span class="recent-qty">x{{ t.quantity }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, ArrowRight, Switch } from '@element-plus/icons-vue'
import { transferStock } from '@/api/stock'
import { getProducts } from '@/api/product'
import { getWarehouses } from '@/api/warehouse'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()

const formRef = ref(null)
const submitting = ref(false)
const loadingProducts = ref(false)
const products = ref([])
const warehouses = ref([])
const recentTransfers = ref([])

const defaultForm = () => ({ product_id: null, from_warehouse_id: null, to_warehouse_id: null, quantity: null, note: '' })
const formData = reactive(defaultForm())

const formRules = {
  product_id: [{ required: true, message: 'Chọn sản phẩm', trigger: 'change' }],
  from_warehouse_id: [{ required: true, message: 'Chọn kho xuất', trigger: 'change' }],
  to_warehouse_id: [
    { required: true, message: 'Chọn kho nhập', trigger: 'change' },
    {
      validator: (rule, val, cb) => {
        if (val && val === formData.from_warehouse_id) cb(new Error('Kho nhập phải khác kho xuất'))
        else cb()
      }, trigger: 'change'
    }
  ],
  quantity: [{ required: true, type: 'number', min: 1, message: 'Số lượng ≥ 1', trigger: 'blur' }],
}

const productName = computed(() => products.value.find(p => p.id === formData.product_id)?.name ?? '—')
const fromWarehouseName = computed(() => warehouses.value.find(w => w.id === formData.from_warehouse_id)?.name ?? '—')
const toWarehouseName = computed(() => warehouses.value.find(w => w.id === formData.to_warehouse_id)?.name ?? '—')

const fetchProducts = async () => {
  loadingProducts.value = true
  try { const res = await getProducts({ per_page: 999 }); products.value = res.data ?? [] }
  catch { products.value = [] }
  finally { loadingProducts.value = false }
}

const fetchWarehouses = async () => {
  try { const res = await getWarehouses({ per_page: 999 }); warehouses.value = res.data ?? [] }
  catch { warehouses.value = [] }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const res = await transferStock(formData)
      ElMessage.success('Chuyển kho thành công!')
      // Add to recent list
      recentTransfers.value.unshift({
        ...res.data,
        product: products.value.find(p => p.id === formData.product_id),
        from_warehouse: warehouses.value.find(w => w.id === formData.from_warehouse_id),
        to_warehouse: warehouses.value.find(w => w.id === formData.to_warehouse_id),
        quantity: formData.quantity,
      })
      if (recentTransfers.value.length > 5) recentTransfers.value.pop()
      Object.assign(formData, defaultForm())
      formRef.value.resetFields()
    } catch (err) {
      ElMessage.error(err.response?.data?.message || 'Chuyển kho thất bại')
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => { fetchProducts(); fetchWarehouses() })
</script>

<style scoped lang="scss">
.transfer-container {
  .page-header { margin-bottom: 16px;
    .page-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .page-description { font-size: 14px; color: var(--text-secondary); margin: 0; }
  }
  .card-title { font-weight: 600; font-size: 15px; }
  .mr-1 { margin-right: 4px; }

  .transfer-arrow {
    display: flex; justify-content: center; align-items: center;
    padding: 8px 0; margin-left: 150px;
  }

  .hint-list {
    margin: 0; padding-left: 18px;
    li { margin-bottom: 4px; font-size: 13px; color: var(--text-secondary); }
  }

  .transfer-preview {
    background: var(--el-fill-color-light); border-radius: 8px; padding: 14px;

    .preview-title { font-weight: 600; font-size: 14px; margin-bottom: 10px; color: var(--text-primary); }

    .preview-row {
      display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
      .preview-label { font-size: 13px; color: var(--text-secondary); min-width: 80px; }
      .preview-value { font-size: 13px; font-weight: 500; }
      .font-bold { font-size: 16px; font-weight: 700; color: var(--el-color-primary); }
    }
  }

  .recent-list {
    .recent-item {
      padding: 10px 0; border-bottom: 1px solid var(--el-border-color-lighter);
      &:last-child { border-bottom: none; }

      .recent-product { font-size: 13px; font-weight: 500; margin-bottom: 6px; }
      .recent-info {
        display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
        .recent-qty { font-size: 13px; font-weight: 600; color: var(--el-color-primary); margin-left: 4px; }
      }
    }
  }
}
</style>
