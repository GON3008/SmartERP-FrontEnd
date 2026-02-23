<template>
  <div class="activity-logs-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Nhật ký hoạt động</h1>
        <p class="page-description">Lịch sử thao tác trong hệ thống</p>
      </div>
    </div>

    <!-- Stats from statistics endpoint -->
    <el-row :gutter="12" class="mb-md" v-if="stats">
      <el-col :xs="12" :sm="6">
        <div class="stat-card stat-primary">
          <div class="stat-num">{{ stats.total_logs ?? 0 }}</div>
          <div class="stat-lbl">Tổng log</div>
        </div>
      </el-col>
      <el-col v-for="a in (stats.by_action ?? []).slice(0,3)" :key="a.action" :xs="12" :sm="6">
        <div class="stat-card" :style="actionCardStyle(a.action)">
          <div class="stat-num">{{ a.count }}</div>
          <div class="stat-lbl">{{ actionLabel(a.action) }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- Filters -->
    <el-card class="mb-md">
      <el-form :inline="!isMobile" :model="filter">
        <el-form-item>
          <el-select v-model="filter.action" placeholder="Hành động" clearable style="width:140px">
            <el-option v-for="a in actions" :key="a.val" :label="a.label" :value="a.val" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="filter.table_name" placeholder="Module" clearable style="width:160px">
            <el-option v-for="t in tables" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-date-picker v-model="filter.from_date" type="date" placeholder="Từ ngày" value-format="YYYY-MM-DD" style="width:140px" />
        </el-form-item>
        <el-form-item>
          <el-date-picker v-model="filter.to_date" type="date" placeholder="Đến ngày" value-format="YYYY-MM-DD" style="width:140px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchLogs">Tìm kiếm</el-button>
          <el-button :icon="Refresh" @click="handleReset">Đặt lại</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Table -->
    <el-card>
      <el-table v-loading="loading" :data="logs" stripe style="width:100%">
        <el-table-column label="Thời gian" width="155">
          <template #default="{ row }">
            <div class="time-cell">
              <div class="time-main">{{ fmtDateTime(row.created_at) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Người thực hiện" min-width="140">
          <template #default="{ row }">
            <div class="user-cell" v-if="row.user">
              <el-avatar :size="26" :style="{ background: avatarColor(row.user.name), fontSize: '11px' }">
                {{ initials(row.user.name) }}
              </el-avatar>
              <span class="user-name">{{ row.user.name }}</span>
            </div>
            <span class="text-muted" v-else>Hệ thống</span>
          </template>
        </el-table-column>
        <el-table-column label="Hành động" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="actionTagType(row.action)" size="small" effect="light">{{ actionLabel(row.action) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Module" width="160">
          <template #default="{ row }">
            <span class="module-chip">{{ row.table_name ?? '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="ID bản ghi" width="100" align="center">
          <template #default="{ row }">{{ row.record_id ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="Mô tả" min-width="200">
          <template #default="{ row }">
            <span class="desc-text">{{ row.description ?? row.message ?? '—' }}</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !logs.length" description="Không có nhật ký nào" />
      <div class="pagination-bar" v-if="total > perPage">
        <el-pagination v-model:current-page="page" :page-size="perPage" :total="total" layout="prev, pager, next" @current-change="fetchLogs" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getActivityLogs, getActivityLogStatistics } from '@/api/activityLog'
import { useResponsive } from '@/composables/useResponsive'

const { isMobile } = useResponsive()
const loading = ref(false)
const logs = ref([])
const total = ref(0)
const page = ref(1)
const perPage = 20
const stats = ref(null)

const filter = reactive({ action: '', table_name: '', from_date: '', to_date: '' })

const actions = [
  { val: 'created', label: 'Tạo mới' }, { val: 'updated', label: 'Cập nhật' },
  { val: 'deleted', label: 'Xoá' }, { val: 'started', label: 'Bắt đầu' },
  { val: 'completed', label: 'Hoàn thành' }, { val: 'cancelled', label: 'Huỷ' },
]

// Unique table names discovered from logs
const tables = computed(() => [...new Set(logs.value.map(l => l.table_name).filter(Boolean))])

const actionLabel = (a) => ({ created: 'Tạo mới', updated: 'Cập nhật', deleted: 'Xoá', started: 'Bắt đầu', completed: 'Hoàn thành', cancelled: 'Huỷ' }[a] ?? a ?? '—')
const actionTagType = (a) => ({ created: 'success', updated: 'primary', deleted: 'danger', started: 'info', completed: 'success', cancelled: 'warning' }[a] ?? 'info')
const actionCardStyle = (a) => {
  const colors = { created: ['#67c23a15','#67c23a40','#5dab30'], updated: ['#409eff15','#409eff40','#2e8be8'], deleted: ['#f56c6c15','#f56c6c40','#e84040'] }
  const [bg, border, color] = colors[a] ?? ['#90939915','#90939940','#666']
  return { background: bg, borderColor: border, color }
}

const initials = (name = '') => name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
const avatarColor = (name = '') => ['#409eff','#67c23a','#e6a23c','#f56c6c','#0ea5e9'][name.charCodeAt(0) % 5]
const fmtDateTime = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return `${dt.toLocaleDateString('vi-VN')} ${dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
}

const fetchStats = async () => {
  try { const r = await getActivityLogStatistics(); stats.value = r ?? null } catch {}
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = { page: page.value, per_page: perPage }
    if (filter.action) params.action = filter.action
    if (filter.table_name) params.table_name = filter.table_name
    if (filter.from_date) params.from_date = filter.from_date
    if (filter.to_date) params.to_date = filter.to_date
    const res = await getActivityLogs(params)
    // ActivityLogController returns paginated directly (not wrapped in data key)
    logs.value = res.data ?? []
    total.value = res.total ?? res.meta?.total ?? logs.value.length
  } catch { logs.value = [] }
  finally { loading.value = false }
}

const handleReset = () => { filter.action = ''; filter.table_name = ''; filter.from_date = ''; filter.to_date = ''; page.value = 1; fetchLogs() }

onMounted(() => { fetchStats(); fetchLogs() })
</script>

<style scoped lang="scss">
.activity-logs-container {
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
    .page-title { font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .page-description { font-size: 14px; color: var(--text-secondary); margin: 0; }
  }
  .stat-card { border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 14px; border: 1px solid;
    .stat-num { font-size: 28px; font-weight: 800; } .stat-lbl { font-size: 12px; margin-top: 4px; opacity: 0.8; }
    &.stat-primary { background: #409eff15; border-color: #409eff40; color: #2e8be8; }
  }
  .time-cell { .time-main { font-size: 13px; font-variant-numeric: tabular-nums; } }
  .user-cell { display: flex; align-items: center; gap: 7px; .user-name { font-size: 13px; font-weight: 500; } }
  .text-muted { color: var(--text-secondary); font-size: 12px; }
  .module-chip { font-family: monospace; font-size: 12px; background: var(--bg-hover); border: 1px solid var(--border-color); padding: 2px 8px; border-radius: 4px; }
  .desc-text { font-size: 13px; color: var(--text-secondary); }
  .pagination-bar { display: flex; justify-content: center; margin-top: 16px; }
}
</style>
