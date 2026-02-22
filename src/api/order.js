import request from '@/utils/request'

/** Lấy danh sách đơn hàng */
export function getOrders(params) {
    return request({ url: '/orders', method: 'get', params })
}

/** Lấy chi tiết đơn hàng */
export function getOrder(id) {
    return request({ url: `/orders/${id}`, method: 'get' })
}

/** Tạo đơn hàng mới */
export function createOrder(data) {
    return request({ url: '/orders', method: 'post', data })
}

/** Cập nhật đơn hàng */
export function updateOrder(id, data) {
    return request({ url: `/orders/${id}`, method: 'put', data })
}

/** Xóa đơn hàng */
export function deleteOrder(id) {
    return request({ url: `/orders/${id}`, method: 'delete' })
}

/** Xử lý đơn hàng (xuất kho) */
export function processOrder(id, warehouseId) {
    return request({ url: `/orders/${id}/process`, method: 'post', data: { warehouse_id: warehouseId } })
}

/** Hủy đơn hàng */
export function cancelOrder(id) {
    return request({ url: `/orders/${id}/cancel`, method: 'post' })
}

/** Thống kê đơn hàng */
export function getOrderStatistics(params) {
    return request({ url: '/orders/statistics', method: 'get', params })
}
