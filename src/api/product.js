import request from '@/utils/request'

/**
 * Lấy danh sách sản phẩm
 */
export function getProducts(params) {
    return request({
        url: '/products',
        method: 'get',
        params
    })
}

/**
 * Lấy chi tiết sản phẩm
 */
export function getProduct(id) {
    return request({
        url: `/products/${id}`,
        method: 'get'
    })
}

/**
 * Tạo sản phẩm mới
 */
export function createProduct(data) {
    return request({
        url: '/products',
        method: 'post',
        data
    })
}

/**
 * Cập nhật sản phẩm
 */
export function updateProduct(id, data) {
    return request({
        url: `/products/${id}`,
        method: 'put',
        data
    })
}

/**
 * Xóa sản phẩm
 */
export function deleteProduct(id) {
    return request({
        url: `/products/${id}`,
        method: 'delete'
    })
}
