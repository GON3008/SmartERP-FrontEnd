import request from '@/utils/request'

// ─── Production Orders ────────────────────────────────────────
export function getProductions(params) {
    return request({ url: '/production', method: 'get', params })
}

export function createProduction(data) {
    return request({ url: '/production', method: 'post', data })
}

export function updateProduction(id, data) {
    return request({ url: `/production/${id}`, method: 'put', data })
}

export function startProduction(id, data) {
    return request({ url: `/production/${id}/start`, method: 'post', data })
}

export function completeProduction(id, data) {
    return request({ url: `/production/${id}/complete`, method: 'post', data })
}

export function cancelProduction(id, data) {
    return request({ url: `/production/${id}/cancel`, method: 'post', data })
}

export function checkMaterials(data) {
    return request({ url: '/production/check-materials', method: 'post', data })
}
