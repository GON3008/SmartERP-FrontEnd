<template>
  <div class="det-container" v-loading="loading">
    <!-- Header -->
    <div class="det-header">
      <div class="det-header__left">
        <el-button :icon="ArrowLeft" @click="$router.back()" text>Quay lại</el-button>
        <div class="det-header__info" v-if="inv.id">
          <h1 class="det-title">{{ inv.invoice_code || "—" }}</h1>
          <el-tag :type="statusType(inv.status)" effect="light" round>{{
            statusLabel(inv.status)
          }}</el-tag>
        </div>
      </div>
      <div class="det-header__actions" v-if="inv.id">
        <template v-if="inv.status === 'draft'">
          <el-button
            type="success"
            :icon="Promotion"
            :loading="saving"
            @click="handleSend"
            >Gửi hóa đơn</el-button
          >
          <el-button type="danger" :icon="Delete" :loading="saving" @click="handleDelete"
            >Xóa</el-button
          >
        </template>
        <template v-if="['sent', 'unpaid', 'partial', 'overdue'].includes(inv.status)">
          <el-button type="primary" :icon="CreditCard" @click="showPayForm = true"
            >Ghi nhận TT</el-button
          >
          <el-button
            v-if="inv.status !== 'overdue'"
            type="warning"
            :icon="CircleClose"
            :loading="saving"
            @click="handleCancel"
            >Hủy HĐ</el-button
          >
        </template>
      </div>
    </div>

    <!-- Not found -->
    <el-result v-if="!loading && !inv.id" icon="error" title="Không tìm thấy hóa đơn">
      <template #extra>
        <el-button type="primary" @click="$router.push('/invoices')"
          >Về danh sách</el-button
        >
      </template>
    </el-result>

    <template v-if="inv.id">
      <!-- Stat cards -->
      <el-row :gutter="14" class="det-stats">
        <el-col :xs="12" :sm="6">
          <div
            class="scard"
            style="background: linear-gradient(135deg, #667eea, #764ba2)"
          >
            <el-icon class="scard__icon"><Money /></el-icon>
            <div>
              <div class="scard__val">{{ fmt(inv.total_amount) }}</div>
              <div class="scard__lbl">Tổng cộng (₫)</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div
            class="scard"
            style="background: linear-gradient(135deg, #11998e, #38ef7d)"
          >
            <el-icon class="scard__icon"><Wallet /></el-icon>
            <div>
              <div class="scard__val">{{ fmt(paidAmount) }}</div>
              <div class="scard__lbl">Đã thanh toán (₫)</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div
            class="scard"
            style="background: linear-gradient(135deg, #f093fb, #f5576c)"
          >
            <el-icon class="scard__icon"><Warning /></el-icon>
            <div>
              <div class="scard__val">{{ fmt(remaining) }}</div>
              <div class="scard__lbl">Còn lại (₫)</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div
            class="scard"
            style="background: linear-gradient(135deg, #4facfe, #00f2fe)"
          >
            <el-icon class="scard__icon"><CreditCard /></el-icon>
            <div>
              <div class="scard__val">{{ (inv.payments || []).length }}</div>
              <div class="scard__lbl">Lần TT</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <!-- Left: invoice info -->
        <el-col :xs="24" :md="10">
          <el-card shadow="never" class="det-card">
            <template #header>
              <span class="det-card__title"
                ><el-icon><Document /></el-icon> Thông tin hóa đơn</span
              >
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="Mã HĐ">
                <span class="mono-code">{{ inv.invoice_code }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="Khách hàng">
                <el-icon style="vertical-align: -2px; margin-right: 4px"
                  ><User
                /></el-icon>
                <span>{{ inv.customer?.name || "—" }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="Đơn hàng">
                <el-link
                  v-if="inv.order?.id"
                  type="primary"
                  underline="hover"
                  @click="router.push(`/orders/${inv.order.id}`)"
                >
                  #{{ inv.order.order_code ?? inv.order.id }}
                </el-link>
                <span v-else>—</span>
              </el-descriptions-item>
              <el-descriptions-item label="Ngày HĐ">
                <el-icon style="vertical-align: -2px; margin-right: 4px; color: #6b7280"
                  ><Calendar /></el-icon
                >{{ inv.invoice_date || "—" }}
              </el-descriptions-item>
              <el-descriptions-item label="Hạn TT">
                <el-icon style="vertical-align: -2px; margin-right: 4px; color: #6b7280"
                  ><Timer
                /></el-icon>
                <span :class="isOverdue ? 'text-danger' : ''">{{
                  inv.due_date || "—"
                }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="Tạm tính"
                >{{ fmt(inv.subtotal) }} ₫</el-descriptions-item
              >
              <el-descriptions-item label="Thuế"
                >{{ inv.tax_rate }}% →
                <strong>{{ fmt(inv.tax_amount) }} ₫</strong></el-descriptions-item
              >
              <el-descriptions-item label="Tổng cộng">
                <strong class="text-warning" style="font-size: 1.1rem"
                  >{{ fmt(inv.total_amount) }} ₫</strong
                >
              </el-descriptions-item>
              <el-descriptions-item label="Ghi chú">{{
                inv.notes || "—"
              }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <!-- Right: payment history -->
        <el-col :xs="24" :md="14">
          <el-card shadow="never" class="det-card">
            <template #header>
              <div class="det-card__head">
                <span class="det-card__title"
                  ><el-icon><CreditCard /></el-icon> Lịch sử thanh toán</span
                >
                <el-tag type="info" size="small"
                  >{{ (inv.payments || []).length }} lần</el-tag
                >
              </div>
            </template>
            <el-table :data="inv.payments || []" stripe size="small">
              <el-table-column label="Mã TT" width="150">
                <template #default="{ row }"
                  ><span class="mono-code">{{ row.payment_code }}</span></template
                >
              </el-table-column>
              <el-table-column label="Số tiền" width="150" align="right">
                <template #default="{ row }"
                  ><span class="text-primary fw-700"
                    >{{ fmt(row.amount) }} ₫</span
                  ></template
                >
              </el-table-column>
              <el-table-column label="Phương thức" width="130">
                <template #default="{ row }">{{
                  methodLabel(row.payment_method)
                }}</template>
              </el-table-column>
              <el-table-column prop="payment_date" label="Ngày TT" width="110" />
              <el-table-column
                prop="reference"
                label="Tham chiếu"
                show-overflow-tooltip
              />
            </el-table>
            <el-empty
              v-if="!inv.payments?.length"
              description="Chưa có thanh toán nào"
              :image-size="70"
            />

            <!-- Payment summary bar -->
            <div class="pay-summary" v-if="inv.total_amount">
              <div class="pay-summary__row">
                <span>Tổng</span><strong>{{ fmt(inv.total_amount) }} ₫</strong>
              </div>
              <div class="pay-summary__row">
                <span>Đã TT</span
                ><strong class="text-success">{{ fmt(paidAmount) }} ₫</strong>
              </div>
              <div class="pay-summary__row pay-summary__row--total">
                <span>Còn lại</span>
                <strong :class="remaining > 0 ? 'text-danger' : 'text-success'"
                  >{{ fmt(remaining) }} ₫</strong
                >
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- Payment dialog -->
    <el-dialog
      v-model="showPayForm"
      title="💳 Ghi nhận thanh toán"
      :width="isMobile ? '100%' : '480px'"
      :fullscreen="isMobile"
    >
      <el-form
        ref="payFormRef"
        :model="payForm"
        :label-width="isMobile ? '100%' : '130px'"
        :label-position="isMobile ? 'top' : 'left'"
      >
        <el-form-item
          label="Số tiền"
          prop="amount"
          :rules="[{ required: true, message: 'Nhập số tiền', trigger: 'blur' }]"
        >
          <el-input-number
            v-model="payForm.amount"
            :min="1"
            :max="remaining"
            :precision="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Phương thức">
          <el-select v-model="payForm.payment_method" style="width: 100%">
            <el-option label="💵 Tiền mặt" value="cash" />
            <el-option label="🏦 Chuyển khoản" value="bank_transfer" />
            <el-option label="💳 Thẻ" value="card" />
            <el-option label="📋 Khác" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="Ngày TT">
          <el-date-picker
            v-model="payForm.payment_date"
            type="date"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Mã tham chiếu">
          <el-input v-model="payForm.reference" clearable placeholder="VD: TK1234" />
        </el-form-item>
        <el-form-item label="Ghi chú">
          <el-input v-model="payForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPayForm = false">Hủy</el-button>
        <el-button type="primary" :loading="saving" @click="handlePaySubmit"
          >Ghi nhận</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Document,
  User,
  Calendar,
  Timer,
  CreditCard,
  CircleClose,
  Promotion,
  Delete,
  Money,
  Wallet,
  Warning,
} from "@element-plus/icons-vue";
import { getInvoice, sendInvoice, cancelInvoice, deleteInvoice } from "@/api/invoice";
import { createPayment } from "@/api/payment";
import { useResponsive } from "@/composables/useResponsive";

const route = useRoute();
const router = useRouter();
const { isMobile } = useResponsive();

const loading = ref(false);
const saving = ref(false);
const inv = ref({});
const showPayForm = ref(false);
const payFormRef = ref(null);
const payForm = ref({
  amount: 0,
  payment_method: "cash",
  payment_date: "",
  reference: "",
  notes: "",
});

const fmt = (v) => Number(v || 0).toLocaleString("vi-VN");
const statusType = (s) =>
  ({
    draft: "info",
    sent: "warning",
    unpaid: "warning",
    paid: "success",
    partial: "",
    overdue: "danger",
    cancelled: "info",
  }[s] || "info");
const statusLabel = (s) =>
  ({
    draft: "Nháp",
    sent: "Đã gửi",
    unpaid: "Chưa TT",
    paid: "Đã TT",
    partial: "TT 1 phần",
    overdue: "Quá hạn",
    cancelled: "Đã hủy",
  }[s] || s);
const methodLabel = (m) =>
  ({ cash: "Tiền mặt", bank_transfer: "Chuyển khoản", card: "Thẻ", other: "Khác" }[m] ||
  m);

const paidAmount = computed(() =>
  (inv.value.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0)
);
const remaining = computed(() =>
  Math.max(0, Number(inv.value.total_amount || 0) - paidAmount.value)
);
const isOverdue = computed(
  () =>
    inv.value.due_date &&
    new Date(inv.value.due_date) < new Date() &&
    inv.value.status !== "paid"
);

const load = async () => {
  loading.value = true;
  try {
    const res = await getInvoice(route.params.id);
    inv.value = res.data ?? res;
    payForm.value.amount = remaining.value || Number(inv.value.total_amount || 0);
  } catch {
    ElMessage.error("Không tải được hóa đơn");
  }
  loading.value = false;
};

const handleSend = async () => {
  saving.value = true;
  try {
    const r = await sendInvoice(inv.value.id);
    inv.value = r.data ?? r;
    ElMessage.success("Đã gửi hóa đơn!");
  } catch (e) {
    ElMessage.error(e.response?.data?.message || "Có lỗi");
  }
  saving.value = false;
};

const handleCancel = async () => {
  try {
    await ElMessageBox.confirm("Hủy hóa đơn này?", "Xác nhận", {
      type: "warning",
      confirmButtonText: "Hủy HĐ",
      cancelButtonText: "Thôi",
    });
    saving.value = true;
    const r = await cancelInvoice(inv.value.id);
    inv.value = r.data ?? r;
    ElMessage.success("Đã hủy hóa đơn!");
  } catch (e) {
    if (e !== "cancel") ElMessage.error(e.response?.data?.message || "Có lỗi");
  }
  saving.value = false;
};

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm("Xóa hóa đơn nháp này?", "Xác nhận", {
      type: "error",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });
    saving.value = true;
    await deleteInvoice(inv.value.id);
    ElMessage.success("Đã xóa hóa đơn!");
    router.push("/invoices");
  } catch (e) {
    if (e !== "cancel") ElMessage.error(e.response?.data?.message || "Có lỗi");
  }
  saving.value = false;
};

const handlePaySubmit = async () => {
  await payFormRef.value?.validate(async (valid) => {
    if (!valid) return;
    saving.value = true;
    try {
      await createPayment({
        payable_type: "App\\Models\\Invoice",
        payable_id: inv.value.id,
        ...payForm.value,
      });
      ElMessage.success("Ghi nhận thanh toán thành công!");
      showPayForm.value = false;
      await load();
    } catch (e) {
      ElMessage.error(e.response?.data?.message || "Có lỗi");
    }
    saving.value = false;
  });
};

onMounted(load);
</script>

<style scoped lang="scss">
@import "@/views/finance/_detail-shared.scss";
</style>
