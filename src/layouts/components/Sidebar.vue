<template>
  <div class="sidebar-container">
    <div class="logo-container">
      <transition name="fade">
        <div v-if="!isCollapse" class="logo-full">
          <div class="logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#logoGrad)" />
              <path
                d="M7 14l4 4 10-10"
                stroke="#fff"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="28" y2="28">
                  <stop offset="0%" stop-color="#0ea5e9" />
                  <stop offset="100%" stop-color="#0284c7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="logo-text">
            <span class="logo-title">Smart</span><span class="logo-accent">ERP</span>
          </div>
        </div>
        <div v-else class="logo-short">
          <div class="logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#logoGrad2)" />
              <path
                d="M7 14l4 4 10-10"
                stroke="#fff"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <defs>
                <linearGradient id="logoGrad2" x1="0" y1="0" x2="28" y2="28">
                  <stop offset="0%" stop-color="#0ea5e9" />
                  <stop offset="100%" stop-color="#0284c7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </transition>
    </div>

    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapse"
      :collapse-transition="false"
      background-color="transparent"
      text-color="rgba(210, 235, 255, 0.92)"
      active-text-color="#ffffff"
      router
      class="sidebar-menu"
      @select="handleMenuClick"
    >
      <el-menu-item index="/">
        <el-icon><DataAnalysis /></el-icon>
        <template #title>{{ $t("nav.dashboard") }}</template>
      </el-menu-item>

      <el-menu-item index="/customers">
        <el-icon><User /></el-icon>
        <template #title>{{ $t("nav.customers") }}</template>
      </el-menu-item>

      <el-sub-menu index="products">
        <template #title>
          <el-icon><Box /></el-icon>
          <span>{{ $t("nav.products") }}</span>
        </template>
        <el-menu-item index="/products">Danh sách sản phẩm</el-menu-item>
        <el-menu-item index="/products/low-stock">
          <span style="display: flex; align-items: center; gap: 6px">
            Tồn kho thấp
            <el-icon style="color: #f56c6c"><Warning /></el-icon>
          </span>
        </el-menu-item>
      </el-sub-menu>

      <el-menu-item index="/orders">
        <el-icon><Document /></el-icon>
        <template #title>{{ $t("nav.orders") }}</template>
      </el-menu-item>

      <el-sub-menu index="warehouse">
        <template #title>
          <el-icon><OfficeBuilding /></el-icon>
          <span>{{ $t("nav.warehouse") }}</span>
        </template>
        <el-menu-item index="/warehouses">{{ $t("nav.warehouseList") }}</el-menu-item>
        <el-menu-item index="/stock/in">Nhập kho</el-menu-item>
        <el-menu-item index="/stock/out">Xuất kho</el-menu-item>
        <el-menu-item index="/stock/transfer">Chuyển kho</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="hr">
        <template #title>
          <el-icon><Avatar /></el-icon>
          <span>{{ $t("nav.hr") }}</span>
        </template>
        <el-menu-item index="/employees">Nhân viên</el-menu-item>
        <el-menu-item index="/departments">Phòng ban</el-menu-item>
        <el-menu-item index="/positions">Chức vụ</el-menu-item>
        <el-menu-item index="/attendances">Chấm công</el-menu-item>
        <el-menu-item index="/salaries">Bảng lương</el-menu-item>
      </el-sub-menu>

      <el-menu-item index="/production">
        <el-icon><Tools /></el-icon>
        <template #title>Sản xuất</template>
      </el-menu-item>

      <el-sub-menu index="purchasing">
        <template #title>
          <el-icon><ShoppingCart /></el-icon>
          <span>Mua hàng & Tài chính</span>
        </template>
        <el-menu-item index="/suppliers">Nhà cung cấp</el-menu-item>
        <el-menu-item index="/purchase-orders">Phiếu mua hàng</el-menu-item>
        <el-menu-item index="/invoices">Hóa đơn</el-menu-item>
        <el-menu-item index="/payments">Thanh toán</el-menu-item>
        <el-menu-item index="/accounts">Công nợ</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="reports">
        <template #title>
          <el-icon><PieChart /></el-icon>
          <span>{{ $t("nav.reports") }}</span>
        </template>
        <el-menu-item index="/reports/sales">Báo cáo doanh số</el-menu-item>
        <el-menu-item index="/reports/inventory">Báo cáo tồn kho</el-menu-item>
        <el-menu-item index="/reports/production-efficiency"
          >Hiệu suất sản xuất</el-menu-item
        >
        <el-menu-item index="/reports/customers">Báo cáo khách hàng</el-menu-item>
        <el-menu-item index="/reports/financial">Tổng kết tài chính</el-menu-item>
      </el-sub-menu>

      <el-sub-menu index="admin">
        <template #title>
          <el-icon><UserFilled /></el-icon>
          <span>Quản trị hệ thống</span>
        </template>
        <el-menu-item index="/users">Người dùng</el-menu-item>
        <el-menu-item index="/roles">Vai trò</el-menu-item>
        <el-menu-item index="/permissions">Quyền hạn</el-menu-item>
        <el-menu-item index="/notifications">Thông báo</el-menu-item>
        <el-menu-item index="/activity-logs">Nhật ký hoạt động</el-menu-item>
      </el-sub-menu>

      <el-menu-item index="/barcode">
        <el-icon><Crop /></el-icon>
        <template #title>⬛ Barcode / QR Scanner</template>
      </el-menu-item>

      <el-menu-item index="/ocr">
        <el-icon><Document /></el-icon>
        <template #title>🧧 OCR – Đọc hóa đơn</template>
      </el-menu-item>

      <el-menu-item index="/ai/purchase-suggestions">
        <el-icon><MagicStick /></el-icon>
        <template #title>✦ Đề xuất nhập hàng</template>
      </el-menu-item>

      <el-menu-item index="/settings">
        <el-icon><Setting /></el-icon>
        <template #title>{{ $t("nav.settings") }}</template>
      </el-menu-item>
    </el-menu>

    <!-- Bottom user badge -->
    <div v-if="!isCollapse" class="sidebar-footer">
      <div class="status-dot"></div>
      <span class="status-text">System Online</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  DataAnalysis,
  User,
  Box,
  Document,
  OfficeBuilding,
  Avatar,
  PieChart,
  Setting,
  Warning,
  UserFilled,
  Tools,
  MagicStick,
  ShoppingCart,
} from "@element-plus/icons-vue";

defineProps({
  isCollapse: { type: Boolean, default: false },
});

const emit = defineEmits(["menu-click"]);

const route = useRoute();
const activeMenu = computed(() => route.path);

const handleMenuClick = () => {
  emit("menu-click");
};
</script>

<style scoped lang="scss">
// ─── CSS Variables ──────────────────────────────────────────
:root {
  --sidebar-bg-top: #162d47;
  --sidebar-bg-mid: #1a3a5c;
  --sidebar-bg-bot: #112438;
  --accent-cyan: #0ea5e9;
  --accent-cyan-soft: #38bdf8;
  --accent-cyan-glow: rgba(14, 165, 233, 0.3);
  --text-muted: rgba(210, 235, 255, 0.92);
  --text-bright: #ffffff;
  --item-hover-bg: rgba(14, 165, 233, 0.15);
  --item-active-bg: rgba(14, 165, 233, 0.28);
  --border-subtle: rgba(56, 189, 248, 0.3);
}

// ─── Sidebar Container ───────────────────────────────────────
.sidebar-container {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;

  // Lighter navy blue — clean enterprise
  background: linear-gradient(180deg, #162d47 0%, #1a3a5c 40%, #163248 75%, #112438 100%);

  // Subtle top-left cyan mesh highlight
  &::before {
    content: "";
    position: absolute;
    top: -60px;
    left: -60px;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 70%);
    pointer-events: none;
  }

  // Right border accent line
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.4), inset -1px 0 0 rgba(14, 165, 233, 0.15);

  position: relative;

  // Scrollbar
  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(14, 165, 233, 0.3);
    border-radius: 2px;
  }
}

// ─── Logo ────────────────────────────────────────────────────
.logo-container {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(14, 165, 233, 0.5),
      rgba(56, 189, 248, 0.5),
      transparent
    );
  }
}

.logo-full {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  display: flex;
  align-items: center;
  filter: drop-shadow(0 0 10px rgba(14, 165, 233, 0.6));
}

.logo-text {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: 0.5px;
  line-height: 1;
}

.logo-title {
  color: #e0f0ff;
}

.logo-accent {
  color: #38bdf8;
  text-shadow: 0 0 12px rgba(56, 189, 248, 0.7);
}

.logo-short {
  display: flex;
  align-items: center;
  justify-content: center;
}

// ─── Menu ────────────────────────────────────────────────────
.sidebar-menu {
  border-right: none !important;
  background: transparent !important;
  padding: 10px 8px;
  flex: 1;
}

:deep(.el-menu) {
  background: transparent !important;
  // Override Element Plus menu text color so sub-menu titles are always light
  --el-menu-text-color: rgba(210, 235, 255, 0.92);
  --el-menu-hover-text-color: #ffffff;
  --el-menu-active-color: #38bdf8;
}

// Menu items
:deep(.el-menu-item) {
  border-radius: 8px;
  margin-bottom: 2px;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(210, 235, 255, 0.92) !important;
  transition: all 0.2s ease;
  height: 44px;
  line-height: 44px;
  letter-spacing: 0.2px;

  .el-icon {
    font-size: 17px;
    color: rgba(147, 210, 250, 1);
    transition: all 0.2s ease;
  }

  &:hover {
    background: var(--item-hover-bg) !important;
    color: #ffffff !important;

    * {
      color: #ffffff !important;
    }

    .el-icon {
      color: var(--accent-cyan-soft) !important;
    }
  }

  &.is-active {
    background: var(--item-active-bg) !important;
    color: #ffffff !important;
    box-shadow: 0 2px 12px rgba(14, 165, 233, 0.25),
      inset 0 0 0 1px rgba(56, 189, 248, 0.25);

    .el-icon {
      color: var(--accent-cyan-soft) !important;
      filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.7));
    }

    // Left indicator
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 55%;
      background: linear-gradient(180deg, #38bdf8, #0ea5e9);
      border-radius: 0 3px 3px 0;
      box-shadow: 0 0 8px rgba(14, 165, 233, 0.7);
    }
  }
}

// Sub-menu title
:deep(.el-sub-menu__title) {
  border-radius: 8px;
  margin-bottom: 2px;
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(210, 235, 255, 0.92) !important;
  transition: all 0.2s ease;
  height: 44px;
  line-height: 44px;

  // Force text inside (span generated by Element Plus) to be light
  span {
    color: rgba(210, 235, 255, 0.92) !important;
  }

  .el-icon {
    font-size: 17px;
    color: rgba(147, 210, 250, 1);
    transition: all 0.2s ease;
  }

  .el-sub-menu__icon-arrow {
    color: rgba(147, 210, 250, 0.7) !important;
  }

  &:hover {
    background: var(--item-hover-bg) !important;
    color: #ffffff !important;

    span,
    * {
      color: #ffffff !important;
    }

    .el-icon {
      color: var(--accent-cyan-soft) !important;
    }
  }
}

// Sub-menu open state highlight
:deep(.el-sub-menu.is-opened > .el-sub-menu__title) {
  // color: var(--text-bright) !important;
  span {
    color: var(--text-bright) !important;
  }
  .el-icon {
    color: var(--accent-cyan-soft) !important;
  }
}

// Sub-menu children
:deep(.el-sub-menu .el-menu) {
  background: transparent !important;
  padding: 2px 0;

  .el-menu-item {
    height: 38px;
    line-height: 38px;
    padding-left: 50px !important;
    font-size: 13px;
    border-radius: 8px;
    color: rgba(190, 225, 255, 0.9) !important;
    margin-bottom: 1px;
    position: relative;

    // Subtle left line connector
    &::after {
      content: "";
      position: absolute;
      left: 28px;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 1px;
      background: rgba(56, 189, 248, 0.2);
    }

    &:hover {
      background: var(--item-hover-bg) !important;
      color: rgba(224, 240, 255, 0.9) !important;
    }

    &.is-active {
      color: #38bdf8 !important;
      background: rgba(14, 165, 233, 0.12) !important;
    }
  }
}

// ─── Footer ──────────────────────────────────────────────────
.sidebar-footer {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-top: 1px solid rgba(14, 165, 233, 0.1);
  margin: 4px 8px 8px;
  border-radius: 0 0 8px 8px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22d3ee;
  box-shadow: 0 0 6px rgba(34, 211, 238, 0.8);
  animation: pulse 2.5s ease-in-out infinite;
  flex-shrink: 0;
}

.status-text {
  font-size: 11.5px;
  color: rgba(148, 210, 245, 0.7);
  letter-spacing: 0.5px;
  font-weight: 500;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 6px rgba(34, 211, 238, 0.8);
  }
  50% {
    opacity: 0.6;
    box-shadow: 0 0 12px rgba(34, 211, 238, 0.4);
  }
}

// ─── Global Element Plus hover override ──────────────────────
:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  color: #ffffff !important;
  span {
    color: #ffffff !important;
  }
}

// ─── Transition ──────────────────────────────────────────────
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
