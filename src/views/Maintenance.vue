<template>
  <div class="maintenance-page">
    <div class="maintenance-card">
      <div class="maintenance-icon">🔧</div>
      <h1>Hệ thống đang bảo trì</h1>
      <p class="maintenance-msg">{{ message }}</p>
      <div class="maintenance-meta">
        <el-icon><Clock /></el-icon>
        <span
          >Tự kiểm tra sau <strong>{{ countdown }}s</strong></span
        >
      </div>
      <el-button class="retry-btn" @click="retry" :loading="retrying">
        ↺&nbsp;Thử lại ngay
      </el-button>
      <div class="admin-link">
        <router-link :to="{ name: 'Login' }">Bạn là Admin? Đăng nhập tại đây</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { Clock } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();
const retrying = ref(false);
const countdown = ref(30);
const message = ref("Hệ thống đang được nâng cấp, vui lòng quay lại sau...");

let pollInterval = null;
let countdownTimer = null;

function clearAll() {
  clearInterval(pollInterval);
  clearInterval(countdownTimer);
}

/**
 * Fetch maintenance status from the dedicated API route.
 * This route uses withoutMiddleware(PreventRequestsDuringMaintenance)
 * and sets manual CORS headers, so it always responds correctly.
 */
async function fetchMaintenanceMessage() {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/maintenance-status`,
      { timeout: 3000 }
    );
    if (res.data?.message) {
      message.value = res.data.message;
    }
  } catch {
    // keep default message
  }
}

async function checkAndRedirect() {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/maintenance-status`,
      { timeout: 3000 }
    );
    if (res.data?.enabled !== true) {
      // Maintenance is OFF → redirect home
      clearAll();
      router.replace("/");
    }
    // else: still in maintenance, do nothing
  } catch {
    // Network error → stay on page to be safe
  }
}

async function retry() {
  retrying.value = true;
  await checkAndRedirect();
  retrying.value = false;
  // Reset countdown after manual retry
  countdown.value = 30;
}

onMounted(async () => {
  // Load the message saved by the admin first
  await fetchMaintenanceMessage();

  // Auto-check every 30 seconds
  pollInterval = setInterval(() => {
    checkAndRedirect();
    countdown.value = 30;
  }, 30000);

  // Countdown display
  countdownTimer = setInterval(() => {
    if (countdown.value > 0) countdown.value--;
  }, 1000);
});

onUnmounted(() => clearAll());
</script>

<style scoped lang="scss">
.maintenance-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
}

.maintenance-card {
  text-align: center;
  padding: 60px 48px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  backdrop-filter: blur(12px);
  max-width: 480px;
  width: 90%;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.maintenance-icon {
  font-size: 72px;
  margin-bottom: 24px;
  display: inline-block;
  animation: spin-slow 4s linear infinite;
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

h1 {
  font-size: 28px;
  font-weight: 800;
  color: #f1f5f9;
  margin: 0 0 16px;
}

.maintenance-msg {
  font-size: 15px;
  color: #94a3b8;
  line-height: 1.7;
  margin: 0 0 24px;
}

.maintenance-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #38bdf8;
  font-size: 14px;
  margin-bottom: 32px;
}

.retry-btn {
  background: linear-gradient(135deg, #0ea5e9, #6366f1) !important;
  border: none !important;
  color: #fff !important;
  padding: 12px 36px !important;
  border-radius: 12px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
}

.admin-link {
  margin-top: 20px;
  a {
    font-size: 12px;
    color: #475569;
    text-decoration: none;
    &:hover {
      color: #94a3b8;
    }
  }
}
</style>
