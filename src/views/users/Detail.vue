<template>
  <div class="user-detail" v-loading="loading">
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="$router.back()">Quay lại</el-button>
      <el-button type="primary" :icon="Edit" @click="showForm = true">Chỉnh sửa</el-button>
    </div>

    <div v-if="user" class="detail-layout">
      <!-- Profile Card -->
      <el-card class="profile-card">
        <div class="avatar-section">
          <el-avatar :size="80" :style="{ background: avatarColor(user.name) }" class="big-avatar">{{ initials(user.name) }}</el-avatar>
          <h2 class="user-name">{{ user.name }}</h2>
          <p class="user-email">{{ user.email }}</p>
          <el-tag :type="user.is_active ? 'success' : 'danger'" effect="dark" size="large">
            {{ user.is_active ? 'Đang hoạt động' : 'Vô hiệu hoá' }}
          </el-tag>
        </div>
        <el-divider />
        <div class="info-list">
          <div class="info-row">
            <span class="info-label">ID</span>
            <span class="info-val">#{{ user.id }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Ngày tạo</span>
            <span class="info-val">{{ fmtDate(user.created_at) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cập nhật</span>
            <span class="info-val">{{ fmtDate(user.updated_at) }}</span>
          </div>
        </div>
      </el-card>

      <!-- Roles & Details -->
      <div class="detail-main">
        <el-card class="mb-md">
          <template #header><span class="card-title">Vai trò & Quyền hạn</span></template>
          <div v-if="user.roles?.length">
            <el-tag v-for="r in user.roles" :key="r.id" size="large" effect="light" style="margin:4px">
              {{ r.name }}
            </el-tag>
          </div>
          <el-empty v-else description="Chưa có vai trò nào" :image-size="60" />
          <el-divider v-if="user.roles?.length" />
          <div v-if="allPermissions.length">
            <p class="section-label">Quyền hạn:</p>
            <div class="perm-grid">
              <el-tag v-for="p in allPermissions" :key="p" size="small" type="info" effect="plain">{{ p }}</el-tag>
            </div>
          </div>
        </el-card>

        <el-card>
          <template #header><span class="card-title">Thông tin thêm</span></template>
          <el-descriptions :column="isMobile ? 1 : 2" border>
            <el-descriptions-item label="Email">{{ user.email }}</el-descriptions-item>
            <el-descriptions-item label="Trạng thái">
              <el-tag :type="user.is_active ? 'success' : 'danger'" size="small">{{ user.is_active ? 'Hoạt động' : 'Vô hiệu' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Số vai trò">{{ user.roles?.length ?? 0 }}</el-descriptions-item>
            <el-descriptions-item label="Ngày tạo">{{ fmtDate(user.created_at) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
    </div>

    <UserFormModal v-if="showForm" v-model="showForm" :user="user" @saved="fetchUser" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Edit } from '@element-plus/icons-vue'
import { getUser } from '@/api/users'
import { useResponsive } from '@/composables/useResponsive'
import UserFormModal from '@/components/users/UserFormModal.vue'

const route = useRoute()
const { isMobile } = useResponsive()
const loading = ref(false)
const user = ref(null)
const showForm = ref(false)

const initials = (name = '') => name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
const avatarColor = (name = '') => { const colors = ['#409eff','#67c23a','#e6a23c','#f56c6c','#909399','#0ea5e9']; return colors[name.charCodeAt(0) % colors.length] }
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'

const allPermissions = computed(() => {
  const set = new Set()
  user.value?.roles?.forEach(r => r.permissions?.forEach(p => set.add(p.name ?? p)))
  return [...set]
})

const fetchUser = async () => {
  loading.value = true
  try { const res = await getUser(route.params.id); user.value = res.data ?? null }
  catch { user.value = null }
  finally { loading.value = false }
}

onMounted(fetchUser)
</script>

<style scoped lang="scss">
.user-detail {
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .card-title { font-weight: 600; font-size: 15px; }
  .section-label { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
  .perm-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .detail-layout { display: grid; grid-template-columns: 280px 1fr; gap: 16px;
    @media (max-width: 768px) { grid-template-columns: 1fr; }
  }
  .profile-card {
    .avatar-section { text-align: center; padding: 16px 0; }
    .big-avatar { font-size: 32px; font-weight: 700; margin-bottom: 12px; }
    .user-name { margin: 8px 0 4px; font-size: 20px; font-weight: 700; }
    .user-email { color: var(--text-secondary); font-size: 14px; margin-bottom: 10px; }
    .info-list { display: flex; flex-direction: column; gap: 10px; }
    .info-row { display: flex; justify-content: space-between; font-size: 14px;
      .info-label { color: var(--text-secondary); }
      .info-val { font-weight: 500; }
    }
  }
}
</style>
