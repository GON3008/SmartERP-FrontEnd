<template>
  <div class="list-page">
    <!-- Header -->
    <div class="lp-header">
      <div class="lp-header__text">
        <h1 class="lp-header__title">💳 Thanh toán</h1>
        <p class="lp-header__desc">Ghi nhận lịch sử thanh toán hóa đơn & phiếu mua</p>
      </div>
      <el-button v-if="!isMobile" type="primary" :icon="Plus" @click="showForm = true" size="large">Ghi nhận TT</el-button>
    </div>

    <!-- Stat Cards -->
    <div class="lp-stats" v-if="stats">
      <div class="stat-card stat-card--purple">
        <el-icon class="sc-icon"><Tickets /></el-icon>
        <div class="sc-body"><span class="sc-val">{{ stats.total_payments ?? 0 }}</span><span class="sc-lbl">Tổng TT</span></div>
      </div>
      <div class="stat-card stat-card--blue">
        <el-icon class="sc-icon"><Money /></el-icon>
        <div class="sc-body"><span class="sc-val">{{ fmt(stats.total_amount) }}</span><span class="sc-lbl">Tổng tiền</span></div>
      </div>
      <div class="stat-card stat-card--green">
        <el-icon class="sc-icon"><Coin /></el-icon>
        <div class="sc-body"><span class="sc-val">{{ fmt(stats.by_method?.cash) }}</span><span class="sc-lbl">Tiền mặt</span></div>
      </div>
      <div class="stat-card stat-card--amber">
        <el-icon class="sc-icon"><CreditCard /></el-icon>
        <div class="sc-body"><span class="sc-val">{{ fmt(stats.by_method?.bank_transfer) }}</span><span class="sc-lbl">Chuyển khoản</span></div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="lp-filter">
      <span class="lp-lbl">Tìm kiếm</span>
      <el-input v-model="filters.search" placeholder="Mã TT, mã tham chiếu..." clearable :prefix-icon="Search"
        class="lp-filter__search" @keyup.enter="fetchData()" @clear="fetchData()" size="default" />
      <span class="lp-lbl">Phương thức</span>
      <el-select v-model="filters.payment_method" placeholder="Tất cả" clearable @change="fetchData()" style="width:145px">
        <el-option label="💵 Tiền mặt" value="cash" />
        <el-option label="🏦 Chuyển khoản" value="bank_transfer" />
        <el-option label="💳 Thẻ" value="card" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="fetchData()">Tìm kiếm</el-button>
      <el-button :icon="Refresh" @click="onReset">Đặt lại</el-button>
    </div>

    <!-- Desktop Table -->
    <el-card v-if="!isMobile" shadow="never" class="lp-table-card">
      <el-table :data="payments" v-loading="loading" stripe :header-cell-style="headerStyle">
        <el-table-column prop="payment_code" label="Mã TT" width="160">
          <template #default="{ row }">
            <el-link type="primary" underline="hover" @click="$router.push(`/payments/${row.id}`)" class="code-tag">
              <el-icon style="vertical-align:-2px;margin-right:3px"><Tickets /></el-icon>{{ row.payment_code }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="Loại" width="115" align="center">
          <template #default="{ row }">
            <el-tag :type="row.payable_type?.includes('Invoice') ? 'success' : 'warning'" effect="light" round size="small">
              <el-icon style="vertical-align:-2px;margin-right:2px"><Document v-if="row.payable_type?.includes('Invoice')" /><Goods v-else /></el-icon>
              {{ row.payable_type?.includes('Invoice') ? 'Hóa đơn' : 'Phiếu mua' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Chứng từ" width="155">
          <template #default="{ row }">
            <el-link v-if="row.payable"
              :href="row.payable_type?.includes('Invoice') ? `#/invoices/${row.payable_id}` : `#/purchase-orders/${row.payable_id}`"
              type="primary" underline="never" class="code-link">
              {{ row.payable?.invoice_code ?? row.payable?.po_code ?? `#${row.payable_id}` }}
            </el-link>
            <span v-else class="text-muted">#{{ row.payable_id }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Số tiền" width="155" align="right">
          <template #default="{ row }"><span class="text-amount">{{ fmt(row.amount) }} ₫</span></template>
        </el-table-column>
        <el-table-column label="Phương thức" width="155">
          <template #default="{ row }">
            <span class="method-cell">
              <el-icon :style="{color: methodColor(row.payment_method)}"><component :is="methodIcon(row.payment_method)" /></el-icon>
              {{ methodLabel(row.payment_method) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Ngày TT" width="120">
          <template #default="{ row }">
            <span class="date-cell"><el-icon><Calendar /></el-icon>{{ row.payment_date || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reference" label="Mã tham chiếu" min-width="140" show-overflow-tooltip />
        <el-table-column prop="notes" label="Ghi chú" min-width="160" show-overflow-tooltip />
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
      <MobileCard v-for="p in payments" :key="p.id" :title="p.payment_code" :icon="Tickets" :actions="[]">
        <span class="method-cell mb4">
          <el-icon :style="{color: methodColor(p.payment_method)}"><component :is="methodIcon(p.payment_method)" /></el-icon>
          {{ methodLabel(p.payment_method) }}
        </span>
        <CardInfoRow :icon="Calendar" :value="p.payment_date" />
        <div class="card-foot">
          <span class="text-amount">{{ fmt(p.amount) }} ₫</span>
          <el-tag :type="p.payable_type?.includes('Invoice') ? 'success' : 'warning'" effect="light" round size="small">
            {{ p.payable_type?.includes('Invoice') ? 'Hóa đơn' : 'Phiếu mua' }}
          </el-tag>
        </div>
      </MobileCard>
      <el-empty v-if="!loading && !payments.length" description="Không có thanh toán nào" />
      <div class="lp-mob-page" v-if="payments.length">
        <el-pagination background layout="prev, pager, next" size="small" :total="meta.total" :page-size="meta.per_page" :current-page="meta.current_page" @current-change="p => fetchData(p)" />
      </div>
    </div>

    <!-- FAB -->
    <el-button v-if="isMobile" type="primary" :icon="Plus" circle size="large" class="lp-fab" @click="showForm = true" />
    <PaymentFormModal v-model="showForm" @success="fetchData" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, Refresh, Tickets, Money, Coin, CreditCard, Calendar, Document, Goods } from '@element-plus/icons-vue'
import { getPayments, getPaymentStatistics } from '@/api/payment'
import { useResponsive } from '@/composables/useResponsive'
import MobileCard from '@/components/common/MobileCard.vue'
import CardInfoRow from '@/components/common/CardInfoRow.vue'
import PaymentFormModal from '@/components/payments/PaymentFormModal.vue'

const { isMobile } = useResponsive()
const loading = ref(false)
const showForm = ref(false)
const payments = ref([])
const stats = ref(null)
const meta = reactive({ total: 0, per_page: 15, current_page: 1 })
const filters = reactive({ search: '', payment_method: '' })

const fmt = (v) => Number(v || 0).toLocaleString('vi-VN')
const headerStyle = { background: 'var(--el-fill-color-light)', fontWeight: '600', color: 'var(--el-text-color-primary)' }
const methodLabel = (m) => ({ cash: 'Tiền mặt', bank_transfer: 'Chuyển khoản', card: 'Thẻ', other: 'Khác' }[m] || m)
const methodIcon = (m) => ({ cash: markRaw(Coin), bank_transfer: markRaw(CreditCard), card: markRaw(CreditCard) }[m] || markRaw(Money))
const methodColor = (m) => ({ cash: '#10b981', bank_transfer: '#3b82f6', card: '#f59e0b' }[m] || '#6b7280')

const fetchData = async (page = 1) => {
  loading.value = true
  try {
    const [res, statRes] = await Promise.all([
      getPayments({ ...filters, page, per_page: meta.per_page }),
      getPaymentStatistics()
    ])
    payments.value = res.data ?? []
    Object.assign(meta, res.meta ?? { total: res.total, per_page: res.per_page, current_page: res.current_page })
    stats.value = statRes.data ?? statRes
  } catch { ElMessage.error('Lỗi tải dữ liệu') }
  loading.value = false
}

const onReset = () => { filters.search = ''; filters.payment_method = ''; fetchData() }
onMounted(() => fetchData())
</script>

<style scoped lang="scss">
@import '@/views/finance/_list-shared.scss';
.stat-card--purple { background: linear-gradient(135deg,#7c3aed,#a78bfa); }
.stat-card--blue   { background: linear-gradient(135deg,#3b82f6,#60a5fa); }
.stat-card--green  { background: linear-gradient(135deg,#10b981,#34d399); }
.stat-card--amber  { background: linear-gradient(135deg,#f59e0b,#fbbf24); }
.stat-card--red    { background: linear-gradient(135deg,#ef4444,#f87171); }
.method-cell { display:inline-flex;align-items:center;gap:6px; }
.mb4 { margin-bottom:4px; }
.code-link { font-family:monospace;font-weight:700;font-size:13px; }
.date-cell { display:inline-flex;align-items:center;gap:5px;color:var(--el-text-color-regular); }
</style>
