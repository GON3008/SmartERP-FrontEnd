import request from '@/utils/request'

export function getPayments(params) {
    return request({ url: '/payments', method: 'get', params })
}

export function getPayment(id) {
    return request({ url: `/payments/${id}`, method: 'get' })
}

export function createPayment(data) {
    return request({ url: '/payments', method: 'post', data })
}

export function deletePayment(id) {
    return request({ url: `/payments/${id}`, method: 'delete' })
}

export function getPaymentStatistics(params) {
    return request({ url: '/payments/statistics', method: 'get', params })
}
