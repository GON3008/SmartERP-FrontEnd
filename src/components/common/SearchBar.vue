<template>
  <el-card class="search-bar-card mb-md">
    <el-form
      :inline="!isMobile"
      :model="formModel"
      class="search-bar-form"
    >
      <!-- Search Input -->
      <el-form-item :label="searchLabel" class="search-input-item">
        <el-input
          v-model="keyword"
          :placeholder="placeholder"
          :prefix-icon="Search"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
      </el-form-item>

      <!-- Extra filters slot -->
      <slot name="filters" />

      <!-- Buttons -->
      <el-form-item class="search-btn-item">
        <el-button type="primary" :icon="Search" @click="handleSearch">
          {{ searchText }}
        </el-button>
        <el-button :icon="Refresh" @click="handleReset">
          {{ resetText }}
        </el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useResponsive } from '@/composables/useResponsive'

const props = defineProps({
  placeholder: { type: String, default: '' },
  searchLabel: { type: String, default: '' },
  debounce: { type: Number, default: 500 }
})

const emit = defineEmits(['search', 'reset'])

const { t } = useI18n()
const { isMobile } = useResponsive()

const searchText = computed(() => t('common.search'))
const resetText = computed(() => t('common.reset'))

const keyword = ref('')
const formModel = { keyword }

let debounceTimer = null

// Auto-search with debounce
watch(keyword, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('search', keyword.value)
  }, props.debounce)
})

const handleSearch = () => {
  clearTimeout(debounceTimer)
  emit('search', keyword.value)
}

const handleReset = () => {
  clearTimeout(debounceTimer)
  keyword.value = ''
  emit('reset')
}

defineExpose({ keyword })
</script>

<style scoped lang="scss">
.search-bar-card {
  @media (max-width: 767px) {
    margin-bottom: 12px;
  }
}

.search-bar-form {
  @media (max-width: 767px) {
    .search-input-item {
      width: 100%;
      margin-right: 0;
      margin-bottom: 12px;

      :deep(.el-input) { width: 100%; }
    }

    .search-btn-item {
      width: 100%;
      margin-right: 0;

      :deep(.el-form-item__content) {
        display: flex;
        gap: 8px;
      }

      .el-button { flex: 1; }
    }
  }
}
</style>
