<template>
  <div class="products-container">
    <div class="page-header" v-if="!isMobile">
      <div>
        <h1 class="page-title">Quản lý sản phẩm</h1>
        <p class="page-description">Danh sách tất cả sản phẩm trong hệ thống</p>
      </div>
      <div class="header-actions">
        <el-button :icon="Warning" @click="router.push('/products/low-stock')">
          Tồn kho thấp
        </el-button>
        <el-button type="primary" :icon="Plus" @click="handleCreate">
          Thêm sản phẩm
        </el-button>
      </div>
    </div>

    <!-- Mobile Header -->
    <div class="mobile-header" v-else>
      <h2 class="mobile-title">Sản phẩm</h2>
    </div>

    <!-- Search and Filter -->
    <el-card class="mb-md search-card">
      <el-form :inline="!isMobile" :model="searchForm" class="search-form">
        <el-form-item label="Tìm kiếm" class="search-input">
          <el-input
            v-model="searchForm.keyword"
            placeholder="Tên sản phẩm, mã SKU..."
            :prefix-icon="Search"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button type="primary" :icon="Search" @click="handleSearch">
            Tìm kiếm
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">Đặt lại</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Desktop Table -->
    <el-card v-if="!isMobile">
      <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
        <el-table-column prop="sku" label="Mã sản phẩm" min-width="140" />
        <el-table-column prop="name" label="Tên sản phẩm" min-width="200" />
        <el-table-column prop="category" label="Danh mục" min-width="140" />
        <el-table-column prop="unit" label="Đơn vị" width="100" />
        <el-table-column prop="price" label="Giá (VNĐ)" width="150">
          <template #default="{ row }">
            {{ Number(row.price).toLocaleString("vi-VN") }}
          </template>
        </el-table-column>
        <el-table-column
          prop="min_stock"
          label="Tồn kho tối thiểu"
          width="155"
          align="center"
        />
        <el-table-column label="Thao tác" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="info"
              size="small"
              :icon="View"
              link
              @click="router.push(`/products/${row.id}`)"
            >
              Chi tiết
            </el-button>
            <el-button
              type="primary"
              size="small"
              :icon="Edit"
              link
              @click="handleEdit(row)"
            >
              Sửa
            </el-button>
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              link
              @click="handleDelete(row)"
            >
              Xóa
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- Mobile Cards View -->
    <div v-else class="product-cards" v-loading="loading">
      <MobileCard
        v-for="product in tableData"
        :key="product.id"
        :title="product.name"
        :icon="Goods"
        :actions="cardActions"
        @action="(cmd) => handleCardAction(cmd, product)"
      >
        <CardInfoRow :icon="Menu" :value="product.category" />
        <CardInfoRow :icon="ScaleToOriginal" :value="product.unit" />
        <CardInfoRow
          :icon="Money"
          :value="Number(product.price).toLocaleString('vi-VN') + ' VNĐ'"
        />
        <CardInfoRow :icon="Warning" :value="'Tối thiểu: ' + product.min_stock" />
      </MobileCard>

      <!-- Mobile Pagination -->
      <div class="mobile-pagination" v-if="tableData.length > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="prev, pager, next"
          size="small"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <el-empty description="Không có sản phẩm" />
      </div>
    </div>

    <!-- Mobile FAB Button -->
    <el-button
      v-if="isMobile"
      type="primary"
      :icon="Plus"
      circle
      size="large"
      class="fab-button"
      @click="handleCreate"
    />

    <!-- Product Form Modal -->
    <ProductFormModal
      v-model="showModal"
      :product-id="selectedProductId"
      @success="handleModalSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useI18n } from "vue-i18n";
import {
  Plus,
  Edit,
  Delete,
  Search,
  Refresh,
  Goods,
  Menu,
  ScaleToOriginal,
  Money,
  Warning,
  View,
} from "@element-plus/icons-vue";
import { getProducts, deleteProduct } from "@/api/product";
import ProductFormModal from "@/components/products/ProductFormModal.vue";
import { useResponsive } from "@/composables/useResponsive";
import MobileCard from "@/components/common/MobileCard.vue";
import CardInfoRow from "@/components/common/CardInfoRow.vue";

const { t } = useI18n();
const router = useRouter();
const { isMobile } = useResponsive();

const loading = ref(false);
const tableData = ref([]);
const showModal = ref(false);
const selectedProductId = ref(null);

const searchForm = reactive({
  keyword: "",
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// Card actions for MobileCard dropdown
const cardActions = [
  { command: "view", label: "Chi tiết", icon: View },
  { command: "edit", label: "Sửa", icon: Edit, divided: true },
  { command: "delete", label: "Xóa", icon: Delete, divided: true },
];

/**
 * Lấy danh sách sản phẩm từ API
 */
const fetchProducts = async () => {
  try {
    loading.value = true;
    const params = {
      page: pagination.page,
      per_page: pagination.pageSize,
    };
    if (searchForm.keyword) {
      params.search = searchForm.keyword;
    }
    const response = await getProducts(params);

    if (response.data) {
      tableData.value = response.data.map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        unit: product.unit,
        price: product.price,
        min_stock: product.min_stock,
      }));
      pagination.total = response.total || response.data.length;
    }
  } catch (error) {
    console.error("Fetch products error:", error);
    ElMessage.error(error.response?.data?.message || "Tải dữ liệu thất bại");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  fetchProducts();
};

const handleReset = () => {
  searchForm.keyword = "";
  pagination.page = 1;
  fetchProducts();
};

const handleCreate = () => {
  selectedProductId.value = null;
  showModal.value = true;
};

const handleEdit = (row) => {
  selectedProductId.value = row.id;
  showModal.value = true;
};

const handleCardAction = (command, product) => {
  if (command === "view") router.push(`/products/${product.id}`);
  else if (command === "edit") handleEdit(product);
  else if (command === "delete") handleDelete(product);
};

const handleModalSuccess = () => {
  fetchProducts();
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa sản phẩm "${row.name}"?`,
      "Xác nhận xóa",
      {
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        type: "warning",
      }
    );
    await deleteProduct(row.id);
    ElMessage.success("Xóa sản phẩm thành công");
    fetchProducts();
  } catch (error) {
    if (error !== "cancel") {
      console.error("Delete product error:", error);
      ElMessage.error(error.response?.data?.message || "Xóa sản phẩm thất bại");
    }
  }
};

const handleSizeChange = () => {
  pagination.page = 1;
  fetchProducts();
};

const handlePageChange = () => {
  fetchProducts();
};

onMounted(() => {
  fetchProducts();
});
</script>

<style scoped lang="scss">
.products-container {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .page-title {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  .page-description {
    font-size: 16px;
    color: var(--text-secondary);
    margin: 0;
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
}
</style>
