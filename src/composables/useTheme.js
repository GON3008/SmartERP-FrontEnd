// import { ref, watch } from 'vue'

// const THEME_KEY = 'theme'
// const isDark = ref(false)

// // Initialize theme from localStorage or system preference
// const initTheme = () => {
//     const savedTheme = localStorage.getItem(THEME_KEY)

//     if (savedTheme) {
//         isDark.value = savedTheme === 'dark'
//     } else {
//         // Check system preference
//         isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
//     }

//     applyTheme()
// }

// // Apply theme to document
// const applyTheme = () => {
//     if (isDark.value) {
//         document.documentElement.classList.add('dark')
//         document.documentElement.classList.remove('light')
//     } else {
//         document.documentElement.classList.add('light')
//         document.documentElement.classList.remove('dark')
//     }
// }

// // Watch for theme changes
// watch(isDark, (newValue) => {
//     localStorage.setItem(THEME_KEY, newValue ? 'dark' : 'light')
//     applyTheme()
// })

// export function useTheme() {
//     const toggleTheme = () => {
//         isDark.value = !isDark.value
//     }

//     return {
//         isDark,
//         toggleTheme,
//         initTheme
//     }
// }
