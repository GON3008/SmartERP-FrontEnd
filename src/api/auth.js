import request from '@/utils/request'

/**
 * Đăng nhập
 */
export function login(data) {
    return request({
        url: '/login',
        method: 'post',
        data
    })
}

/**
 * Đăng xuất
 */
export function logout() {
    return request({
        url: '/logout',
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
        url: '/refresh',
        method: 'post'
    })
}
