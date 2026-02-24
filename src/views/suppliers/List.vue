<template>
  <div class="list-page">
    <!-- Header -->
    <div class="lp-header">
      <div class="lp-header__text">
        <h1 class="lp-header__title">🏢 Nhà cung cấp</h1>
        <p class="lp-header__desc">Danh sách nhà cung cấp trong hệ thống</p>
      </div>
      <el-button v-if="!isMobile" type="primary" :icon="Plus" @click="handleCreate" size="large">Thêm NCC</el-button>
    </div>

    <!-- Stat Cards -->
    <div class="lp-stats" v-if="supplierStats">
      <div class="stat-card stat-card--purple">
        <el-icon class="sc-icon"><OfficeBuilding /></el-icon>
        <div class="sc-body"><span class="sc-val">{{ supplierStats.total ?? 0 }}</span><span class="sc-lbl">Tổng NCC</span></div>
      </div>
      <div class="stat-card stat-card--green">
        <el-icon class="sc-icon"><CircleCheckFilled /></el-icon>
        <div class="sc-body"><span class="sc-val">{{ supplierStats.active ?? 0 }}</span><span class="sc-lbl">Hoạt động</span></div>
      </div>
      <div class="stat-card stat-card--red">
        <el-icon class="sc-icon"><CircleCloseFilled /></el-icon>
        <div class="sc-body"><span class="sc-val">{{ supplierStats.inactive ?? 0 }}</span><span class="sc-lbl">Ngừng HĐ</span></div>
      </div>
      <div class="stat-card stat-card--amber">
        <el-icon class="sc-icon"><Tickets /></el-icon>
        <div class="sc-body"><span class="sc-val">{{ supplierStats.with_po ?? 0 }}</span><span class="sc-lbl">Có PO</span></div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="lp-filter">
      <span class="lp-lbl">Tìm kiếm</span>
      <el-input v-model="filters.search" placeholder="Tên NCC, email, SĐT..." clearable :prefix-icon="Search"
        class="lp-filter__search" @keyup.enter="fetchData()" @clear="fetchData()" />
      <span class="lp-lbl">Trạng thái</span>
      <el-select v-model="filters.status" placeholder="Tất cả" clearable @change="fetchData()" style="width:145px">
        <el-option label="✅ Hoạt động" value="active" />
        <el-option label="🚫 Ngừng HĐ" value="inactive" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="fetchData()">Tìm kiếm</el-button>
      <el-button :icon="Refresh" @click="onReset">Đặt lại</el-button>
    </div>

    <!-- Desktop Table -->
    <el-card v-if="!isMobile" shadow="never" class="lp-table-card">
      <el-table :data="suppliers" v-loading="loading" stripe :header-cell-style="headerStyle">
        <el-table-column prop="name" label="Tên nhà cung cấp" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" underline="hover" @click="$router.push(`/suppliers/${row.id}`)" class="contact-cell">
              <el-icon color="#7c3aed"><OfficeBuilding /></el-icon><strong>{{ row.name }}</strong>
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="contact_person" label="Người liên hệ" min-width="150">
          <template #default="{ row }">
            <span v-if="row.contact_person" class="contact-cell"><el-icon color="#6366f1"><User /></el-icon>{{ row.contact_person }}</span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="SĐT" width="140">
          <template #default="{ row }">
            <span v-if="row.phone" class="contact-cell"><el-icon color="#0ea5e9"><Phone /></el-icon>{{ row.phone }}</span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="Email" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.email" class="contact-cell"><el-icon color="#f59e0b"><Message /></el-icon>{{ row.email }}</span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="tax_code" label="MST" width="130" />
        <el-table-column label="Trạng thái" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" effect="light" round>
              <el-icon style="vertical-align:-2px;margin-right:3px"><CircleCheckFilled v-if="row.status === 'active'" /><CircleCloseFilled v-else /></el-icon>
              {{ row.status === 'active' ? 'Hoạt động' : 'Ngừng HĐ' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Thao tác" width="185" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" :icon="View" @click="$router.push(`/suppliers/${row.id}`)">Xem</el-button>
            <el-button size="small" link type="info" :icon="Edit" @click="handleEdit(row)">Sửa</el-button>
            <el-popconfirm title="Xóa nhà cung cấp này?" confirm-button-text="Xóa" cancel-button-text="Hủy" @confirm="handleDelete(row.id)">
              <template #reference><el-button size="small" link type="danger" :icon="Delete">Xóa</el-button></template>
            </el-popconfirm>
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
      <MobileCard v-for="s in suppliers" :key="s.id" :title="s.name" :icon="OfficeBuilding"
        :actions="cardActions" @action="cmd => handleCardAction(cmd, s)">
        <CardInfoRow :icon="User" :value="s.contact_person || '—'" />
        <CardInfoRow :icon="Phone" :value="s.phone || '—'" />
        <CardInfoRow :icon="Message" :value="s.email || '—'" />
        <div class="card-foot">
          <el-tag :type="s.status === 'active' ? 'success' : 'danger'" effect="light" round size="small">
            {{ s.status === 'active' ? 'Hoạt động' : 'Ngừng HĐ' }}
          </el-tag>
          <span class="text-muted" style="font-size:12px">{{ s.tax_code || '' }}</span>
        </div>
      </MobileCard>
      <el-empty v-if="!loading && !suppliers.length" description="Không có nhà cung cấp nào" />
      <div class="lp-mob-page" v-if="suppliers.length">
        <el-pagination background layout="prev, pager, next" size="small" :total="meta.total" :page-size="meta.per_page" :current-page="meta.current_page" @current-change="p => fetchData(p)" />
      </div>
    </div>

    <el-button v-if="isMobile" type="primary" :icon="Plus" circle size="large" class="lp-fab" @click="handleCreate" />
    <SupplierFormModal v-model="showModal" :supplier-id="selectedId" @success="fetchData" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, Refresh, View, Edit, Delete, User, Message, Phone, OfficeBuilding, CircleCheckFilled, CircleCloseFilled, Tickets } from '@element-plus/icons-vue'
import { getSuppliers, deleteSupplier } from '@/api/supplier'
import { useResponsive } from '@/composables/useResponsive'
import { useRouter } from 'vue-router'
import MobileCard from '@/components/common/MobileCard.vue'
import CardInfoRow from '@/components/common/CardInfoRow.vue'
import SupplierFormModal from '@/components/suppliers/SupplierFormModal.vue'

const { isMobile } = useResponsive()
const router = useRouter()
const loading = ref(false)
const showModal = ref(false)
const selectedId = ref(null)
const suppliers = ref([])
const meta = reactive({ total: 0, per_page: 15, current_page: 1 })
const filters = reactive({ search: '', status: '' })

const headerStyle = { background: 'var(--el-fill-color-light)', fontWeight: '600', color: 'var(--el-text-color-primary)' }

const cardActions = [
  { command: 'view', label: 'Xem chi tiết', icon: View },
  { command: 'edit', label: 'Sửa', icon: Edit, divided: true },
  { command: 'delete', label: 'Xóa', icon: Delete, divided: true }
]

// Computed supplier stats from loaded data
const supplierStats = computed(() => {
  if (!suppliers.value.length && !meta.total) return null
  const all = suppliers.value
  return {
    total: meta.total,
    active: all.filter(s => s.status === 'active').length,
    inactive: all.filter(s => s.status === 'inactive').length,
    with_po: all.filter(s => s.purchase_orders_count > 0).length
  }
})

const fetchData = async (page = 1) => {
  loading.value = true
  try {
    const res = await getSuppliers({ ...filters, page, per_page: meta.per_page })
    suppliers.value = res.data ?? []
    Object.assign(meta, res.meta ?? { total: res.total, per_page: res.per_page, current_page: res.current_page })
  } catch { ElMessage.error('Lỗi tải dữ liệu') }
  loading.value = false
}

const onReset = () => { filters.search = ''; filters.status = ''; fetchData() }
const handleCreate = () => { selectedId.value = null; showModal.value = true }
const handleEdit = (row) => { selectedId.value = row.id; showModal.value = true }
const handleCardAction = (cmd, s) => {
  if (cmd === 'view') router.push(`/suppliers/${s.id}`)
  else if (cmd === 'edit') handleEdit(s)
  else if (cmd === 'delete') handleDelete(s.id)
}
const handleDelete = async (id) => {
  try { await deleteSupplier(id); ElMessage.success('Xóa thành công!'); fetchData() }
  catch (e) { ElMessage.error(e.response?.data?.message || 'Lỗi xóa') }
}

onMounted(() => fetchData())
</script>

<style scoped lang="scss">
@import '@/views/finance/_list-shared.scss';
.stat-card--purple { background: linear-gradient(135deg,#7c3aed,#a78bfa); }
.stat-card--green  { background: linear-gradient(135deg,#10b981,#34d399); }
.stat-card--amber  { background: linear-gradient(135deg,#f59e0b,#fbbf24); }
.stat-card--red    { background: linear-gradient(135deg,#ef4444,#f87171); }
</style>
