import request from '@/utils/request'

export function getSuppliers(params) {
    return request({ url: '/suppliers', method: 'get', params })
}

export function getSupplier(id) {
    return request({ url: `/suppliers/${id}`, method: 'get' })
}

export function createSupplier(data) {
    return request({ url: '/suppliers', method: 'post', data })
}

export function updateSupplier(id, data) {
    return request({ url: `/suppliers/${id}`, method: 'put', data })
}

export function deleteSupplier(id) {
    return request({ url: `/suppliers/${id}`, method: 'delete' })
}

export function getSupplierPurchaseHistory(id, params) {
    return request({ url: `/suppliers/${id}/purchase-history`, method: 'get', params })
}

export function getSupplierStatistics(id) {
    return request({ url: `/suppliers/${id}/statistics`, method: 'get' })
}
