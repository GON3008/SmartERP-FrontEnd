import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// Tạo instance axios
const request = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 30000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    }
})

// Refresh Token Logic 

let isRefreshing = false          // Đang gọi refresh hay không
let failedQueue = []              // Hàng chờ các request bị lỗi 401 trong lúc refresh

/**
 * Xử lý hàng chờ sau khi refresh xong
 * @param {Error|null} error  - null nếu refresh thành công
 * @param {string|null} token - token mới nếu thành công
 */
function processQueue(error, token = null) {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error)
        } else {
            resolve(token)
        }
    })
    failedQueue = []
}

/**
 * Thực hiện gọi API refresh token (dùng axios thuần để tránh vòng lặp interceptor)
 */
async function callRefreshToken(refreshToken) {
    const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            withCredentials: true,
        }
    )
    return response.data
}

// Request Interceptor

request.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore()
        const token = authStore.token

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => {
        console.error('Request error:', error)
        return Promise.reject(error)
    }
)

// Response Interceptor 

request.interceptors.response.use(
    (response) => {
        return response.data
    },
    async (error) => {
        const authStore = useAuthStore()
        const originalRequest = error.config

        if (error.response) {
            const { status, data } = error.response

            //401: Thử refresh token trước khi logout
            if (status === 401 && !originalRequest._retry) {
                const storedRefreshToken = authStore.refreshToken

                // Không có refresh token → logout ngay
                if (!storedRefreshToken) {
                    return forceLogout(authStore)
                }

                // Đang trong quá trình refresh → đưa request vào hàng chờ
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject })
                    })
                        .then((newToken) => {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`
                            return request(originalRequest)
                        })
                        .catch((err) => Promise.reject(err))
                }

                // Bắt đầu refresh
                originalRequest._retry = true
                isRefreshing = true

                try {
                    const refreshData = await callRefreshToken(storedRefreshToken)
                    const newAccessToken = refreshData.access_token
                    const newRefreshToken = refreshData.refresh_token

                    // Cập nhật store và localStorage
                    authStore.token = newAccessToken
                    localStorage.setItem('token', newAccessToken)

                    if (newRefreshToken) {
                        authStore.refreshToken = newRefreshToken
                        localStorage.setItem('refreshToken', newRefreshToken)
                    }

                    // Giải phóng hàng chờ với token mới
                    processQueue(null, newAccessToken)

                    // Retry lại request gốc với token mới
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                    return request(originalRequest)

                } catch (refreshError) {
                    // Refresh thất bại → xóa hàng chờ và logout
                    processQueue(refreshError, null)
                    return forceLogout(authStore)
                } finally {
                    isRefreshing = false
                }
            }

            // lỗi HTTP khác
            switch (status) {
                case 401:
                    // Đã qua _retry mà vẫn 401 → logout
                    return forceLogout(authStore)

                case 403:
                    ElMessage.error('Bạn không có quyền thực hiện thao tác này')
                    break

                case 404:
                    ElMessage.error('Không tìm thấy dữ liệu')
                    break

                case 419:
                    // CSRF token mismatch
                    ElMessage.error('Phiên làm việc đã hết hạn. Vui lòng tải lại trang.')
                    setTimeout(() => window.location.reload(), 1500)
                    break

                case 422:
                    // Validation errors
                    if (data.errors) {
                        const firstError = Object.values(data.errors)[0]
                        ElMessage.error(Array.isArray(firstError) ? firstError[0] : firstError)
                    } else {
                        ElMessage.error(data.message || 'Dữ liệu không hợp lệ')
                    }
                    break

                case 500:
                    ElMessage.error('Lỗi máy chủ. Vui lòng thử lại sau.')
                    break

                default:
                    ElMessage.error(data.message || 'Có lỗi xảy ra')
            }

        } else if (error.request) {
            ElMessage.error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.')
        } else {
            ElMessage.error('Có lỗi xảy ra: ' + error.message)
        }

        return Promise.reject(error)
    }
)

// Force Logout

let isLoggingOut = false

function forceLogout(authStore) {
    if (!isLoggingOut) {
        isLoggingOut = true
        ElMessage.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')

        authStore.token = ''
        authStore.refreshToken = ''
        authStore.user = null
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')

        setTimeout(() => {
            isLoggingOut = false
            router.push({ name: 'Login' })
        }, 1500)
    }
    return Promise.reject(new Error('Session expired'))
}

export default request
