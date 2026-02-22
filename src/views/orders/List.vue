<template>
  <div class="orders-container">
    <!-- Desktop Header -->
    <div class="page-header" v-if="!isMobile">
      <div>
        <h1 class="page-title">Quản lý đơn hàng</h1>
        <p class="page-description">Danh sách tất cả đơn hàng trong hệ thống</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateModal"
        >Tạo đơn hàng</el-button
      >
    </div>

    <!-- Mobile Header -->
    <div class="mobile-header" v-else>
      <h2 class="mobile-title">Đơn hàng</h2>
    </div>

    <!-- Search & Filter -->
    <el-card class="mb-md search-card">
      <el-form :inline="!isMobile" :model="searchForm" class="search-form">
        <el-form-item label="Tìm kiếm">
          <el-input
            v-model="searchForm.search"
            placeholder="Mã đơn hàng..."
            :prefix-icon="Search"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="Trạng thái">
          <el-select
            v-model="searchForm.status"
            placeholder="Tất cả"
            clearable
            style="min-width: 150px"
            @change="handleSearch"
          >
            <el-option
              v-for="s in statusOptions"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button type="primary" :icon="Search" @click="handleSearch"
            >Tìm kiếm</el-button
          >
          <el-button :icon="Refresh" @click="handleReset">Đặt lại</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Desktop Table -->
    <el-card v-if="!isMobile">
      <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
        <el-table-column prop="order_code" label="Mã đơn hàng" min-width="140">
          <template #default="{ row }">
            <el-tag type="info">{{ row.order_code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Khách hàng" min-width="160">
          <template #default="{ row }">
            {{ row.customer?.name ?? '—' }}
          </template>
        </el-table-column>
        <el-table-column prop="order_date" label="Ngày đặt" width="120" />
        <el-table-column label="Tổng tiền (VNĐ)" width="160" align="right">
          <template #default="{ row }">
            {{ formatPrice(row.total_amount) }}
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="info" size="small" :icon="View" link @click="goDetail(row)"
              >Chi tiết</el-button
            >
            <el-button
              type="primary"
              size="small"
              :icon="Edit"
              link
              @click="openEditModal(row)"
              >Sửa</el-button
            >
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              link
              @click="handleDelete(row)"
              >Xóa</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- Mobile Cards -->
    <div v-else class="order-cards" v-loading="loading">
      <MobileCard
        v-for="order in tableData"
        :key="order.id"
        :title="order.order_code"
        :icon="Document"
        :badge="{ text: statusLabel(order.status), type: statusType(order.status) }"
        :actions="cardActions"
        @action="(cmd) => handleCardAction(cmd, order)"
      >
        <CardInfoRow :icon="User" :value="order.customer?.name ?? '—'" />
        <CardInfoRow :icon="Calendar" :value="order.order_date" />
        <CardInfoRow :icon="Money" :value="formatPrice(order.total_amount) + ' VNĐ'" />
      </MobileCard>

      <div class="mobile-pagination" v-if="tableData.length > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          layout="prev, pager, next"
          size="small"
          @current-change="handlePageChange"
        />
      </div>

      <div v-if="tableData.length === 0 && !loading" class="empty-state">
        <el-empty description="Không có đơn hàng" />
      </div>
    </div>

    <!-- FAB -->
    <el-button
      v-if="isMobile"
      type="primary"
      :icon="Plus"
      circle
      size="large"
      class="fab-button"
      @click="openCreateModal"
    />

    <!-- Form Modal -->
    <OrderFormModal
      v-model="showModal"
      :order-id="selectedOrderId"
      @success="handleModalSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Edit,
  Delete,
  Search,
  Refresh,
  View,
  Document,
  User,
  Calendar,
  Money,
} from "@element-plus/icons-vue";
import { getOrders, deleteOrder } from "@/api/order";
import OrderFormModal from "@/components/orders/OrderFormModal.vue";
import { useResponsive } from "@/composables/useResponsive";
import MobileCard from "@/components/common/MobileCard.vue";
import CardInfoRow from "@/components/common/CardInfoRow.vue";

const router = useRouter();
const { isMobile } = useResponsive();

const loading = ref(false);
const tableData = ref([]);
const showModal = ref(false);
const selectedOrderId = ref(null);

const searchForm = reactive({ search: "", status: "" });
const pagination = reactive({ page: 1, pageSize: 10, total: 0 });

const statusOptions = [
  { label: "Chờ xử lý", value: "pending" },
  { label: "Đang xử lý", value: "processing" },
  { label: "Hoàn thành", value: "completed" },
  { label: "Đã hủy", value: "cancelled" },
];

const statusLabel = (s) => statusOptions.find((o) => o.value === s)?.label ?? s;
const statusType = (s) => {
  const map = {
    pending: "warning",
    processing: "primary",
    completed: "success",
    cancelled: "danger",
  };
  return map[s] ?? "info";
};
const formatPrice = (val) => Number(val || 0).toLocaleString("vi-VN");

const cardActions = [
  { command: "view", label: "Chi tiết", icon: View },
  { command: "edit", label: "Sửa", icon: Edit, divided: true },
  { command: "delete", label: "Xóa", icon: Delete, divided: true },
];

const fetchOrders = async () => {
  loading.value = true;
  try {
    const params = { page: pagination.page, per_page: pagination.pageSize };
    if (searchForm.search) params.search = searchForm.search;
    if (searchForm.status) params.status = searchForm.status;
    const res = await getOrders(params);
    tableData.value = res.data ?? [];
    pagination.total = res.total ?? res.data?.length ?? 0;
  } catch (err) {
    ElMessage.error(err.response?.data?.message || "Tải dữ liệu thất bại");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  fetchOrders();
};
const handleReset = () => {
  searchForm.search = "";
  searchForm.status = "";
  pagination.page = 1;
  fetchOrders();
};
const handleSizeChange = () => {
  pagination.page = 1;
  fetchOrders();
};
const handlePageChange = () => fetchOrders();

const goDetail = (row) => router.push(`/orders/${row.id}`);
const openCreateModal = () => {
  selectedOrderId.value = null;
  showModal.value = true;
};
const openEditModal = (row) => {
  selectedOrderId.value = row.id;
  showModal.value = true;
};
const handleModalSuccess = () => fetchOrders();

const handleCardAction = (cmd, order) => {
  if (cmd === "view") goDetail(order);
  else if (cmd === "edit") openEditModal(order);
  else if (cmd === "delete") handleDelete(order);
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`Xóa đơn hàng "${row.order_code}"?`, "Xác nhận", {
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      type: "warning",
    });
    await deleteOrder(row.id);
    ElMessage.success("Xóa đơn hàng thành công");
    fetchOrders();
  } catch (err) {
    if (err !== "cancel") ElMessage.error(err.response?.data?.message || "Xóa thất bại");
  }
};

onMounted(() => fetchOrders());
</script>

<style scoped lang="scss">
.orders-container {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .page-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  .page-description {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
  }

  .mobile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .mobile-title {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
    }
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .fab-button {
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 100;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  .empty-state {
    display: flex;
    justify-content: center;
    padding: 40px 0;
  }

  .mobile-pagination {
    display: flex;
    justify-content: center;
    margin-top: 12px;
  }
}
</style>
