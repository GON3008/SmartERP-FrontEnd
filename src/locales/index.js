import { createI18n } from 'vue-i18n'
import vi from './vi'
import en from './en'

const messages = {
    vi,
    en
}

// Get saved language from localStorage or default to Vietnamese
const savedLocale = localStorage.getItem('locale') || 'vi'

const i18n = createI18n({
    legacy: false, // Use Composition API mode
    locale: savedLocale,
    fallbackLocale: 'vi',
    messages,
    globalInjection: true
})

export default i18n
