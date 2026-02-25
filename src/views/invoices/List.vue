<template>
  <div class="list-page">
    <!-- Header -->
    <div class="lp-header">
      <div class="lp-header__text">
        <h1 class="lp-header__title">📄 Hóa đơn</h1>
        <p class="lp-header__desc">Danh sách hóa đơn bán hàng trong hệ thống</p>
      </div>
      <el-button v-if="!isMobile" type="primary" :icon="Plus" @click="showForm = true" size="large">Tạo HĐ</el-button>
    </div>

    <!-- Stat Cards -->
    <div class="lp-stats" v-if="stats">
      <div class="stat-card stat-card--purple">
        <el-icon class="sc-icon"><Document /></el-icon>
        <div class="sc-body"><span class="sc-val">{{ stats.total ?? 0 }}</span><span class="sc-lbl">Tổng HĐ</span></div>
      </div>
      <div class="stat-card stat-card--amber">
        <el-icon class="sc-icon"><Warning /></el-icon>
        <div class="sc-body"><span class="sc-val">{{ stats.unpaid ?? 0 }}</span><span class="sc-lbl">Chưa TT</span></div>
      </div>
      <div class="stat-card stat-card--green">
        <el-icon class="sc-icon"><CircleCheckFilled /></el-icon>
        <div class="sc-body"><span class="sc-val">{{ stats.paid ?? 0 }}</span><span class="sc-lbl">Đã TT</span></div>
      </div>
      <div class="stat-card stat-card--blue">
        <el-icon class="sc-icon"><Money /></el-icon>
        <div class="sc-body"><span class="sc-val">{{ fmt(stats.total_amount) }}</span><span class="sc-lbl">Tổng tiền</span></div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="lp-filter">
      <span class="lp-lbl">Tìm kiếm</span>
      <el-input v-model="filters.search" placeholder="Mã HĐ, khách hàng..." clearable :prefix-icon="Search"
        class="lp-filter__search" @keyup.enter="fetchData()" @clear="fetchData()" />
      <span class="lp-lbl">Trạng thái</span>
      <el-select v-model="filters.status" placeholder="Tất cả" clearable @change="fetchData()" style="width:145px">
        <el-option label="Nháp" value="draft" />
        <el-option label="Chưa TT" value="unpaid" />
        <el-option label="TT 1 phần" value="partial" />
        <el-option label="Đã TT" value="paid" />
        <el-option label="Quá hạn" value="overdue" />
        <el-option label="Đã hủy" value="cancelled" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="fetchData()">Tìm kiếm</el-button>
      <el-button :icon="Refresh" @click="onReset">Đặt lại</el-button>
    </div>

    <!-- Desktop Table -->
    <el-card v-if="!isMobile" shadow="never" class="lp-table-card">
      <el-table :data="invoices" v-loading="loading" stripe :header-cell-style="headerStyle">
        <el-table-column prop="invoice_code" label="Mã HĐ" width="165">
          <template #default="{ row }">
            <el-link type="primary" underline="never" @click="$router.push(`/invoices/${row.id}`)" class="code-link">
              <el-icon style="vertical-align:-2px;margin-right:3px"><Document /></el-icon>{{ row.invoice_code }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="Khách hàng" min-width="180">
          <template #default="{ row }">
            <span class="contact-cell">
              <el-icon color="#6366f1"><User /></el-icon>
              {{ row.customer?.name ?? row.order?.customer_name ?? '—' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Ngày HĐ" width="120">
          <template #default="{ row }">
            <span class="date-cell"><el-icon><Calendar /></el-icon>{{ row.invoice_date || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Hạn TT" width="120">
          <template #default="{ row }">
            <span class="date-cell" :class="{ 'text-danger': isOverdue(row) }">
              <el-icon><Timer /></el-icon>{{ row.due_date || '—' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Tổng tiền" width="155" align="right">
          <template #default="{ row }"><span class="text-amount">{{ fmt(row.total_amount) }} ₫</span></template>
        </el-table-column>
        <el-table-column label="Đã TT" width="140" align="right">
          <template #default="{ row }"><span class="text-paid">{{ fmt(row.paid_amount) }} ₫</span></template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="135" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light" round>{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="95" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" :icon="View" @click="$router.push(`/invoices/${row.id}`)">Chi tiết</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="lp-pagination">
        <el-pagination background layout="total, sizes, prev, pager, next"
          :total="meta.total" :page-size="meta.per_page" :current-page="meta.current_page"
          :page-sizes="[10, 20, 50]"
          @size-change="s => { meta.per_page = s; fetchData() }"
          @current-change="p => fetchData(p)" />
      </div>
    </el-card>

    <!-- Mobile Cards -->
    <div v-else class="lp-mobile" v-loading="loading">
      <MobileCard v-for="inv in invoices" :key="inv.id" :title="inv.invoice_code" :icon="Document"
        :actions="[{ command: 'view', label: 'Chi tiết', icon: View }]"
        @action="() => $router.push(`/invoices/${inv.id}`)">
        <CardInfoRow :icon="User" :value="inv.customer?.name ?? '—'" />
        <CardInfoRow :icon="Timer" :value="`Hạn: ${inv.due_date || '—'}`" />
        <div class="card-foot">
          <span class="text-amount">{{ fmt(inv.total_amount) }} ₫</span>
          <el-tag :type="statusType(inv.status)" effect="light" round size="small">{{ statusLabel(inv.status) }}</el-tag>
        </div>
      </MobileCard>
      <el-empty v-if="!loading && !invoices.length" description="Không có hóa đơn nào" />
      <div class="lp-mob-page" v-if="invoices.length">
        <el-pagination background layout="prev, pager, next" size="small" :total="meta.total" :page-size="meta.per_page" :current-page="meta.current_page" @current-change="p => fetchData(p)" />
      </div>
    </div>

    <el-button v-if="isMobile" type="primary" :icon="Plus" circle size="large" class="lp-fab" @click="showForm = true" />
    <InvoiceFormModal v-model="showForm" @success="fetchData" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, Refresh, Document, User, Calendar, Timer, Money, View, Warning, CircleCheckFilled } from '@element-plus/icons-vue'
import { getInvoices, getInvoiceStatistics } from '@/api/invoice'
import { useResponsive } from '@/composables/useResponsive'
import MobileCard from '@/components/common/MobileCard.vue'
import CardInfoRow from '@/components/common/CardInfoRow.vue'
import InvoiceFormModal from '@/components/invoices/InvoiceFormModal.vue'

const { isMobile } = useResponsive()
const loading = ref(false)
const showForm = ref(false)
const invoices = ref([])
const stats = ref(null)
const meta = reactive({ total: 0, per_page: 15, current_page: 1 })
const filters = reactive({ search: '', status: '' })

const fmt = (v) => Number(v || 0).toLocaleString('vi-VN')
const headerStyle = { background: 'var(--el-fill-color-light)', fontWeight: '600', color: 'var(--el-text-color-primary)' }
const statusType = (s) => ({ draft: 'info', unpaid: 'warning', partial: '', paid: 'success', overdue: 'danger', cancelled: 'danger' }[s] || 'info')
const statusLabel = (s) => ({ draft: 'Nháp', unpaid: 'Chưa TT', partial: 'TT 1 phần', paid: 'Đã TT', overdue: 'Quá hạn', cancelled: 'Đã hủy' }[s] || s)
const isOverdue = (row) => row.due_date && new Date(row.due_date) < new Date() && row.status !== 'paid'

const fetchData = async (page = 1) => {
  loading.value = true
  try {
    const [res, statRes] = await Promise.all([
      getInvoices({ ...filters, page, per_page: meta.per_page }),
      getInvoiceStatistics()
    ])
    invoices.value = res.data ?? []
    Object.assign(meta, res.meta ?? { total: res.total, per_page: res.per_page, current_page: res.current_page })
    stats.value = statRes.data ?? statRes
  } catch { ElMessage.error('Lỗi tải dữ liệu') }
  loading.value = false
}

const onReset = () => { filters.search = ''; filters.status = ''; fetchData() }
onMounted(() => fetchData())
</script>

<style scoped lang="scss">
@import '@/views/finance/_list-shared.scss';
.stat-card--purple { background: linear-gradient(135deg,#7c3aed,#a78bfa); }
.stat-card--blue   { background: linear-gradient(135deg,#3b82f6,#60a5fa); }
.stat-card--green  { background: linear-gradient(135deg,#10b981,#34d399); }
.stat-card--amber  { background: linear-gradient(135deg,#f59e0b,#fbbf24); }
.text-paid { font-weight:600;color:var(--el-color-success); }
.text-danger { color:var(--el-color-danger);font-weight:600; }
.date-cell { display:inline-flex;align-items:center;gap:5px;color:var(--el-text-color-regular); }
</style>
