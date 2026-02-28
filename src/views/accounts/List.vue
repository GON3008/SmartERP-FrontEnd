<template>
  <div class="list-page">
    <!-- Header -->
    <div class="lp-header">
      <div class="lp-header__text">
        <h1 class="lp-header__title">📊 Công nợ</h1>
        <p class="lp-header__desc">Theo dõi phải thu & phải trả</p>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="lp-stats" v-if="summary">
      <div class="stat-card stat-card--green">
        <el-icon class="sc-icon"><TopRight /></el-icon>
        <div class="sc-body">
          <span class="sc-val">{{ fmt(summary.receivable?.balance) }}</span>
          <span class="sc-lbl">Phải thu (còn lại)</span>
        </div>
      </div>
      <div class="stat-card stat-card--purple">
        <el-icon class="sc-icon"><TopRight /></el-icon>
        <div class="sc-body">
          <span class="sc-val">{{ summary.receivable?.count ?? 0 }}</span>
          <span class="sc-lbl">Khoản chưa thu</span>
        </div>
      </div>
      <div class="stat-card stat-card--amber">
        <el-icon class="sc-icon"><BottomRight /></el-icon>
        <div class="sc-body">
          <span class="sc-val">{{ fmt(summary.payable?.balance) }}</span>
          <span class="sc-lbl">Phải trả (còn lại)</span>
        </div>
      </div>
      <div class="stat-card stat-card--red">
        <el-icon class="sc-icon"><BottomRight /></el-icon>
        <div class="sc-body">
          <span class="sc-val">{{ summary.payable?.count ?? 0 }}</span>
          <span class="sc-lbl">Khoản chưa trả</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="lp-filter">
      <span class="lp-lbl">Tìm kiếm</span>
      <el-input v-model="filters.search" placeholder="Tên đối tác, mã chứng từ..." clearable :prefix-icon="Search"
        class="lp-filter__search" @keyup.enter="fetchData()" @clear="fetchData()" />
      <span class="lp-lbl">Loại</span>
      <el-select v-model="filters.type" placeholder="Tất cả" clearable @change="fetchData()" style="width:130px">
        <el-option label="📈 Phải thu" value="receivable" />
        <el-option label="📉 Phải trả" value="payable" />
      </el-select>
      <span class="lp-lbl">Trạng thái</span>
      <el-select v-model="filters.status" placeholder="Tất cả" clearable @change="fetchData()" style="width:130px">
        <el-option label="⏳ Đang mở" value="open" />
        <el-option label="🔴 Quá hạn" value="overdue" />
        <el-option label="✅ Đã TT" value="paid" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="fetchData()">Tìm kiếm</el-button>
      <el-button :icon="Refresh" @click="onReset">Đặt lại</el-button>
    </div>

    <!-- Desktop Table -->
    <el-card v-if="!isMobile" shadow="never" class="lp-table-card">
      <el-table :data="accounts" v-loading="loading" stripe :header-cell-style="headerStyle">
        <el-table-column label="Loại" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 'receivable' ? 'success' : 'warning'" effect="light" round size="small">
              <el-icon style="vertical-align:-2px;margin-right:2px"><TopRight v-if="row.type === 'receivable'" /><BottomRight v-else /></el-icon>
              {{ row.type === 'receivable' ? 'Phải thu' : 'Phải trả' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Đối tác" min-width="180">
          <template #default="{ row }">
            <el-link type="primary" underline="hover" @click="$router.push(`/accounts/${row.id}`)" class="contact-cell">
              <el-icon color="#6366f1"><User /></el-icon>{{ row.contact_name || '—' }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="Chứng từ" width="155">
          <template #default="{ row }">
            <el-link v-if="row.reference_code"
              :href="row.reference_type?.includes('Invoice') ? `#/invoices/${row.reference_id}` : `#/purchase-orders/${row.reference_id}`"
              type="primary" underline="never" class="code-tag">
              <el-icon style="vertical-align:-2px;margin-right:3px"><Document v-if="row.reference_type?.includes('Invoice')" /><Goods v-else /></el-icon>
              {{ row.reference_code }}
            </el-link>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="Tổng tiền" width="150" align="right">
          <template #default="{ row }"><span class="text-amount">{{ fmt(row.total_amount) }} ₫</span></template>
        </el-table-column>
        <el-table-column label="Đã TT" width="140" align="right">
          <template #default="{ row }"><span class="text-paid">{{ fmt(row.paid_amount) }} ₫</span></template>
        </el-table-column>
        <el-table-column label="Còn lại" width="140" align="right">
          <template #default="{ row }"><span class="text-balance">{{ fmt(row.balance) }} ₫</span></template>
        </el-table-column>
        <el-table-column label="Hạn TT" width="115">
          <template #default="{ row }">
            <span class="date-cell" :class="{ 'date-overdue': isOverdue(row) }">
              <el-icon><Calendar /></el-icon>{{ row.due_date || '—' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Trạng thái" width="115" align="center">
          <template #default="{ row }">
            <el-tag :type="{ open: 'warning', overdue: 'danger', paid: 'success' }[row.status]" effect="light" round>
              <el-icon style="vertical-align:-2px;margin-right:2px">
                <Timer v-if="row.status === 'open'" />
                <WarningFilled v-else-if="row.status === 'overdue'" />
                <CircleCheckFilled v-else />
              </el-icon>
              {{ { open: 'Đang mở', overdue: 'Quá hạn', paid: 'Đã TT' }[row.status] ?? row.status }}
            </el-tag>
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
      <MobileCard v-for="acc in accounts" :key="acc.id" :title="acc.contact_name || '—'" :icon="Wallet" :actions="[]">
        <div class="mob-tags">
          <el-tag :type="acc.type === 'receivable' ? 'success' : 'warning'" effect="light" round size="small">
            <el-icon style="vertical-align:-2px;margin-right:2px"><TopRight v-if="acc.type === 'receivable'" /><BottomRight v-else /></el-icon>
            {{ acc.type === 'receivable' ? 'Phải thu' : 'Phải trả' }}
          </el-tag>
          <el-tag :type="{ open: 'warning', overdue: 'danger', paid: 'success' }[acc.status]" effect="light" round size="small">
            {{ { open: 'Đang mở', overdue: 'Quá hạn', paid: 'Đã TT' }[acc.status] ?? acc.status }}
          </el-tag>
        </div>
        <CardInfoRow :icon="Calendar" :value="`Hạn: ${acc.due_date || '—'}`" />
        <div class="mob-amounts">
          <div class="mob-amounts__item">
            <span class="mob-amounts__lbl">Tổng</span>
            <span class="text-amount">{{ fmt(acc.total_amount) }} ₫</span>
          </div>
          <div class="mob-amounts__divider" />
          <div class="mob-amounts__item">
            <span class="mob-amounts__lbl">Còn lại</span>
            <span class="text-balance">{{ fmt(acc.balance) }} ₫</span>
          </div>
        </div>
      </MobileCard>
      <el-empty v-if="!loading && !accounts.length" description="Không có công nợ nào" />
      <div class="lp-mob-page" v-if="accounts.length">
        <el-pagination background layout="prev, pager, next" size="small" :total="meta.total" :page-size="meta.per_page" :current-page="meta.current_page" @current-change="p => fetchData(p)" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, User, Calendar, Timer, Wallet, TopRight, BottomRight, WarningFilled, CircleCheckFilled, Document, Goods } from '@element-plus/icons-vue'
import { getAccounts, getAccountSummary } from '@/api/account'
import { useResponsive } from '@/composables/useResponsive'
import MobileCard from '@/components/common/MobileCard.vue'
import CardInfoRow from '@/components/common/CardInfoRow.vue'

const { isMobile } = useResponsive()
const loading = ref(false)
const accounts = ref([])
const summary = ref(null)
const meta = reactive({ total: 0, per_page: 15, current_page: 1 })
const filters = reactive({ search: '', type: '', status: '' })

const fmt = (v) => Number(v || 0).toLocaleString('vi-VN')
const headerStyle = { background: 'var(--el-fill-color-light)', fontWeight: '600', color: 'var(--el-text-color-primary)' }
const isOverdue = (row) => row.due_date && new Date(row.due_date) < new Date() && row.status !== 'paid'

const fetchData = async (page = 1) => {
  loading.value = true
  try {
    const [res, sumRes] = await Promise.all([
      getAccounts({ ...filters, page, per_page: meta.per_page }),
      getAccountSummary()
    ])
    accounts.value = res.data ?? []
    Object.assign(meta, res.meta ?? { total: res.total, per_page: res.per_page, current_page: res.current_page })
    summary.value = sumRes.data ?? sumRes
  } catch { ElMessage.error('Lỗi tải dữ liệu') }
  loading.value = false
}

const onReset = () => { filters.search = ''; filters.type = ''; filters.status = ''; fetchData() }
onMounted(() => fetchData())
</script>

<style scoped lang="scss">
@import '@/views/finance/_list-shared.scss';
.stat-card--green  { background: linear-gradient(135deg,#10b981,#34d399); }
.stat-card--purple { background: linear-gradient(135deg,#7c3aed,#a78bfa); }
.stat-card--amber  { background: linear-gradient(135deg,#f59e0b,#fbbf24); }
.stat-card--red    { background: linear-gradient(135deg,#ef4444,#f87171); }

.text-balance { font-weight:700;color:var(--el-color-danger); }

.date-cell { display:inline-flex;align-items:center;gap:5px;color:var(--el-text-color-regular); }
.date-overdue { color:var(--el-color-danger);font-weight:600; }

.mob-tags { display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px; }

.mob-amounts {
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  margin-top:8px;padding-top:8px;border-top:1px dashed var(--el-border-color-lighter);

  &__item { display:flex;flex-direction:column;align-items:center;flex:1; }
  &__lbl { font-size:11px;color:var(--el-text-color-secondary);text-transform:uppercase;letter-spacing:0.4px; }
  &__divider { width:1px;height:28px;background:var(--el-border-color-lighter); }
}
</style>
