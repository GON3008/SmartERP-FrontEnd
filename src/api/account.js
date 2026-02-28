import request from '@/utils/request'

export function getAccounts(params) {
    return request({ url: '/accounts', method: 'get', params })
}

export function getAccount(id) {
    return request({ url: `/accounts/${id}`, method: 'get' })
}

export function getAccountSummary() {
    return request({ url: '/accounts/summary', method: 'get' })
}

export function getAgingReport(type = 'receivable') {
    return request({ url: '/accounts/aging', method: 'get', params: { type } })
}

export function checkOverdue() {
    return request({ url: '/accounts/check-overdue', method: 'post' })
}
