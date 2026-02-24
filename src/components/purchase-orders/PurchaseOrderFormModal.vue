<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '✏️ Chỉnh sửa phiếu mua hàng' : '🛒 Tạo phiếu mua hàng'"
    :width="isMobile ? '100%' : '860px'"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
    @open="onOpen"
    @close="handleClose"
    class="po-modal"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-width="isMobile ? '100%' : '170px'"
      :label-position="isMobile ? 'top' : 'left'"
      v-loading="loading"
    >
      <!-- ── Nhà cung cấp ─────────────────────────────────── -->
      <el-form-item label="Nhà cung cấp" prop="supplier_id">
        <el-select
          v-model="formData.supplier_id"
          placeholder="Tìm nhà cung cấp..."
          filterable
          style="width: 100%"
          size="large"
          :loading="loadingSuppliers"
        >
          <template #prefix
            ><el-icon><Shop /></el-icon
          ></template>
          <el-option
            v-for="s in suppliers"
            :key="s.id"
            :label="`${s.name}${s.email ? ' — ' + s.email : ''}`"
            :value="s.id"
          />
        </el-select>
      </el-form-item>

      <!-- ── Ngày đặt / Ngày dự kiến ─────────────────────── -->
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-form-item label="Ngày đặt hàng" prop="order_date">
            <el-date-picker
              v-model="formData.order_date"
              type="date"
              placeholder="Chọn ngày"
              format="DD/MM/YYYY"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              size="large"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="Ngày dự kiến nhận" prop="expected_date">
            <el-date-picker
              v-model="formData.expected_date"
              type="date"
              placeholder="Chọn ngày"
              format="DD/MM/YYYY"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              size="large"
              :disabled-date="
                (d) => (formData.order_date ? d < new Date(formData.order_date) : false)
              "
            />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- ── Danh sách sản phẩm ──────────────────────────── -->
      <el-divider content-position="left">
        <span style="font-size: 14px; font-weight: 700">📦 Danh sách sản phẩm</span>
      </el-divider>

      <!-- Header row (desktop only) -->
      <div class="items-header" v-if="!isMobile">
        <span class="col-product">Sản phẩm</span>
        <span class="col-qty">Số lượng</span>
        <span class="col-price">Đơn giá (đ)</span>
        <span class="col-total">Thành tiền</span>
        <span class="col-del"></span>
      </div>

      <div class="items-body">
        <div
          v-for="(item, index) in formData.items"
          :key="index"
          class="item-row"
          :class="{ 'item-row--mobile': isMobile }"
        >
          <!-- Product select -->
          <div class="col-product">
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
                  :label="`${p.name}  [${p.sku}]`"
                  :value="p.id"
                />
              </el-select>
            </el-form-item>
          </div>

          <!-- Quantity -->
          <div class="col-qty">
            <template v-if="isMobile">
              <label class="mobile-label">Số lượng</label>
            </template>
            <el-form-item
              :prop="`items.${index}.quantity`"
              :rules="[
                {
                  required: true,
                  type: 'number',
                  min: 1,
                  message: 'SL ≥ 1',
                  trigger: 'blur',
                },
              ]"
              label-width="0"
            >
              <el-input-number
                v-model="item.quantity"
                :min="1"
                :controls="!isMobile"
                style="width: 100%"
                @change="recalcItem(index)"
              />
            </el-form-item>
          </div>

          <!-- Unit price -->
          <div class="col-price">
            <template v-if="isMobile">
              <label class="mobile-label">Đơn giá (đ)</label>
            </template>
            <el-form-item
              :prop="`items.${index}.unit_price`"
              :rules="[
                {
                  required: true,
                  type: 'number',
                  min: 0,
                  message: 'Nhập đơn giá',
                  trigger: 'blur',
                },
              ]"
              label-width="0"
            >
              <el-input-number
                v-model="item.unit_price"
                :min="0"
                :precision="0"
                :controls="false"
                style="width: 100%"
                @change="recalcItem(index)"
              />
            </el-form-item>
          </div>

          <!-- Line total -->
          <div class="col-total">
            <template v-if="isMobile">
              <label class="mobile-label">Thành tiền</label>
            </template>
            <span class="line-total"
              >{{ formatPrice(item.quantity * item.unit_price) }} đ</span
            >
          </div>

          <!-- Delete -->
          <div class="col-del">
            <el-button
              type="danger"
              :icon="Delete"
              circle
              size="small"
              @click="removeItem(index)"
              :disabled="formData.items.length <= 1"
              plain
            />
          </div>
        </div>
      </div>

      <el-button :icon="Plus" @click="addItem" class="add-item-btn" size="small">
        Thêm sản phẩm
      </el-button>

      <!-- ── Grand total ─────────────────────────────────── -->
      <div class="grand-total">
        <span class="gt-label">Tổng tiền:</span>
        <span class="gt-value">{{ formatPrice(grandTotal) }} đ</span>
      </div>

      <el-divider />

      <!-- ── Ghi chú ──────────────────────────────────────── -->
      <el-form-item label="Ghi chú">
        <el-input
          v-model="formData.notes"
          type="textarea"
          :rows="3"
          placeholder="Ghi chú cho nhà cung cấp..."
          size="large"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" size="large">Hủy</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
          size="large"
        >
          <el-icon style="margin-right: 4px"><Check /></el-icon>
          {{ isEdit ? "Cập nhật" : "Tạo phiếu mua" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { Shop, Delete, Plus, Check } from "@element-plus/icons-vue";
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  getPurchaseOrder,
} from "@/api/purchaseOrder";
import { getSuppliers } from "@/api/supplier";
import { getProducts } from "@/api/product";
import { useResponsive } from "@/composables/useResponsive";

const { isMobile } = useResponsive();

// ── Props & emits ─────────────────────────────────────────
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  purchaseOrderId: { type: [Number, String], default: null },
});
const emit = defineEmits(["update:modelValue", "success"]);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.purchaseOrderId);

// ── State ─────────────────────────────────────────────────
const formRef = ref(null);
const loading = ref(false);
const submitting = ref(false);
const loadingSuppliers = ref(false);
const loadingProducts = ref(false);
const suppliers = ref([]);
const products = ref([]);

const defaultItem = () => ({ product_id: null, quantity: 1, unit_price: 0 });
const defaultForm = () => ({
  supplier_id: null,
  order_date: "",
  expected_date: "",
  notes: "",
  items: [defaultItem()],
});

const formData = reactive(defaultForm());

const formRules = {
  supplier_id: [
    { required: true, message: "Vui lòng chọn nhà cung cấp", trigger: "change" },
  ],
  order_date: [
    { required: true, message: "Vui lòng chọn ngày đặt hàng", trigger: "change" },
  ],
};

// ── Computed ──────────────────────────────────────────────
const grandTotal = computed(() =>
  formData.items.reduce((s, i) => s + (i.quantity || 0) * (i.unit_price || 0), 0)
);

// ── Helpers ───────────────────────────────────────────────
function formatPrice(val) {
  return Number(val || 0).toLocaleString("vi-VN");
}

function addItem() {
  formData.items.push(defaultItem());
}

function removeItem(index) {
  if (formData.items.length > 1) formData.items.splice(index, 1);
}

function recalcItem(/* index */) {
  /* computed handles total */
}

function onProductChange(productId, index) {
  const p = products.value.find((x) => x.id === productId);
  if (p) {
    // Auto-fill cost price if available
    const cost = Number(p.cost_price ?? p.price ?? 0);
    formData.items[index].unit_price = cost;
  }
}

// ── Data loading ──────────────────────────────────────────
async function loadSuppliers() {
  loadingSuppliers.value = true;
  try {
    const res = await getSuppliers({ per_page: 500 });
    suppliers.value = res.data ?? res;
  } catch {
    suppliers.value = [];
  } finally {
    loadingSuppliers.value = false;
  }
}

async function loadProducts() {
  loadingProducts.value = true;
  try {
    const res = await getProducts({ per_page: 500 });
    products.value = res.data ?? res;
  } catch {
    products.value = [];
  } finally {
    loadingProducts.value = false;
  }
}

async function loadPO(id) {
  loading.value = true;
  try {
    const res = await getPurchaseOrder(id);
    const po = res.data ?? res;
    Object.assign(formData, {
      supplier_id: po.supplier_id,
      order_date: po.order_date ?? "",
      expected_date: po.expected_date ?? "",
      notes: po.notes ?? "",
      items: (po.items ?? po.purchase_order_items ?? []).map((i) => ({
        product_id: i.product_id,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
      })),
    });
    if (!formData.items.length) formData.items.push(defaultItem());
  } catch (e) {
    ElMessage.error("Không tải được dữ liệu phiếu mua: " + (e?.message ?? ""));
  }
  loading.value = false;
}

// ── Lifecycle ─────────────────────────────────────────────
async function onOpen() {
  resetForm();
  await Promise.all([loadSuppliers(), loadProducts()]);
  if (isEdit.value) await loadPO(props.purchaseOrderId);
}

// ── Actions ───────────────────────────────────────────────
const handleSubmit = async () => {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    // Map items to the backend field names
    const payload = {
      supplier_id: formData.supplier_id,
      order_date: formData.order_date || undefined,
      expected_date: formData.expected_date || undefined,
      notes: formData.notes || undefined,
      items: formData.items.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
    };

    if (isEdit.value) {
      await updatePurchaseOrder(props.purchaseOrderId, payload);
      ElMessage.success("Cập nhật phiếu mua hàng thành công!");
    } else {
      await createPurchaseOrder(payload);
      ElMessage.success("Tạo phiếu mua hàng thành công!");
    }
    emit("success");
    handleClose();
  } catch (e) {
    const msg = e?.response?.data?.message ?? e?.message ?? "Có lỗi xảy ra";
    ElMessage.error(msg);
  }
  submitting.value = false;
};

const handleClose = () => {
  dialogVisible.value = false;
};

function resetForm() {
  formRef.value?.clearValidate();
  Object.assign(formData, defaultForm());
}
</script>

<style scoped lang="scss">
/* ── Dialog wrapper ───────────────────────────────────────── */
:deep(.po-modal) {
  border-radius: 16px;
  .el-dialog__header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border-lighter, #f0f0f0);
    .el-dialog__title {
      font-size: 18px;
      font-weight: 700;
    }
  }
  .el-dialog__body {
    padding: 24px;
    max-height: 72vh;
    overflow-y: auto;
  }
  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border-lighter, #f0f0f0);
  }

  @media (max-width: 767px) {
    .el-dialog__header {
      padding: 14px 16px;
    }
    .el-dialog__body {
      padding: 14px 16px;
      max-height: calc(100vh - 130px);
    }
    .el-dialog__footer {
      padding: 10px 16px;
      position: sticky;
      bottom: 0;
      background: var(--bg-color, #fff);
    }
  }
}

/* ── Items table ──────────────────────────────────────────── */
.items-header {
  display: grid;
  grid-template-columns: 3fr 1fr 1.6fr 1.4fr 40px;
  gap: 8px;
  padding: 8px 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter, #f9f9f9);
  border-radius: 6px;
  margin-bottom: 6px;

  span {
    padding: 0 4px;
  }
}

.items-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.item-row {
  display: grid;
  grid-template-columns: 3fr 1fr 1.6fr 1.4fr 40px;
  gap: 8px;
  align-items: center;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  &.item-row--mobile {
    grid-template-columns: 1fr;
    border: 1px solid var(--el-border-color, #e4e7ed);
    border-radius: 8px;
    padding: 12px;
    position: relative;

    .col-del {
      position: absolute;
      top: 10px;
      right: 10px;
    }
  }
}

.mobile-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.line-total {
  font-weight: 600;
  color: var(--el-color-primary);
  font-size: 13px;
  padding: 0 4px;
  white-space: nowrap;
}

.add-item-btn {
  margin-top: 4px;
  border-style: dashed !important;
}

/* ── Grand total ──────────────────────────────────────────── */
.grand-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  padding: 14px 8px 4px;
  font-size: 16px;

  .gt-label {
    color: var(--el-text-color-secondary);
    font-weight: 600;
  }
  .gt-value {
    font-size: 22px;
    font-weight: 800;
    color: var(--el-color-primary);
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
    .el-button {
      width: 100%;
      margin: 0;
    }
  }
}
</style>
