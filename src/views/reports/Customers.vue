<template>
  <div class="report-page">
    <div class="report-header">
      <div class="report-header__left">
        <el-icon
          class="report-header__icon"
          style="background: rgba(167, 139, 250, 0.12); color: #8b5cf6"
          ><User
        /></el-icon>
        <div>
          <h2>Báo cáo khách hàng</h2>
          <p>Phân tích hành vi mua và giá trị vòng đời khách hàng</p>
        </div>
      </div>
      <div class="report-header__actions">
        <el-input
          v-model="minOrders"
          placeholder="Đơn tối thiểu"
          size="small"
          style="width: 140px"
          clearable
          @change="fetchData"
        />
        <el-button
          :icon="Refresh"
          size="small"
          circle
          :loading="loading"
          @click="fetchData"
        />
      </div>
    </div>

    <!-- KPI Row -->
    <div class="report-kpi-row" v-loading="loading">
      <div class="report-kpi" style="border-top-color: #8b5cf6">
        <div class="report-kpi__value">{{ meta.total?.toLocaleString() ?? "–" }}</div>
        <div class="report-kpi__label">Tổng khách hàng</div>
      </div>
      <div class="report-kpi" style="border-top-color: #0ea5e9">
        <div class="report-kpi__value">
          {{ topCustomer?.name?.split(" ").slice(-1)[0] ?? "–" }}
        </div>
        <div class="report-kpi__label">Top KH</div>
        <div class="report-kpi__trend up" v-if="topCustomer">
          {{ fmtM(topCustomer.orders_sum_total_amount) }}
        </div>
      </div>
      <div class="report-kpi" style="border-top-color: #34d399">
        <div class="report-kpi__value">{{ avgOrders }}</div>
        <div class="report-kpi__label">Đơn hàng TB/KH</div>
      </div>
      <div class="report-kpi" style="border-top-color: #fb923c">
        <div class="report-kpi__value">{{ fmtM(avgSpend) }}</div>
        <div class="report-kpi__label">Chi tiêu TB/KH</div>
      </div>
    </div>

    <!-- Top Customers Chart -->
    <div class="report-card">
      <div class="report-card-header"><h3>Top 10 khách hàng chi tiêu nhiều nhất</h3></div>
      <div v-loading="loading">
        <el-empty
          v-if="customers.length === 0 && !loading"
          description="Chưa có dữ liệu khách hàng"
        />
        <div v-else class="top-cust-chart">
          <div v-for="(c, i) in customers.slice(0, 10)" :key="c.id" class="top-cust-row">
            <span class="cust-rank" :class="`rank-${Math.min(i + 1, 5)}`">{{
              i + 1
            }}</span>
            <div class="cust-name-wrap">
              <span class="cust-name">{{ c.name }}</span>
              <div class="cust-bar-wrap">
                <div
                  class="cust-bar"
                  :style="{
                    width:
                      Math.round(
                        (Number(c.orders_sum_total_amount || 0) /
                          Number(customers[0]?.orders_sum_total_amount || 1)) *
                          100
                      ) + '%',
                  }"
                ></div>
              </div>
            </div>
            <div class="cust-stats">
              <span class="cust-orders">{{ c.orders_count }} đơn</span>
              <span class="cust-revenue text-blue">{{
                fmtM(c.orders_sum_total_amount)
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Full Table -->
    <div class="report-card">
      <div class="report-card-header">
        <h3>Danh sách khách hàng</h3>
        <el-input
          v-model="search"
          placeholder="Tìm khách hàng..."
          size="small"
          :prefix-icon="Search"
          style="width: 220px"
          clearable
        />
      </div>
      <el-table
        :data="filteredTable"
        stripe
        size="small"
        class="report-table"
        v-loading="loading"
      >
        <el-table-column label="#" width="50" align="center">
          <template #default="{ $index }">{{ meta.from + $index }}</template>
        </el-table-column>
        <el-table-column label="Khách hàng" prop="name" min-width="160" />
        <el-table-column label="Email" prop="email" min-width="180" />
        <el-table-column label="Điện thoại" prop="phone" width="130" />
        <el-table-column label="Tổng đơn" prop="orders_count" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small" effect="light">{{
              row.orders_count
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Tổng chi tiêu" min-width="150">
          <template #default="{ row }">
            <span class="text-blue" style="font-weight: 600">{{
              fmtVND(row.orders_sum_total_amount)
            }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div style="display: flex; justify-content: flex-end; margin-top: 16px">
        <el-pagination
          v-if="meta.total > meta.per_page"
          :current-page="currentPage"
          :page-size="meta.per_page"
          :total="meta.total"
          layout="prev, pager, next"
          size="small"
          @current-change="changePage"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { User, Refresh, Search } from "@element-plus/icons-vue";
import { getCustomersReport } from "@/api/reports";

const minOrders = ref("");
const search = ref("");
const loading = ref(false);
const currentPage = ref(1);

const customers = ref([]);
const meta = ref({ total: 0, per_page: 50, from: 1 });

const topCustomer = computed(() => customers.value[0]);
const avgOrders = computed(() => {
  if (!customers.value.length) return 0;
  return Math.round(
    customers.value.reduce((s, c) => s + (c.orders_count || 0), 0) /
      customers.value.length
  );
});
const avgSpend = computed(() => {
  if (!customers.value.length) return 0;
  return (
    customers.value.reduce((s, c) => s + Number(c.orders_sum_total_amount || 0), 0) /
    customers.value.length
  );
});

const filteredTable = computed(() =>
  customers.value.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.value.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.value.toLowerCase())
  )
);

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v || 0);
const fmtM = (v) => {
  if (!v) return "0";
  const n = Number(v);
  if (n >= 1e9) return (n / 1e9).toFixed(1) + " tỷ";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " tr";
  return n.toLocaleString();
};

async function fetchData() {
  loading.value = true;
  try {
    const filters = { per_page: 50, page: currentPage.value };
    if (minOrders.value) filters.min_orders = minOrders.value;
    const res = await getCustomersReport(filters);
    // Paginated response
    customers.value = res.data || res || [];
    meta.value = {
      total: res.total || customers.value.length,
      per_page: res.per_page || 50,
      from: res.from || 1,
    };
  } catch (e) {
    ElMessage.error("Lỗi tải dữ liệu khách hàng");
  } finally {
    loading.value = false;
  }
}

function changePage(p) {
  currentPage.value = p;
  fetchData();
}

onMounted(fetchData);
</script>

<style scoped lang="scss">
@import "./report-shared.scss";
.top-cust-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.top-cust-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cust-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  &.rank-1 {
    background: #fbbf24;
    color: #fff;
  }
  &.rank-2 {
    background: rgba(148, 163, 184, 0.3);
    color: var(--text-primary);
  }
  &.rank-3 {
    background: rgba(180, 120, 80, 0.25);
    color: #b45309;
  }
  &.rank-4,
  &.rank-5 {
    background: var(--bg-page);
    color: var(--text-secondary);
  }
}
.cust-name-wrap {
  flex: 1;
  min-width: 0;
}
.cust-name {
  font-size: 13px;
  color: var(--text-primary);
  display: block;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cust-bar-wrap {
  height: 5px;
  background: var(--bg-page);
  border-radius: 4px;
  overflow: hidden;
}
.cust-bar {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #0ea5e9);
  border-radius: 4px;
  transition: width 0.8s;
}
.cust-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
  min-width: 90px;
}
.cust-orders {
  font-size: 11.5px;
  color: var(--text-secondary);
}
.cust-revenue {
  font-size: 13px;
  font-weight: 700;
}
</style>
