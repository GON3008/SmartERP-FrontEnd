<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'"
    :width="isMobile ? '100%' : '640px'"
    :fullscreen="isMobile"
    :close-on-click-modal="true"
    @close="handleClose"
    class="product-modal"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-width="isMobile ? '100%' : '150px'"
      :label-position="isMobile ? 'top' : 'left'"
      class="product-form"
      v-loading="loading"
    >
      <!-- Mã sản phẩm -->
      <el-form-item label="Mã sản phẩm" prop="sku">
        <el-input
          v-model="formData.sku"
          placeholder="VD: SP-001"
          clearable
          size="large"
          :disabled="isEdit"
        >
          <template #prefix>
            <el-icon><Ticket /></el-icon>
          </template>
        </el-input>
        <div class="field-hint" v-if="isEdit">
          Mã sản phẩm không thể thay đổi sau khi tạo
        </div>
      </el-form-item>

      <!-- Tên sản phẩm -->
      <el-form-item label="Tên sản phẩm" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="Nhập tên sản phẩm"
          clearable
          size="large"
        />
      </el-form-item>

      <!-- Danh mục -->
      <el-form-item label="Danh mục" prop="category">
        <el-select
          v-model="formData.category"
          placeholder="Chọn danh mục"
          size="large"
          clearable
          filterable
          allow-create
          style="width: 100%"
        >
          <el-option
            v-for="cat in categoryOptions"
            :key="cat.value"
            :label="cat.label"
            :value="cat.value"
          />
        </el-select>
      </el-form-item>

      <!-- Đơn vị -->
      <el-form-item label="Đơn vị tính" prop="unit">
        <el-select
          v-model="formData.unit"
          placeholder="Chọn đơn vị"
          size="large"
          clearable
          filterable
          allow-create
          style="width: 100%"
        >
          <el-option
            v-for="unit in unitOptions"
            :key="unit.value"
            :label="unit.label"
            :value="unit.value"
          />
        </el-select>
      </el-form-item>

      <!-- Giá bán -->
      <el-form-item label="Giá bán (VNĐ)" prop="price">
        <el-input-number
          v-model="formData.price"
          :min="0"
          :precision="0"
          :step="1000"
          :controls="false"
          size="large"
          style="width: 100%"
          placeholder="Nhập giá bán"
        />
      </el-form-item>

      <!-- Số lượng tối thiểu -->
      <el-form-item label="Tồn kho tối thiểu" prop="min_stock">
        <el-input-number
          v-model="formData.min_stock"
          :min="0"
          :precision="0"
          :controls="false"
          size="large"
          style="width: 100%"
          placeholder="Nhập số lượng tồn kho tối thiểu"
        />
      </el-form-item>

      <!-- Mô tả -->
      <!-- <el-form-item label="Mô tả" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="Nhập mô tả sản phẩm (tuỳ chọn)"
          maxlength="500"
          show-word-limit
        />
      </el-form-item> -->
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
          {{ isEdit ? "Cập nhật" : "Thêm mới" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { Ticket } from "@element-plus/icons-vue";
import { createProduct, updateProduct, getProduct } from "@/api/product";
import { useResponsive } from "@/composables/useResponsive";

const { isMobile } = useResponsive();

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  productId: {
    type: [Number, String],
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "success"]);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.productId);

const formRef = ref(null);
const loading = ref(false);
const submitting = ref(false);

const defaultForm = () => ({
  sku: "",
  name: "",
  category: "",
  unit: "",
  price: 0,
  min_stock: 0,
  description: "",
});

const formData = reactive(defaultForm());

const categoryOptions = [
  { label: "Điện tử", value: "Điện tử" },
  { label: "Phần mềm", value: "Phần mềm" },
  { label: "Văn phòng phẩm", value: "Văn phòng phẩm" },
  { label: "Thực phẩm", value: "Thực phẩm" },
  { label: "Thời trang", value: "Thời trang" },
  { label: "Khác", value: "Khác" },
];

const unitOptions = [
  { label: "Cái", value: "Cái" },
  { label: "Chiếc", value: "Chiếc" },
  { label: "Hộp", value: "Hộp" },
  { label: "Kg", value: "Kg" },
  { label: "Lít", value: "Lít" },
  { label: "Thùng", value: "Thùng" },
  { label: "Bộ", value: "Bộ" },
  { label: "Gói", value: "Gói" },
];

const formRules = {
  // sku: [
  //   { required: true, message: "Vui lòng nhập mã sản phẩm", trigger: "blur" },
  //   { min: 2, max: 50, message: "Mã sản phẩm từ 2 đến 50 ký tự", trigger: "blur" },
  // ],
  name: [
    { required: true, message: "Vui lòng nhập tên sản phẩm", trigger: "blur" },
    { min: 2, max: 200, message: "Tên sản phẩm từ 2 đến 200 ký tự", trigger: "blur" },
  ],
  category: [{ required: true, message: "Vui lòng chọn danh mục", trigger: "change" }],
  unit: [{ required: true, message: "Vui lòng chọn đơn vị tính", trigger: "change" }],
  price: [
    { required: true, message: "Vui lòng nhập giá bán", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value === null || value === undefined || value === "") {
          callback(new Error("Vui lòng nhập giá bán"));
        } else if (value < 0) {
          callback(new Error("Giá bán không được âm"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  min_stock: [
    {
      validator: (rule, value, callback) => {
        if (value < 0) {
          callback(new Error("Tồn kho tối thiểu không được âm"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

// Chỉ dùng 1 watch duy nhất để tránh double request
// Vue batch cả dialogVisible + productId cùng tick → 2 watch cùng fire
watch(dialogVisible, (newVal) => {
  if (newVal) {
    // Dialog vừa mở
    if (props.productId) {
      loadProductData(props.productId);
    } else {
      resetForm();
    }
  } else {
    // Dialog vừa đóng
    resetForm();
  }
});

const loadProductData = async (id) => {
  loading.value = true;
  try {
    const response = await getProduct(id);
    const product = response.data;
    Object.assign(formData, {
      sku: product.sku || "",
      name: product.name || "",
      category: product.category || "",
      unit: product.unit || "",
      price: product.price ? Math.round(Number(product.price)) : 0,
      min_stock: product.min_stock || 0,
      description: product.description || "",
    });
  } catch (error) {
    console.error("Load product error:", error);
    ElMessage.error("Tải dữ liệu sản phẩm thất bại");
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      if (isEdit.value) {
        await updateProduct(props.productId, formData);
        ElMessage.success("Cập nhật sản phẩm thành công");
      } else {
        await createProduct(formData);
        ElMessage.success("Thêm sản phẩm thành công");
      }

      emit("success");
      handleClose();
    } catch (error) {
      console.error("Submit product error:", error);
      ElMessage.error(error.response?.data?.message || "Lưu dữ liệu thất bại");
    } finally {
      submitting.value = false;
    }
  });
};

const handleClose = () => {
  dialogVisible.value = false;
};

const resetForm = () => {
  formRef.value?.resetFields();
  Object.assign(formData, defaultForm());
};
</script>

<style scoped lang="scss">
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

.field-hint {
  font-size: 12px;
  color: var(--el-color-info);
  margin-top: 4px;
  line-height: 1.4;
}

:deep(.product-modal) {
  @media (max-width: 767px) {
    .el-dialog__header {
      padding: 16px;
      border-bottom: 1px solid var(--el-border-color-light);
    }

    .el-dialog__body {
      padding: 16px;
      max-height: calc(100vh - 140px);
      overflow-y: auto;
    }

    .el-dialog__footer {
      padding: 16px;
      border-top: 1px solid var(--el-border-color-light);
      position: sticky;
      bottom: 0;
      background: var(--el-bg-color);
    }
  }
}

.product-form {
  @media (max-width: 767px) {
    :deep(.el-form-item__label) {
      margin-bottom: 6px;
      font-weight: 500;
    }

    :deep(.el-input__inner),
    :deep(.el-input-number .el-input__inner) {
      min-height: 44px;
    }

    :deep(.el-select) {
      width: 100%;
    }
  }
}
</style>
