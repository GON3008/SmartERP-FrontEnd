<template>
  <el-dropdown trigger="click" @command="handleLanguageChange" class="language-switcher">
    <div class="language-button">
      <img :src="currentFlag" :alt="currentLanguageLabel" class="flag-icon" />
      <el-icon class="arrow-icon"><ArrowDown /></el-icon>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="vi" :class="{ 'is-active': locale === 'vi' }">
          <img src="@/assets/images/vn.png" alt="Vietnamese" class="flag" />
          Tiếng Việt
        </el-dropdown-item>
        <el-dropdown-item command="en" :class="{ 'is-active': locale === 'en' }">
          <img src="@/assets/images/en.png" alt="English" class="flag" />
          English
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import vnFlag from '@/assets/images/vn.png'
import enFlag from '@/assets/images/en.png'

const { locale } = useI18n()

const currentFlag = computed(() => {
  return locale.value === 'vi' ? vnFlag : enFlag
})

const currentLanguageLabel = computed(() => {
  return locale.value === 'vi' ? 'Tiếng Việt' : 'English'
})

const handleLanguageChange = (lang) => {
  locale.value = lang
  localStorage.setItem('locale', lang)
  ElMessage.success(
    lang === 'vi' 
      ? 'Đã chuyển sang Tiếng Việt' 
      : 'Switched to English'
  )
  
  // Reload page to update Element Plus locale
  window.location.reload()
}
</script>

<style scoped lang="scss">
.language-switcher {
  cursor: pointer;
}

.language-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-base);
  transition: var(--transition-fast);
  
  &:hover {
    background-color: var(--bg-page);
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  @media (max-width: 767px) {
    padding: 4px 8px;
    
    .arrow-icon {
      display: none;
    }
  }
}

.flag-icon {
  width: 24px;
  height: 24px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.flag {
  width: 20px;
  height: 20px;
  object-fit: cover;
  border-radius: 3px;
  margin-right: 8px;
}

:deep(.el-dropdown-menu__item) {
  &.is-active {
    color: var(--primary-color);
    background-color: var(--primary-color-light-9);
  }
}
</style>
