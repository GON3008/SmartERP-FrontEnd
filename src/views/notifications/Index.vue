<template>
  <div class="notifications-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Thông báo</h1>
        <p class="page-description">Tổng hợp thông báo hệ thống</p>
      </div>
      <el-button :icon="Refresh" @click="fetchAll" :loading="loading">Làm mới</el-button>
    </div>

    <!-- Stats row -->
    <el-row :gutter="12" class="mb-md">
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-primary">
          <div class="stat-num">{{ count }}</div>
          <div class="stat-lbl">Tổng thông báo</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-danger">
          <div class="stat-num">{{ lowStockList.length }}</div>
          <div class="stat-lbl">Tồn kho thấp</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-warning">
          <div class="stat-num">{{ pendingOrderList.length }}</div>
          <div class="stat-lbl">Đơn hàng chờ</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-success">
          <div class="stat-num">{{ allNotifs.filter(n => n.type === 'success').length }}</div>
          <div class="stat-lbl">Thông báo tích cực</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <!-- All Notifications -->
      <el-col :xs="24" :lg="14">
        <el-card v-loading="loading">
          <template #header>
            <div class="card-header">
              <span class="card-title">Tất cả thông báo</span>
              <el-badge :value="allNotifs.length" type="primary" />
            </div>
          </template>
          <div class="notif-list">
            <div v-for="(n, i) in allNotifs" :key="i" class="notif-item" :class="`notif-${n.type ?? 'info'}`">
              <div class="notif-icon">
                <el-icon :size="20">
                  <component :is="notifIcon(n.type)" />
                </el-icon>
              </div>
              <div class="notif-body">
                <div class="notif-title">{{ n.title ?? n.message ?? '—' }}</div>
                <div class="notif-sub" v-if="n.description ?? n.detail">{{ n.description ?? n.detail }}</div>
                <div class="notif-time" v-if="n.created_at ?? n.time">{{ fmtTime(n.created_at ?? n.time) }}</div>
              </div>
            </div>
            <el-empty v-if="!loading && !allNotifs.length" description="Không có thông báo nào" :image-size="70" />
          </div>
        </el-card>
      </el-col>

      <!-- Right column: Low Stock + Pending Orders -->
      <el-col :xs="24" :lg="10">
        <!-- Low Stock -->
        <el-card class="mb-md" v-loading="loadingSub">
          <template #header>
            <div class="card-header">
              <span class="card-title">⚠️ Sản phẩm tồn kho thấp</span>
              <el-badge :value="lowStockList.length" type="danger" />
            </div>
          </template>
          <div class="compact-list">
            <div v-for="item in lowStockList" :key="item.id ?? item.product_id" class="compact-item danger-item">
              <div class="ci-name">{{ item.product_name ?? item.name ?? '—' }}</div>
              <div class="ci-meta">
                <span>Còn: <strong>{{ item.current_stock ?? item.quantity ?? 0 }}</strong></span>
                <span class="divider">|</span>
                <span>Tối thiểu: {{ item.min_stock ?? item.minimum_stock ?? '—' }}</span>
              </div>
            </div>
            <el-empty v-if="!loadingSub && !lowStockList.length" description="Không có sản phẩm tồn kho thấp" :image-size="50" />
          </div>
        </el-card>

        <!-- Pending Orders -->
        <el-card v-loading="loadingSub">
          <template #header>
            <div class="card-header">
              <span class="card-title">📋 Đơn hàng chờ xử lý</span>
              <el-badge :value="pendingOrderList.length" type="warning" />
            </div>
          </template>
          <div class="compact-list">
            <div v-for="order in pendingOrderList" :key="order.id" class="compact-item warning-item">
              <div class="ci-name">{{ order.order_code ?? `#${order.id}` }}</div>
              <div class="ci-meta">
                <span>{{ order.customer_name ?? order.customer?.name ?? '—' }}</span>
                <span class="divider">|</span>
                <span>{{ fmtDate(order.created_at ?? order.order_date) }}</span>
              </div>
            </div>
            <el-empty v-if="!loadingSub && !pendingOrderList.length" description="Không có đơn hàng chờ" :image-size="50" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Refresh, Bell, SuccessFilled, WarningFilled, CircleCloseFilled, InfoFilled } from '@element-plus/icons-vue'
import { getNotifications, getNotificationCount, getLowStockNotifications, getPendingOrderNotifications } from '@/api/notification'

const loading = ref(false)
const loadingSub = ref(false)
const allNotifs = ref([])
const count = ref(0)
const lowStockList = ref([])
const pendingOrderList = ref([])

const notifIcon = (type) => ({ success: SuccessFilled, warning: WarningFilled, danger: CircleCloseFilled, error: CircleCloseFilled }[type] ?? InfoFilled)

const fmtTime = (d) => {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  if (diff < 60000) return 'Vừa xong'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`
  return new Date(d).toLocaleDateString('vi-VN')
}
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'

const fetchAll = async () => {
  loading.value = true
  loadingSub.value = true
  try {
    const [nRes, cRes, lsRes, poRes] = await Promise.allSettled([
      getNotifications(), getNotificationCount(),
      getLowStockNotifications(), getPendingOrderNotifications()
    ])
    allNotifs.value = nRes.value?.data ?? []
    count.value = cRes.value?.count ?? allNotifs.value.length
    lowStockList.value = lsRes.value?.data ?? []
    pendingOrderList.value = poRes.value?.data ?? []
  } finally {
    loading.value = false
    loadingSub.value = false
  }
}

onMounted(fetchAll)
</script>

<style scoped lang="scss">
.notifications-container {
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;
    .page-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .page-description { font-size: 14px; color: var(--text-secondary); margin: 0; }
  }
  .card-header { display: flex; align-items: center; gap: 8px; .card-title { font-weight: 600; font-size: 15px; flex: 1; } }
  .stat-card { border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 14px; border: 1px solid;
    .stat-num { font-size: 28px; font-weight: 800; } .stat-lbl { font-size: 12px; margin-top: 4px; opacity: 0.8; }
    &.stat-primary { background: #409eff15; border-color: #409eff40; color: #2e8be8; }
    &.stat-success { background: #67c23a15; border-color: #67c23a40; color: #5dab30; }
    &.stat-danger  { background: #f56c6c15; border-color: #f56c6c40; color: #e84040; }
    &.stat-warning { background: #e6a23c15; border-color: #e6a23c40; color: #cf8b2c; }
  }
  .notif-list { display: flex; flex-direction: column; gap: 2px; max-height: 520px; overflow-y: auto; }
  .notif-item { display: flex; gap: 12px; padding: 12px; border-radius: 8px; transition: background .15s;
    &:hover { background: var(--bg-hover); }
    .notif-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .notif-title { font-weight: 500; font-size: 14px; }
    .notif-sub { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
    .notif-time { font-size: 11px; color: var(--text-secondary); margin-top: 4px; opacity: 0.7; }
    &.notif-success .notif-icon { background: #67c23a20; color: #67c23a; }
    &.notif-warning .notif-icon { background: #e6a23c20; color: #e6a23c; }
    &.notif-danger, &.notif-error { .notif-icon { background: #f56c6c20; color: #f56c6c; } }
    &.notif-info .notif-icon { background: #409eff20; color: #409eff; }
  }
  .compact-list { display: flex; flex-direction: column; gap: 6px; max-height: 240px; overflow-y: auto;
    .compact-item { padding: 10px 12px; border-radius: 8px; border-left: 3px solid transparent;
      .ci-name { font-weight: 600; font-size: 14px; }
      .ci-meta { font-size: 12px; color: var(--text-secondary); margin-top: 2px; display: flex; gap: 6px; flex-wrap: wrap; .divider { opacity: 0.4; } }
      &.danger-item { background: #f56c6c0a; border-color: #f56c6c; }
      &.warning-item { background: #e6a23c0a; border-color: #e6a23c; }
    }
  }

  // ── Mobile ──────────────────────────────
  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      .page-title { font-size: 18px; }
    }
    .notif-list { max-height: 340px; }
    .compact-list { max-height: 180px; }
  }

  @media (max-width: 480px) {
    .stat-card { padding: 10px 8px;
      .stat-num { font-size: 22px; }
      .stat-lbl { font-size: 11px; }
    }
    .notif-item { padding: 8px;
      .notif-icon { width: 28px; height: 28px; }
      .notif-title { font-size: 13px; }
    }
  }
}
</style>
