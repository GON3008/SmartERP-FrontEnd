<template>
  <div class="card-info-row" v-if="value">
    <el-icon class="row-icon" v-if="icon">
      <component :is="icon" />
    </el-icon>
    <span class="row-value">{{ value }}</span>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: [Object, String], default: null },
  value: { type: String, default: '' }
})
</script>

<style scoped lang="scss">
.card-info-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;

  .row-icon {
    font-size: 15px;
    color: var(--text-secondary);
    margin-top: 2px;
    flex-shrink: 0;
  }

  .row-value {
    font-size: 13px;
    color: var(--text-regular);
    line-height: 1.5;
    word-break: break-word;
  }
}
</style>
