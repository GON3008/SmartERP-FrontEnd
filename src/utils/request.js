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

// Flag để tránh logout nhiều lần liên tiếp
let isLoggingOut = false

// Request interceptor - Thêm token vào header
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

// Response interceptor - Xử lý lỗi
request.interceptors.response.use(
    (response) => {
        return response.data
    },
    async (error) => {
        const authStore = useAuthStore()

        if (error.response) {
            const { status, data } = error.response

            switch (status) {
                case 401:
                    // Token hết hạn hoặc không hợp lệ
                    // Tránh gọi nhiều lần khi có nhiều request đồng thời
                    if (!isLoggingOut) {
                        isLoggingOut = true
                        ElMessage.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
                        // Xóa token đồng bộ khỏi store và localStorage trước
                        authStore.token = ''
                        authStore.user = null
                        authStore.refreshToken = ''
                        localStorage.removeItem('token')
                        localStorage.removeItem('refreshToken')
                        localStorage.removeItem('user')
                        // Redirect về login sau khi đã xóa token
                        setTimeout(() => {
                            isLoggingOut = false
                            router.push({ name: 'Login' })
                        }, 1500)
                    }
                    break

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
            // Không hiện lỗi mạng nếu đang trong quá trình logout
            if (!isLoggingOut) {
                ElMessage.error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.')
            }
        } else {
            ElMessage.error('Có lỗi xảy ra: ' + error.message)
        }

        return Promise.reject(error)
    }
)

export default request
