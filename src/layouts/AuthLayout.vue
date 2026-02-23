<template>
  <div class="auth-layout">
    <!-- Background decoration -->
    <div class="auth-bg">
      <div class="bg-blob blob-1"></div>
      <div class="bg-blob blob-2"></div>
      <div class="bg-blob blob-3"></div>
    </div>

    <!-- Content -->
    <div class="auth-content">
      <!-- Logo -->
      <div class="auth-logo">
        <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="url(#authLogoGrad)"/>
          <path d="M7 14l4 4 10-10" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <defs>
            <linearGradient id="authLogoGrad" x1="0" y1="0" x2="28" y2="28">
              <stop offset="0%" stop-color="#0ea5e9"/>
              <stop offset="100%" stop-color="#0284c7"/>
            </linearGradient>
          </defs>
        </svg>
        <span class="auth-logo-text">Smart<span class="accent">ERP</span></span>
      </div>

      <!-- Slot for Login / Register etc -->
      <router-view v-slot="{ Component }">
        <transition name="slide-up" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>

      <p class="auth-footer">© {{ year }} SmartERP — All rights reserved</p>
    </div>
  </div>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped lang="scss">
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);
}

.auth-bg {
  position: absolute; inset: 0; pointer-events: none;
  .bg-blob {
    position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.25;
  }
  .blob-1 { width: 500px; height: 500px; background: #0ea5e9; top: -150px; left: -150px; }
  .blob-2 { width: 400px; height: 400px; background: #6366f1; bottom: -100px; right: -100px; }
  .blob-3 { width: 300px; height: 300px; background: #0284c7; top: 50%; left: 50%; transform: translate(-50%,-50%); }
}

.auth-content {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center; gap: 20px;
  width: 100%; max-width: 480px; padding: 16px;
}

.auth-logo {
  display: flex; align-items: center; gap: 10px;
  .auth-logo-text {
    font-size: 24px; font-weight: 800; color: #e0f0ff; letter-spacing: 0.5px;
    .accent { color: #38bdf8; text-shadow: 0 0 12px rgba(56,189,248,.6); }
  }
}

.auth-footer { font-size: 12px; color: rgba(148,210,245,.5); text-align: center; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.25s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(16px); }
.slide-up-leave-to  { opacity: 0; transform: translateY(-8px); }
</style>
