<template>
  <div class="det-container" v-loading="loading">
    <!-- Header -->
    <div class="det-header">
      <div class="det-header__left">
        <el-button :icon="ArrowLeft" @click="$router.back()" text>Quay lại</el-button>
        <div class="det-header__info" v-if="payment.id">
          <h1 class="det-title">{{ payment.payment_code || '—' }}</h1>
          <el-tag :type="methodTagType(payment.payment_method)" effect="light" round>{{ methodLabel(payment.payment_method) }}</el-tag>
        </div>
      </div>
    </div>

    <!-- Not found -->
    <el-result v-if="!loading && !payment.id" icon="error" title="Không tìm thấy thanh toán">
      <template #extra>
        <el-button type="primary" @click="$router.push('/payments')">Về danh sách</el-button>
      </template>
    </el-result>

    <template v-if="payment.id">
      <!-- Stat cards -->
      <el-row :gutter="14" class="det-stats">
        <el-col :xs="12" :sm="6">
          <div class="scard" style="background:linear-gradient(135deg,#667eea,#764ba2)">
            <el-icon class="scard__icon"><Money /></el-icon>
            <div><div class="scard__val">{{ fmt(payment.amount) }}</div><div class="scard__lbl">Số tiền (₫)</div></div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="scard" style="background:linear-gradient(135deg,#11998e,#38ef7d)">
            <el-icon class="scard__icon"><Calendar /></el-icon>
            <div><div class="scard__val" style="font-size:14px">{{ payment.payment_date || '—' }}</div><div class="scard__lbl">Ngày TT</div></div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="scard" style="background:linear-gradient(135deg,#f093fb,#f5576c)">
            <el-icon class="scard__icon"><CreditCard /></el-icon>
            <div><div class="scard__val" style="font-size:14px">{{ methodLabel(payment.payment_method) }}</div><div class="scard__lbl">Phương thức</div></div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="scard" style="background:linear-gradient(135deg,#4facfe,#00f2fe)">
            <el-icon class="scard__icon"><Document /></el-icon>
            <div><div class="scard__val" style="font-size:13px">{{ payableCode }}</div><div class="scard__lbl">Chứng từ</div></div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <!-- Left: payment info -->
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="det-card">
            <template #header>
              <span class="det-card__title"><el-icon><CreditCard /></el-icon> Thông tin thanh toán</span>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="Mã TT">
                <span class="mono-code">{{ payment.payment_code }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="Số tiền">
                <strong class="text-primary" style="font-size:1.1rem">{{ fmt(payment.amount) }} ₫</strong>
              </el-descriptions-item>
              <el-descriptions-item label="Phương thức">
                <el-tag :type="methodTagType(payment.payment_method)" size="small">{{ methodLabel(payment.payment_method) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Ngày TT">
                <el-icon style="vertical-align:-2px;margin-right:4px;color:#6b7280"><Calendar /></el-icon>{{ payment.payment_date || '—' }}
              </el-descriptions-item>
              <el-descriptions-item label="Mã tham chiếu">
                <span class="mono-code">{{ payment.reference || '—' }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="Ghi chú">{{ payment.notes || '—' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <!-- Right: linked document -->
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="det-card">
            <template #header>
              <span class="det-card__title"><el-icon><Document /></el-icon> Chứng từ liên quan</span>
            </template>
            <template v-if="payment.payable">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="Loại">
                  <el-tag :type="isInvoice ? 'primary' : 'warning'" size="small">
                    {{ isInvoice ? 'Hóa đơn' : 'Phiếu mua hàng' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="Mã">
                  <el-link
                    :href="isInvoice ? `#/invoices/${payment.payable_id}` : `#/purchase-orders/${payment.payable_id}`"
                    type="primary" underline="hover" class="mono-code"
                  >
                    {{ payment.payable?.invoice_code ?? payment.payable?.po_code ?? `#${payment.payable_id}` }}
                  </el-link>
                </el-descriptions-item>
                <el-descriptions-item v-if="isInvoice" label="Khách hàng">
                  {{ payment.payable?.customer?.name || '—' }}
                </el-descriptions-item>
                <el-descriptions-item v-else label="Nhà cung cấp">
                  {{ payment.payable?.supplier?.name || '—' }}
                </el-descriptions-item>
                <el-descriptions-item label="Tổng tiền CT">
                  <strong>{{ fmt(payment.payable?.total_amount) }} ₫</strong>
                </el-descriptions-item>
              </el-descriptions>
            </template>
            <el-empty v-else description="Không có chứng từ liên kết" :image-size="70" />
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
import { ArrowLeft, CreditCard, Money, Calendar, Document } from '@element-plus/icons-vue'
import { getPayment } from '@/api/payment'

const route   = useRoute()
const router  = useRouter()
const loading = ref(false)
const payment = ref({})

const fmt         = (v) => Number(v || 0).toLocaleString('vi-VN')
const isInvoice   = computed(() => payment.value.payable_type?.includes('Invoice'))
const payableCode = computed(() => payment.value.payable?.invoice_code ?? payment.value.payable?.po_code ?? `#${payment.value.payable_id ?? '—'}`)
const methodLabel = (m) => ({ cash:'Tiền mặt', bank_transfer:'Chuyển khoản', card:'Thẻ', other:'Khác' }[m] || m || '—')
const methodTagType = (m) => ({ cash:'success', bank_transfer:'primary', card:'warning', other:'info' }[m] || 'info')

const load = async () => {
  loading.value = true
  try {
    const res = await getPayment(route.params.id)
    payment.value = res.data ?? res
  } catch { ElMessage.error('Không tải được thanh toán') }
  loading.value = false
}

onMounted(load)
</script>

<style scoped lang="scss">
@import '@/views/finance/_detail-shared.scss';
</style>
