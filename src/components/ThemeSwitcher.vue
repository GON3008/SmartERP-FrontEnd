<!-- <template>
  <div class="theme-switcher" @click="handleToggle">
    <el-icon class="theme-icon">
      <Sunny v-if="isDark" />
      <Moon v-else />
    </el-icon>
  </div>
</template>

<script setup>
import { Sunny, Moon } from '@element-plus/icons-vue'
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()

const handleToggle = () => {
  toggleTheme()
}
</script>

<style scoped lang="scss">
.theme-switcher {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: var(--transition-fast);
  
  &:hover {
    background-color: var(--bg-page);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.theme-icon {
  font-size: 20px;
  color: var(--text-primary);
  transition: transform 0.3s ease;
  
  .theme-switcher:hover & {
    transform: rotate(20deg);
  }
}
</style> -->
