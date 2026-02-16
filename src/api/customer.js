import request from '@/utils/request'

/**
 * Lấy danh sách khách hàng
 */
export function getCustomers(params) {
    return request({
        url: '/customers',
        method: 'get',
        params
    })
}

/**
 * Lấy chi tiết khách hàng
 */
export function getCustomer(id) {
    return request({
        url: `/customers/${id}`,
        method: 'get'
    })
}

/**
 * Tạo khách hàng mới
 */
export function createCustomer(data) {
    return request({
        url: '/customers',
        method: 'post',
        data
    })
}

/**
 * Cập nhật khách hàng
 */
export function updateCustomer(id, data) {
    return request({
        url: `/customers/${id}`,
        method: 'put',
        data
    })
}

/**
 * Xóa khách hàng
 */
export function deleteCustomer(id) {
    return request({
        url: `/customers/${id}`,
        method: 'delete'
    })
}
