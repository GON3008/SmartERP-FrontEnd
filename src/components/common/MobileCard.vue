<template>
  <div class="mobile-card">
    <!-- Card Header -->
    <div class="mobile-card__header">
      <div class="mobile-card__title">
        <el-icon class="title-icon" v-if="icon">
          <component :is="icon" />
        </el-icon>
        <span class="title-text">{{ title }}</span>
      </div>

      <!-- Actions dropdown -->
      <el-dropdown
        v-if="actions && actions.length"
        trigger="click"
        @command="(cmd) => $emit('action', cmd)"
      >
        <el-icon class="more-icon"><MoreFilled /></el-icon>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="action in actions"
              :key="action.command"
              :command="action.command"
              :divided="action.divided"
            >
              <el-icon v-if="action.icon"><component :is="action.icon" /></el-icon>
              {{ action.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- Card Body - info rows via slot or default -->
    <div class="mobile-card__body">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { MoreFilled } from '@element-plus/icons-vue'

defineProps({
  title: { type: String, required: true },
  icon: { type: [Object, String], default: null },
  actions: {
    type: Array,
    default: () => []
    // [{ command: 'edit', label: 'Sửa', icon: Edit }, ...]
  }
})

defineEmits(['action'])
</script>

<style scoped lang="scss">
.mobile-card {
  background: var(--bg-color);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:active {
    transform: scale(0.985);
  }
}

.mobile-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-lighter);

  .mobile-card__title {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;

    .title-icon {
      font-size: 20px;
      color: var(--primary-color);
      flex-shrink: 0;
    }

    .title-text {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .more-icon {
    font-size: 20px;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.15s ease;

    &:hover { background: var(--bg-page); }
    &:active { transform: scale(0.9); }
  }
}

.mobile-card__body {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
