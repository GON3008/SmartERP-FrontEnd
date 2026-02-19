<template>
  <div class="products-container">
    <div class="page-header flex-between" v-if="!isMobile">
      <div>
        <h1 class="page-title">Quản lý sản phẩm</h1>
        <p class="page-description">Danh sách tất cả sản phẩm trong hệ thống</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        Thêm sản phẩm
      </el-button>
    </div>

    <!-- Mobile Header -->
    <div class="mobile-header" v-else>
      <h2 class="mobile-title">Sản phẩm</h2>
    </div>

    <!-- Search and Filter -->
    <!-- <el-card class="mb-md search-card">
      <el-form :inline="!isMobile" :model="searchForm" class="search-form">
        <el-form-item label="Tìm kiếm" class="search-input">
          <el-input
            v-model="searchForm.keyword"
            placeholder="Tên, email, số điện thoại..."
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
          <el-button :icon="Refresh" @click="handleReset">
            Đặt lại
          </el-button>
        </el-form-item>
      </el-form>
    </el-card> -->

    <el-card v-if="!isMobile">
      <el-table v-loading="loading" :data="tableData" stripe style="width: 100%">
        <el-table-column prop="sku" label="Mã sản phẩm" min-width="180" />
        <el-table-column prop="name" label="Tên sản phẩm" min-width="180" />
        <el-table-column prop="category" label="Danh mục" min-width="180" />
        <el-table-column prop="unit" label="Đơn vị" width="140" />
        <el-table-column prop="price" label="Giá" width="140" />
        <el-table-column prop="min_stock" label="Số lượng tối thiểu" width="140" />
        <el-table-column label="Thao tác" width="180" fixed="right">
          <template #default="{ row }">
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
    <div v-else class="customer-cards" v-loading="loading"></div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { Plus } from "@element-plus/icons-vue";

const router = useRouter();

const handleCreate = () => {
  router.push("/products/create");
};
</script>
