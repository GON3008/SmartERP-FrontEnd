import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

// Tạo instance axios
const request = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
})

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
                    ElMessage.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
                    authStore.logout()
                    window.location.href = '/login'
                    break

                case 403:
                    ElMessage.error('Bạn không có quyền thực hiện thao tác này')
                    break

                case 404:
                    ElMessage.error('Không tìm thấy dữ liệu')
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

export default request
