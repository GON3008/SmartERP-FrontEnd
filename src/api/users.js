import request from '@/utils/request'

// ─── Users ────────────────────────────────────────────────────
export function getUsers(params) {
    return request({ url: '/users', method: 'get', params })
}

export function getUser(id) {
    return request({ url: `/users/${id}`, method: 'get' })
}

export function createUser(data) {
    return request({ url: '/users', method: 'post', data })
}

export function updateUser(id, data) {
    return request({ url: `/users/${id}`, method: 'put', data })
}

export function deleteUser(id) {
    return request({ url: `/users/${id}`, method: 'delete' })
}

export function getUserStatistics() {
    return request({ url: '/users/statistics', method: 'get' })
}

export function toggleUserStatus(id) {
    return request({ url: `/users/${id}/toggle-status`, method: 'post' })
}

export function assignRole(id, data) {
    return request({ url: `/users/${id}/assign-role`, method: 'post', data })
}

export function removeRole(id, data) {
    return request({ url: `/users/${id}/remove-role`, method: 'post', data })
}

// ─── Roles ────────────────────────────────────────────────────
export function getRoles(params) {
    return request({ url: '/roles', method: 'get', params })
}

export function getRole(id) {
    return request({ url: `/roles/${id}`, method: 'get' })
}

export function createRole(data) {
    return request({ url: '/roles', method: 'post', data })
}

export function updateRole(id, data) {
    return request({ url: `/roles/${id}`, method: 'put', data })
}

export function deleteRole(id) {
    return request({ url: `/roles/${id}`, method: 'delete' })
}

export function syncRolePermissions(id, data) {
    return request({ url: `/roles/${id}/sync-permissions`, method: 'post', data })
}

// ─── Permissions ──────────────────────────────────────────────
export function getPermissions(params) {
    return request({ url: '/permissions', method: 'get', params })
}

export function createPermission(data) {
    return request({ url: '/permissions', method: 'post', data })
}

export function generateModulePermissions(data) {
    return request({ url: '/permissions/generate-module', method: 'post', data })
}
