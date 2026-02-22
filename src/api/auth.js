import request from '@/utils/request'

/**
 * Đăng nhập
 */
export function login(data) {
    return request({
        url: '/auth/login',
        method: 'post',
        data
    })
}

/**
 * Đăng ký tài khoản mới
 */
export function register(data) {
    return request({
        url: '/auth/register',
        method: 'post',
        data
    })
}

/**
 * Đăng xuất
 */
export function logout() {
    return request({
        url: '/auth/logout',
        method: 'post'
    })
}

/**
 * Lấy thông tin profile người dùng
 */
export function getProfile() {
    return request({
        url: '/profile',
        method: 'get'
    })
}

/**
 * Refresh token
 */
export function refreshToken() {
    return request({
        url: '/auth/refresh',
        method: 'post'
    })
}

/**
 * Đổi mật khẩu (khi đã đăng nhập)
 */
export function changePassword(data) {
    return request({
        url: '/auth/change-password',
        method: 'post',
        data
    })
}

/**
 * Quên mật khẩu – gửi email OTP/link
 */
export function forgotPassword(data) {
    return request({
        url: '/auth/forgot-password',
        method: 'post',
        data
    })
}

/**
 * Đặt lại mật khẩu qua token trong email
 */
export function resetPassword(data) {
    return request({
        url: '/auth/reset-password',
        method: 'post',
        data
    })
}
