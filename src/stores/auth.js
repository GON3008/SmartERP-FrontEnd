import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi, getProfile } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
    // State
    const token = ref(localStorage.getItem('token') || '')
    const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
    const refreshToken = ref(localStorage.getItem('refreshToken') || '')

    // Getters
    const isAuthenticated = computed(() => !!token.value)
    const currentUser = computed(() => user.value)
    const userPermissions = computed(() => user.value?.permissions || [])
    const userRoles = computed(() => user.value?.roles || [])

    // Actions
    async function login(credentials) {
        try {
            const response = await loginApi(credentials)

            // Lưu token và user info
            token.value = response.access_token
            refreshToken.value = response.refresh_token || ''
            user.value = response.user

            // Lưu vào localStorage
            localStorage.setItem('token', response.access_token)
            if (response.refresh_token) {
                localStorage.setItem('refreshToken', response.refresh_token)
            }
            localStorage.setItem('user', JSON.stringify(response.user))

            return response
        } catch (error) {
            throw error
        }
    }

    async function logout() {
        try {
            await logoutApi()
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            // Xóa token và user info
            token.value = ''
            refreshToken.value = ''
            user.value = null

            // Xóa khỏi localStorage
            localStorage.removeItem('token')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
        }
    }

    async function fetchUserProfile() {
        try {
            const response = await getProfile()
            user.value = response.user
            localStorage.setItem('user', JSON.stringify(response.user))
            return response
        } catch (error) {
            throw error
        }
    }

    function hasPermission(permission) {
        return userPermissions.value.includes(permission)
    }

    function hasRole(role) {
        return userRoles.value.includes(role)
    }

    return {
        // State
        token,
        user,
        refreshToken,

        // Getters
        isAuthenticated,
        currentUser,
        userPermissions,
        userRoles,

        // Actions
        login,
        logout,
        fetchUserProfile,
        hasPermission,
        hasRole,
    }
})
