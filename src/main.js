import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import viLocale from 'element-plus/dist/locale/vi.mjs'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import './assets/styles/global.scss'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

// Cấu hình Element Plus với locale tiếng Việt
app.use(ElementPlus, {
    locale: viLocale,
})

// Đăng ký tất cả icons của Element Plus
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.use(pinia)
app.use(router)

app.mount('#app')
