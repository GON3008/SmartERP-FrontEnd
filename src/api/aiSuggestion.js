import request from '@/utils/request'

export function getAiSuggestions(params) {
    return request({ url: '/ai/suggestions', method: 'get', params })
}

export function generateAiSuggestions(data) {
    return request({ url: '/ai/suggestions/generate', method: 'post', data })
}

export function deleteAiSuggestion(id) {
    return request({ url: `/ai/suggestions/${id}`, method: 'delete' })
}

export function checkAiHealth() {
    return request({ url: '/ai/health', method: 'get' })
}
