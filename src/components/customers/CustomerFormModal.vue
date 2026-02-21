<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'"
    :width="isMobile ? '100%' : '600px'"
    :fullscreen="isMobile"
    :close-on-click-modal="true"
    @close="handleClose"
    class="customer-modal"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-width="isMobile ? '100%' : '140px'"
      :label-position="isMobile ? 'top' : 'left'"
      class="customer-form"
    >
      <el-form-item label="Tên khách hàng" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="Nhập tên khách hàng"
          clearable
          size="large"
        />
      </el-form-item>

      <el-form-item label="Email" prop="email">
        <el-input
          v-model="formData.email"
          type="email"
          placeholder="Nhập email"
          clearable
          size="large"
        />
      </el-form-item>

      <el-form-item label="Số điện thoại" prop="phone">
        <el-input
          v-model="formData.phone"
          placeholder="Nhập số điện thoại"
          clearable
          size="large"
        />
      </el-form-item>

      <el-form-item label="Địa chỉ" prop="address">
        <el-input
          v-model="formData.address"
          type="textarea"
          :rows="3"
          placeholder="Nhập địa chỉ"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" size="large">Hủy</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit" size="large">
          {{ isEdit ? "Cập nhật" : "Thêm mới" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { createCustomer, updateCustomer, getCustomer } from "@/api/customer";
import { useResponsive } from "@/composables/useResponsive";

const { isMobile } = useResponsive();

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  customerId: {
    type: [Number, String],
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "success"]);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.customerId);

const formRef = ref(null);
const loading = ref(false);

const formData = reactive({
  name: "",
  email: "",
  phone: "",
  address: "",
  status: "active",
});

const formRules = {
  name: [{ required: true, message: "Vui lòng nhập tên khách hàng", trigger: "blur" }],
  email: [
    { required: true, message: "Vui lòng nhập email", trigger: "blur" },
    { type: "email", message: "Email không hợp lệ", trigger: "blur" },
  ],
  phone: [{ required: true, message: "Vui lòng nhập số điện thoại", trigger: "blur" }],
};

// Load dữ liệu khi edit
watch(
  () => props.customerId,
  async (newId) => {
    if (newId && dialogVisible.value) {
      await loadCustomerData(newId);
    }
  },
  { immediate: true }
);

watch(dialogVisible, (newVal) => {
  if (newVal && props.customerId) {
    loadCustomerData(props.customerId);
  } else if (!newVal) {
    resetForm();
  }
});

const loadCustomerData = async (id) => {
  loading.value = true;
  try {
    const response = await getCustomer(id);
    Object.assign(formData, {
      name: response.data.name,
      email: response.data.email,
      phone: response.data.phone,
      address: response.data.address,
    });
  } catch (error) {
    console.error("Load customer error:", error);
    ElMessage.error("Tải dữ liệu khách hàng thất bại");
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        if (isEdit.value) {
          await updateCustomer(props.customerId, formData);
          ElMessage.success("Cập nhật khách hàng thành công");
        } else {
          await createCustomer(formData);
          ElMessage.success("Thêm khách hàng thành công");
        }

        emit("success");
        handleClose();
      } catch (error) {
        console.error("Submit error:", error);
        ElMessage.error(error.response?.data?.message || "Lưu dữ liệu thất bại");
      } finally {
        loading.value = false;
      }
    }
  });
};

const handleClose = () => {
  dialogVisible.value = false;
};

const resetForm = () => {
  formRef.value?.resetFields();
  Object.assign(formData, {
    name: "",
    email: "",
    phone: "",
    address: "",
  });
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

// Mobile full-screen modal
:deep(.customer-modal) {
  @media (max-width: 767px) {
    .el-dialog__header {
      padding: 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .el-dialog__body {
      padding: 16px;
      max-height: calc(100vh - 140px);
      overflow-y: auto;
    }

    .el-dialog__footer {
      padding: 16px;
      border-top: 1px solid #f0f0f0;
      position: sticky;
      bottom: 0;
      background: #fff;
    }
  }
}

// Form responsive
.customer-form {
  @media (max-width: 767px) {
    :deep(.el-form-item__label) {
      margin-bottom: 8px;
      font-weight: 500;
    }

    :deep(.el-input__inner) {
      min-height: 44px;
    }

    :deep(.el-textarea__inner) {
      min-height: 88px;
    }

    :deep(.el-radio) {
      margin-right: 20px;
      height: 44px;
      display: inline-flex;
      align-items: center;
    }
  }
}
</style>
