<template>
  <div class="det-container" v-loading="loading">
    <!-- Header -->
    <div class="det-header">
      <div class="det-header__left">
        <el-button :icon="ArrowLeft" @click="$router.back()" text>Quay lại</el-button>
        <div class="det-header__info" v-if="supplier.id">
          <h1 class="det-title" style="font-family:inherit;font-size:18px">{{ supplier.name || '—' }}</h1>
          <el-tag :type="supplier.status === 'active' ? 'success' : 'danger'" effect="light" round>
            {{ supplier.status === 'active' ? 'Hoạt động' : 'Ngừng HĐ' }}
          </el-tag>
        </div>
      </div>
      <div class="det-header__actions" v-if="supplier.id">
        <el-button :icon="Edit" @click="showEdit = true">Chỉnh sửa</el-button>
      </div>
    </div>

    <!-- Not found -->
    <el-result v-if="!loading && !supplier.id" icon="error" title="Không tìm thấy nhà cung cấp">
      <template #extra>
        <el-button type="primary" @click="$router.push('/suppliers')">Về danh sách</el-button>
      </template>
    </el-result>

    <template v-if="supplier.id">
      <!-- Stat cards -->
      <el-row :gutter="14" class="det-stats">
        <el-col :xs="12" :sm="6">
          <div class="scard" style="background:linear-gradient(135deg,#667eea,#764ba2)">
            <el-icon class="scard__icon"><Tickets /></el-icon>
            <div><div class="scard__val">{{ stats?.total_purchase_orders ?? 0 }}</div><div class="scard__lbl">Tổng PO</div></div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="scard" style="background:linear-gradient(135deg,#11998e,#38ef7d)">
            <el-icon class="scard__icon"><Money /></el-icon>
            <div><div class="scard__val">{{ fmtShort(stats?.total_spent) }}</div><div class="scard__lbl">Tổng chi (₫)</div></div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="scard" style="background:linear-gradient(135deg,#f093fb,#f5576c)">
            <el-icon class="scard__icon"><Timer /></el-icon>
            <div><div class="scard__val">{{ stats?.pending_orders ?? 0 }}</div><div class="scard__lbl">PO đang chờ</div></div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="scard" style="background:linear-gradient(135deg,#4facfe,#00f2fe)">
            <el-icon class="scard__icon"><CircleCheck /></el-icon>
            <div><div class="scard__val">{{ stats?.completed_orders ?? history.filter(h=>h.status==='received').length }}</div><div class="scard__lbl">PO hoàn thành</div></div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <!-- Left: supplier info -->
        <el-col :xs="24" :md="10">
          <el-card shadow="never" class="det-card">
            <template #header>
              <span class="det-card__title"><el-icon><OfficeBuilding /></el-icon> Thông tin nhà cung cấp</span>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="Tên NCC">
                <strong>{{ supplier.name }}</strong>
              </el-descriptions-item>
              <el-descriptions-item label="Người liên hệ">
                <el-icon style="vertical-align:-2px;margin-right:4px"><User /></el-icon>{{ supplier.contact_person || '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="Email">
                <el-icon style="vertical-align:-2px;margin-right:4px"><Message /></el-icon>{{ supplier.email || '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="SĐT">
                <el-icon style="vertical-align:-2px;margin-right:4px"><Phone /></el-icon>{{ supplier.phone || '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="Địa chỉ">{{ supplier.address || '—' }}</el-descriptions-item>
              <el-descriptions-item label="Mã số thuế">
                <span class="mono-code">{{ supplier.tax_code || '—' }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- Bank info -->
          <el-card shadow="never" class="det-card">
            <template #header>
              <span class="det-card__title"><el-icon><Wallet /></el-icon> Thông tin ngân hàng</span>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="Số TK">
                <span class="mono-code">{{ supplier.bank_account || '—' }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="Ngân hàng">{{ supplier.bank_name || '—' }}</el-descriptions-item>
              <el-descriptions-item label="Ghi chú">{{ supplier.notes || '—' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <!-- Right: purchase history -->
        <el-col :xs="24" :md="14">
          <el-card shadow="never" class="det-card">
            <template #header>
              <div class="det-card__head">
                <span class="det-card__title"><el-icon><List /></el-icon> Lịch sử mua hàng</span>
                <el-tag type="info" size="small">{{ history.length }} PO</el-tag>
              </div>
            </template>
            <el-table :data="history" stripe size="small">
              <el-table-column label="Mã PO" width="150">
                <template #default="{ row }">
                  <el-link :href="`#/purchase-orders/${row.id}`" type="primary" underline="hover" class="mono-code">{{ row.po_code }}</el-link>
                </template>
              </el-table-column>
              <el-table-column prop="order_date" label="Ngày đặt" width="110" />
              <el-table-column label="Tổng tiền" width="140" align="right">
                <template #default="{ row }">
                  <span class="fw-700 text-primary">{{ Number(row.total_amount).toLocaleString('vi-VN') }} ₫</span>
                </template>
              </el-table-column>
              <el-table-column label="Trạng thái" width="130">
                <template #default="{ row }">
                  <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!history.length" description="Chưa có PO nào" :image-size="70" />
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- Edit Dialog -->
    <SupplierFormModal v-if="showEdit" v-model="showEdit" :supplier-id="supplier.id" @success="load" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, OfficeBuilding, User, Message, Phone, Wallet, Tickets, Money, Timer, CircleCheck, Edit, List } from '@element-plus/icons-vue'
import { getSupplier, getSupplierStatistics, getSupplierPurchaseHistory } from '@/api/supplier'
import SupplierFormModal from '@/components/suppliers/SupplierFormModal.vue'

const route   = useRoute()
const loading = ref(false)
const supplier = ref({})
const stats    = ref(null)
const history  = ref([])
const showEdit = ref(false)

const fmt      = (v) => Number(v || 0).toLocaleString('vi-VN')
const fmtShort = (v) => {
  const n = Number(v || 0)
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  return n.toLocaleString('vi-VN')
}
const statusType  = (s) => ({ draft:'info', confirmed:'warning', received:'success', cancelled:'danger' }[s] || 'info')
const statusLabel = (s) => ({ draft:'Nháp', confirmed:'Đã xác nhận', received:'Đã nhận', cancelled:'Đã hủy' }[s] || s)

const load = async () => {
  loading.value = true
  const id = route.params.id
  try {
    const [supRes, statRes, histRes] = await Promise.all([
      getSupplier(id), getSupplierStatistics(id), getSupplierPurchaseHistory(id)
    ])
    supplier.value = supRes.data || supRes
    stats.value    = statRes.data || statRes
    history.value  = histRes.data?.data || histRes.data || []
  } catch (e) { ElMessage.error('Không tải được dữ liệu') }
  loading.value = false
}

onMounted(load)
</script>

<style scoped lang="scss">
@import '@/views/finance/_detail-shared.scss';
</style>
