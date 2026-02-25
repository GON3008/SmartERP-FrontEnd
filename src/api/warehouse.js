import request from '@/utils/request'

export function getWarehouses(params) {
    return request({ url: '/warehouses', method: 'get', params })
}

export function getWarehouse(id) {
    return request({ url: `/warehouses/${id}`, method: 'get' })
}

export function createWarehouse(data) {
    return request({ url: '/warehouses', method: 'post', data })
}

export function updateWarehouse(id, data) {
    return request({ url: `/warehouses/${id}`, method: 'put', data })
}

export function deleteWarehouse(id) {
    return request({ url: `/warehouses/${id}`, method: 'delete' })
}

export function getWarehouseInventoryReport(id, params) {
    return request({ url: `/warehouses/${id}/inventory-report`, method: 'get', params })
}

export function getWarehouseMovements(id, params) {
    return request({ url: `/warehouses/${id}/movements`, method: 'get', params })
}

export function getWarehouseCapacity(id) {
    return request({ url: `/warehouses/${id}/capacity`, method: 'get' })
}
