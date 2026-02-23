import request from '@/utils/request'

export function getActivityLogs(params) {
    return request({ url: '/activity-logs', method: 'get', params })
}

export function getActivityLogStatistics() {
    return request({ url: '/activity-logs/statistics', method: 'get' })
}
