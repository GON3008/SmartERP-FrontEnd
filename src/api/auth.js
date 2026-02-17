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
