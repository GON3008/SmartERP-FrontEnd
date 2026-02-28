import request from '@/utils/request'

export function getNotifications() {
    return request({ url: '/notifications', method: 'get' })
}

export function getNotificationCount() {
    return request({ url: '/notifications/count', method: 'get' })
}

export function getLowStockNotifications() {
    return request({ url: '/notifications/low-stock', method: 'get' })
}

export function getPendingOrderNotifications() {
    return request({ url: '/notifications/pending-orders', method: 'get' })
}
