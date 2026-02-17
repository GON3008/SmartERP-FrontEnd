import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable for responsive breakpoint detection
 * Returns reactive boolean values for different screen sizes
 */
export function useResponsive() {
    const windowWidth = ref(window.innerWidth)

    const isMobile = ref(windowWidth.value < 768)
    const isTablet = ref(windowWidth.value >= 768 && windowWidth.value < 1024)
    const isDesktop = ref(windowWidth.value >= 1024)
    const isSmallMobile = ref(windowWidth.value < 640)

    const updateWidth = () => {
        windowWidth.value = window.innerWidth
        isMobile.value = windowWidth.value < 768
        isTablet.value = windowWidth.value >= 768 && windowWidth.value < 1024
        isDesktop.value = windowWidth.value >= 1024
        isSmallMobile.value = windowWidth.value < 640
    }

    onMounted(() => {
        window.addEventListener('resize', updateWidth)
    })

    onUnmounted(() => {
        window.removeEventListener('resize', updateWidth)
    })

    return {
        windowWidth,
        isMobile,
        isTablet,
        isDesktop,
        isSmallMobile
    }
}
