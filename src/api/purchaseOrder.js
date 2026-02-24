import request from '@/utils/request'

export function getPurchaseOrders(params) {
    return request({ url: '/purchase-orders', method: 'get', params })
}

export function getPurchaseOrder(id) {
    return request({ url: `/purchase-orders/${id}`, method: 'get' })
}

export function createPurchaseOrder(data) {
    return request({ url: '/purchase-orders', method: 'post', data })
}

export function updatePurchaseOrder(id, data) {
    return request({ url: `/purchase-orders/${id}`, method: 'put', data })
}

export function deletePurchaseOrder(id) {
    return request({ url: `/purchase-orders/${id}`, method: 'delete' })
}

export function confirmPurchaseOrder(id) {
    return request({ url: `/purchase-orders/${id}/confirm`, method: 'post' })
}

export function receivePurchaseOrder(id, data) {
    return request({ url: `/purchase-orders/${id}/receive`, method: 'post', data })
}

export function cancelPurchaseOrder(id) {
    return request({ url: `/purchase-orders/${id}/cancel`, method: 'post' })
}

export function getPurchaseOrderStatistics(params) {
    return request({ url: '/purchase-orders/statistics', method: 'get', params })
}
