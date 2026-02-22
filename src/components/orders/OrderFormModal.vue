<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? 'Chỉnh sửa đơn hàng' : 'Tạo đơn hàng mới'"
    :width="isMobile ? '100%' : '780px'"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
    @close="handleClose"
    class="order-modal"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-width="isMobile ? '100%' : '160px'"
      :label-position="isMobile ? 'top' : 'left'"
      v-loading="loading"
    >
      <!-- Mã đơn hàng -->
      <el-form-item label="Mã đơn hàng" prop="order_code">
        <el-input
          v-model="formData.order_code"
          placeholder="VD: ORD-001"
          clearable
          :disabled="isEdit"
          style="text-transform: uppercase"
        >
          <template #prefix><el-icon><Ticket /></el-icon></template>
        </el-input>
      </el-form-item>

      <!-- Khách hàng -->
      <el-form-item label="Khách hàng" prop="customer_id">
        <el-select
          v-model="formData.customer_id"
          placeholder="Chọn khách hàng"
          filterable
          style="width: 100%"
          :loading="loadingCustomers"
        >
          <el-option
            v-for="c in customers"
            :key="c.id"
            :label="c.name"
            :value="c.id"
          />
        </el-select>
      </el-form-item>

      <!-- Ngày đặt hàng -->
      <el-form-item label="Ngày đặt hàng" prop="order_date">
        <el-date-picker
          v-model="formData.order_date"
          type="date"
          placeholder="Chọn ngày"
          format="DD/MM/YYYY"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <!-- Trạng thái -->
      <el-form-item label="Trạng thái" prop="status">
        <el-select v-model="formData.status" style="width: 100%">
          <el-option
            v-for="s in statusOptions"
            :key="s.value"
            :label="s.label"
            :value="s.value"
          />
        </el-select>
      </el-form-item>

      <!-- Items (sản phẩm) -->
      <el-divider content-position="left">
        <span style="font-size: 14px; font-weight: 600">Danh sách sản phẩm</span>
      </el-divider>

      <div class="items-section">
        <div
          v-for="(item, index) in formData.items"
          :key="index"
          class="order-item"
        >
          <div class="item-row">
            <div class="item-product">
              <el-form-item
                :prop="`items.${index}.product_id`"
                :rules="[{ required: true, message: 'Chọn sản phẩm', trigger: 'change' }]"
                label-width="0"
              >
                <el-select
                  v-model="item.product_id"
                  placeholder="Chọn sản phẩm"
                  filterable
                  style="width: 100%"
                  :loading="loadingProducts"
                  @change="(pid) => onProductChange(pid, index)"
                >
                  <el-option
                    v-for="p in products"
                    :key="p.id"
                    :label="`${p.name} (${p.sku})`"
                    :value="p.id"
                  />
                </el-select>
              </el-form-item>
            </div>

            <div class="item-qty">
              <el-form-item
                :prop="`items.${index}.quantity`"
                :rules="[{ required: true, type: 'number', min: 1, message: 'SL ≥ 1', trigger: 'blur' }]"
                label-width="0"
              >
                <el-input-number
                  v-model="item.quantity"
                  :min="1"
                  :controls="false"
                  placeholder="SL"
                  style="width: 100%"
                  @change="recalcItem(index)"
                />
              </el-form-item>
            </div>

            <div class="item-price">
              <el-form-item
                :prop="`items.${index}.price`"
                :rules="[{ required: true, type: 'number', min: 0, message: 'Nhập giá', trigger: 'blur' }]"
                label-width="0"
              >
                <el-input-number
                  v-model="item.price"
                  :min="0"
                  :controls="false"
                  placeholder="Đơn giá"
                  style="width: 100%"
                  @change="recalcItem(index)"
                />
              </el-form-item>
            </div>

            <div class="item-total">
              <span class="total-text">{{ formatPrice(item.quantity * item.price) }}</span>
            </div>

            <div class="item-remove">
              <el-button
                type="danger"
                :icon="Delete"
                circle
                size="small"
                @click="removeItem(index)"
                :disabled="formData.items.length <= 1"
              />
            </div>
          </div>
        </div>

        <el-button
          :icon="Plus"
          @click="addItem"
          class="add-item-btn"
        >
          Thêm sản phẩm
        </el-button>
      </div>

      <!-- Tổng cộng -->
      <div class="order-total">
        <span class="total-label">Tổng tiền:</span>
        <span class="total-value">{{ formatPrice(totalAmount) }} VNĐ</span>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Hủy</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? 'Cập nhật' : 'Tạo đơn hàng' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Ticket, Delete, Plus } from '@element-plus/icons-vue'
import { createOrder, updateOrder, getOrder } from '@/api/order'
import { getProducts } from '@/api/product'
import { getCustomers } from '@/api/customer'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  orderId: { type: [Number, String], default: null },
})

const emit = defineEmits(['update:modelValue', 'success'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const isEdit = computed(() => !!props.orderId)

const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const loadingCustomers = ref(false)
const loadingProducts = ref(false)
const customers = ref([])
const products = ref([])

const statusOptions = [
  { label: 'Chờ xử lý', value: 'pending' },
  { label: 'Đang xử lý', value: 'processing' },
  { label: 'Hoàn thành', value: 'completed' },
  { label: 'Đã hủy', value: 'cancelled' },
]

const defaultItem = () => ({ product_id: null, quantity: 1, price: 0 })

const defaultForm = () => ({
  order_code: '',
  customer_id: null,
  order_date: new Date().toISOString().slice(0, 10),
  status: 'pending',
  items: [defaultItem()],
})

const formData = reactive(defaultForm())

const totalAmount = computed(() =>
  formData.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0)
)

const formRules = {
  order_code: [{ required: true, message: 'Vui lòng nhập mã đơn hàng', trigger: 'blur' }],
  customer_id: [{ required: true, message: 'Vui lòng chọn khách hàng', trigger: 'change' }],
  order_date: [{ required: true, message: 'Vui lòng chọn ngày đặt hàng', trigger: 'change' }],
  status: [{ required: true, message: 'Vui lòng chọn trạng thái', trigger: 'change' }],
  items: [{ required: true, type: 'array', min: 1, message: 'Cần ít nhất 1 sản phẩm' }],
}

const formatPrice = (val) => Number(val || 0).toLocaleString('vi-VN')

const onProductChange = (productId, index) => {
  const product = products.value.find((p) => p.id === productId)
  if (product) {
    formData.items[index].price = Number(product.price) || 0
  }
}

const recalcItem = () => { /* totalAmount computed handles this */ }

const addItem = () => formData.items.push(defaultItem())

const removeItem = (index) => {
  if (formData.items.length > 1) formData.items.splice(index, 1)
}

const fetchCustomers = async () => {
  loadingCustomers.value = true
  try {
    const res = await getCustomers({ per_page: 999 })
    customers.value = res.data ?? []
  } catch { customers.value = [] }
  finally { loadingCustomers.value = false }
}

const fetchProducts = async () => {
  loadingProducts.value = true
  try {
    const res = await getProducts({ per_page: 999 })
    products.value = res.data ?? []
  } catch { products.value = [] }
  finally { loadingProducts.value = false }
}

const loadOrderData = async (id) => {
  loading.value = true
  try {
    const res = await getOrder(id)
    const o = res.data
    Object.assign(formData, {
      order_code: o.order_code || '',
      customer_id: o.customer_id || null,
      order_date: o.order_date ? o.order_date.slice(0, 10) : '',
      status: o.status || 'pending',
      items: (o.items || o.order_items || []).map((it) => ({
        product_id: it.product_id,
        quantity: it.quantity,
        price: Number(it.price),
      })),
    })
    if (!formData.items.length) formData.items = [defaultItem()]
  } catch (err) {
    ElMessage.error('Tải dữ liệu đơn hàng thất bại')
  } finally {
    loading.value = false
  }
}

watch(dialogVisible, (val) => {
  if (val) {
    fetchCustomers()
    fetchProducts()
    if (props.orderId) loadOrderData(props.orderId)
    else resetForm()
  } else {
    resetForm()
  }
})

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload = { ...formData }
      if (isEdit.value) {
        await updateOrder(props.orderId, payload)
        ElMessage.success('Cập nhật đơn hàng thành công')
      } else {
        await createOrder(payload)
        ElMessage.success('Tạo đơn hàng thành công')
      }
      emit('success')
      handleClose()
    } catch (err) {
      ElMessage.error(err.response?.data?.message || 'Lưu đơn hàng thất bại')
    } finally {
      submitting.value = false
    }
  })
}

const handleClose = () => { dialogVisible.value = false }

const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(formData, defaultForm())
}
</script>

<style scoped lang="scss">
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;

  @media (max-width: 767px) {
    flex-direction: column-reverse;
    .el-button { width: 100%; margin: 0; }
  }
}

.items-section {
  padding: 0 8px;
}

.order-item {
  margin-bottom: 10px;

  .item-row {
    display: grid;
    grid-template-columns: 1fr 90px 130px 110px 36px;
    gap: 8px;
    align-items: start;

    @media (max-width: 767px) {
      grid-template-columns: 1fr 70px 100px 80px 32px;
      gap: 6px;
    }
  }

  .item-total {
    display: flex;
    align-items: flex-start;
    padding-top: 6px;

    .total-text {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-color-primary);
      white-space: nowrap;
    }
  }

  .item-remove {
    display: flex;
    align-items: flex-start;
    padding-top: 4px;
  }
}

.add-item-btn {
  width: 100%;
  border-style: dashed;
  margin-top: 6px;
}

.order-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 14px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 12px 20px;
  margin-top: 12px;

  .total-label {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .total-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-color-primary);
  }
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}
</style>
