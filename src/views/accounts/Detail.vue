<template>
  <div class="det-container" v-loading="loading">
    <!-- Header -->
    <div class="det-header">
      <div class="det-header__left">
        <el-button :icon="ArrowLeft" @click="$router.back()" text>Quay lại</el-button>
        <div class="det-header__info" v-if="account.id">
          <h1 class="det-title" style="font-family:inherit;font-size:17px">{{ account.partner_name || '—' }}</h1>
          <el-tag :type="statusType(account.status)" effect="light" round>{{ statusLabel(account.status) }}</el-tag>
          <el-tag :type="account.type === 'receivable' ? 'primary' : 'warning'" effect="plain">
            {{ account.type === 'receivable' ? '📈 Phải thu' : '📉 Phải trả' }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- Not found -->
    <el-result v-if="!loading && !account.id" icon="error" title="Không tìm thấy công nợ">
      <template #extra>
        <el-button type="primary" @click="$router.push('/accounts')">Về danh sách</el-button>
      </template>
    </el-result>

    <template v-if="account.id">
      <!-- Stat cards -->
      <el-row :gutter="14" class="det-stats">
        <el-col :xs="12" :sm="6">
          <div class="scard" style="background:linear-gradient(135deg,#667eea,#764ba2)">
            <el-icon class="scard__icon"><Money /></el-icon>
            <div><div class="scard__val">{{ fmt(account.amount) }}</div><div class="scard__lbl">Số tiền (₫)</div></div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="scard" style="background:linear-gradient(135deg,#11998e,#38ef7d)">
            <el-icon class="scard__icon"><Wallet /></el-icon>
            <div><div class="scard__val">{{ fmt(account.paid_amount) }}</div><div class="scard__lbl">Đã TT (₫)</div></div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="scard" style="background:linear-gradient(135deg,#f093fb,#f5576c)">
            <el-icon class="scard__icon"><Warning /></el-icon>
            <div><div class="scard__val">{{ fmt(remaining) }}</div><div class="scard__lbl">Còn lại (₫)</div></div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="scard" style="background:linear-gradient(135deg,#4facfe,#00f2fe)">
            <el-icon class="scard__icon"><Timer /></el-icon>
            <div>
              <div class="scard__val" style="font-size:13px" :class="isOverdue ? 'text-danger-light' : ''">{{ account.due_date || '—' }}</div>
              <div class="scard__lbl">Hạn thanh toán</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <!-- Left: account info -->
        <el-col :xs="24" :md="10">
          <el-card shadow="never" class="det-card">
            <template #header>
              <span class="det-card__title"><el-icon><Document /></el-icon> Thông tin công nợ</span>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="Đối tác">
                <strong>{{ account.partner_name || '—' }}</strong>
              </el-descriptions-item>
              <el-descriptions-item label="Loại">
                <el-tag :type="account.type === 'receivable' ? 'primary' : 'warning'" size="small">
                  {{ account.type === 'receivable' ? 'Phải thu' : 'Phải trả' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Trạng thái">
                <el-tag :type="statusType(account.status)" size="small">{{ statusLabel(account.status) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Số tiền">
                <strong class="text-primary" style="font-size:1.1rem">{{ fmt(account.amount) }} ₫</strong>
              </el-descriptions-item>
              <el-descriptions-item label="Đã thanh toán">
                <strong class="text-success">{{ fmt(account.paid_amount) }} ₫</strong>
              </el-descriptions-item>
              <el-descriptions-item label="Còn lại">
                <strong :class="remaining > 0 ? 'text-danger' : 'text-success'">{{ fmt(remaining) }} ₫</strong>
              </el-descriptions-item>
              <el-descriptions-item label="Hạn TT">
                <el-icon style="vertical-align:-2px;margin-right:4px;color:#6b7280"><Timer /></el-icon>
                <span :class="isOverdue ? 'text-danger' : ''">{{ account.due_date || '—' }}</span>
              </el-descriptions-item>
              <el-descriptions-item v-if="account.reference_code" label="Mã chứng từ">
                <el-link
                  :href="account.reference_type?.includes('Invoice') ? `#/invoices/${account.reference_id}` : `#/purchase-orders/${account.reference_id}`"
                  type="primary" underline="hover" class="mono-code"
                >
                  <el-icon style="vertical-align:-2px;margin-right:3px">
                    <Document v-if="account.reference_type?.includes('Invoice')" /><Tickets v-else />
                  </el-icon>
                  {{ account.reference_code }}
                </el-link>
              </el-descriptions-item>
              <el-descriptions-item label="Ghi chú">{{ account.notes || '—' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <!-- Right: progress -->
        <el-col :xs="24" :md="14">
          <el-card shadow="never" class="det-card">
            <template #header>
              <span class="det-card__title"><el-icon><DataAnalysis /></el-icon> Tiến độ thanh toán</span>
            </template>

            <!-- Progress bar -->
            <div class="progress-section">
              <div class="progress-label">
                <span>{{ fmt(account.paid_amount) }} / {{ fmt(account.amount) }} ₫</span>
                <strong>{{ progressPct }}%</strong>
              </div>
              <el-progress :percentage="progressPct" :stroke-width="14" :color="progressColor" />
            </div>

            <!-- Summary -->
            <div class="pay-summary" style="margin-top:20px">
              <div class="pay-summary__row">
                <span>Tổng số tiền</span><strong>{{ fmt(account.amount) }} ₫</strong>
              </div>
              <div class="pay-summary__row">
                <span>Đã thanh toán</span><strong class="text-success">{{ fmt(account.paid_amount) }} ₫</strong>
              </div>
              <div class="pay-summary__row pay-summary__row--total">
                <span>Còn cần TT</span>
                <strong :class="remaining > 0 ? 'text-danger' : 'text-success'">{{ fmt(remaining) }} ₫</strong>
              </div>
            </div>

            <!-- Overdue alert -->
            <el-alert v-if="isOverdue" type="error" :closable="false" style="margin-top:16px" title="Đã quá hạn thanh toán!" show-icon>
              <template #default>Hạn: <strong>{{ account.due_date }}</strong></template>
            </el-alert>
            <el-alert v-else-if="account.status === 'paid'" type="success" :closable="false" style="margin-top:16px" title="Đã thanh toán đầy đủ" show-icon />
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Document, Tickets, Money, Wallet, Timer, Warning, DataAnalysis } from '@element-plus/icons-vue'
import { getAccount } from '@/api/account'

const route   = useRoute()
const router  = useRouter()
const loading = ref(false)
const account = ref({})

const fmt        = (v) => Number(v || 0).toLocaleString('vi-VN')
const remaining  = computed(() => Math.max(0, Number(account.value.amount || 0) - Number(account.value.paid_amount || 0)))
const isOverdue  = computed(() => account.value.due_date && new Date(account.value.due_date) < new Date() && account.value.status !== 'paid')
const progressPct = computed(() => {
  const total = Number(account.value.amount || 0)
  if (!total) return 0
  return Math.min(100, Math.round(Number(account.value.paid_amount || 0) / total * 100))
})
const progressColor = computed(() => {
  if (progressPct.value >= 100) return '#67c23a'
  if (progressPct.value >= 50)  return '#409eff'
  return '#e6a23c'
})

const statusType  = (s) => ({ open:'warning', overdue:'danger', paid:'success', cancelled:'info' }[s] || 'info')
const statusLabel = (s) => ({ open:'Đang mở', overdue:'Quá hạn', paid:'Đã TT', cancelled:'Đã hủy' }[s] || s)

const load = async () => {
  loading.value = true
  try {
    const res = await getAccount(route.params.id)
    account.value = res.data ?? res
  } catch { ElMessage.error('Không tải được công nợ') }
  loading.value = false
}

onMounted(load)
</script>

<style scoped lang="scss">
@import '@/views/finance/_detail-shared.scss';

.progress-section {
  padding: 16px 0 8px;

  .progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-bottom: 10px;
  }
}

.text-danger-light {
  color: #ffcdd2;
  font-weight: 600;
}
</style>
