import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import viLocale from 'element-plus/dist/locale/vi.mjs'
import enLocale from 'element-plus/dist/locale/en.mjs'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './assets/styles/global.scss'

import App from './App.vue'
import router from './router'
import i18n from './locales'
// import { useTheme } from './composables/useTheme'

// // Initialize theme before app mount
// const { initTheme } = useTheme()
// initTheme()

const app = createApp(App)
const pinia = createPinia()

// Get current locale from i18n
const currentLocale = i18n.global.locale.value

// Cấu hình Element Plus với locale động
app.use(ElementPlus, {
    locale: currentLocale === 'vi' ? viLocale : enLocale,
})

// Đăng ký tất cả icons của Element Plus
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(i18n)

app.mount('#app')
