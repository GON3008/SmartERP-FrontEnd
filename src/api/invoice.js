import request from '@/utils/request'

export function getInvoices(params) {
    return request({ url: '/invoices', method: 'get', params })
}

export function getInvoice(id) {
    return request({ url: `/invoices/${id}`, method: 'get' })
}

export function createInvoice(data) {
    return request({ url: '/invoices', method: 'post', data })
}

export function updateInvoice(id, data) {
    return request({ url: `/invoices/${id}`, method: 'put', data })
}

export function deleteInvoice(id) {
    return request({ url: `/invoices/${id}`, method: 'delete' })
}

export function sendInvoice(id) {
    return request({ url: `/invoices/${id}/send`, method: 'post' })
}

export function cancelInvoice(id) {
    return request({ url: `/invoices/${id}/cancel`, method: 'post' })
}

export function getInvoiceStatistics(params) {
    return request({ url: '/invoices/statistics', method: 'get', params })
}
