<template>
  <!-- Desktop Header -->
  <div class="page-header flex-between" v-if="!isMobile">
    <div>
      <h1 class="page-title">{{ title }}</h1>
      <p class="page-description" v-if="description">{{ description }}</p>
    </div>
    <slot name="actions">
      <el-button
        v-if="addLabel"
        type="primary"
        :icon="Plus"
        @click="$emit('add')"
      >
        {{ addLabel }}
      </el-button>
    </slot>
  </div>

  <!-- Mobile Header -->
  <div class="mobile-page-header" v-else>
    <h2 class="mobile-title">{{ title }}</h2>
    <slot name="mobile-actions" />
  </div>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue'
import { useResponsive } from '@/composables/useResponsive'

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  addLabel: { type: String, default: '' }
})

defineEmits(['add'])

const { isMobile } = useResponsive()
</script>

<style scoped lang="scss">
.mobile-page-header {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .mobile-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
}
</style>
