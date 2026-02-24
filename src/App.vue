<template>
  <router-view />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

const SKIP_ROUTES = ['Maintenance']

async function pollMaintenance() {
  // Don't interfere with auth/maintenance pages
  if (SKIP_ROUTES.includes(route.name)) return

  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/maintenance-status`,
      { timeout: 3000 }
    )
    if (res.data?.enabled === true) {
      // Super Admin bypasses maintenance
      const roles = authStore.userRoles?.map(r => typeof r === 'string' ? r : r?.name).filter(Boolean) ?? []
      const isSuperAdmin = roles.some(r => ['Super Admin', 'super-admin', 'superadmin', 'SuperAdmin'].includes(r))
      if (!isSuperAdmin) {
        router.replace({ name: 'Maintenance' })
      }
    }
  } catch {
    // 404 = maintenance OFF; network error = don't redirect
  }
}

let _pollTimer = null

onMounted(() => {
  // Poll every 30 seconds in the background
  _pollTimer = setInterval(pollMaintenance, 30000)
})

onUnmounted(() => {
  clearInterval(_pollTimer)
})
</script>

<style scoped>
/* App styles */
</style>
