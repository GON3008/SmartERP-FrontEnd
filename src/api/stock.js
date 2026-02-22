import request from '@/utils/request'

export function stockIn(data) {
    return request({ url: '/stock/in', method: 'post', data })
}

export function stockOut(data) {
    return request({ url: '/stock/out', method: 'post', data })
}

export function transferStock(data) {
    return request({ url: '/stock/transfer', method: 'post', data })
}

export function getStockInHistory(params) {
    return request({ url: '/stock/in/history', method: 'get', params })
}

export function getStockOutHistory(params) {
    return request({ url: '/stock/out/history', method: 'get', params })
}

export function getInventoryReport(warehouseId) {
    return request({ url: `/stock/inventory-report/${warehouseId}`, method: 'get' })
}
