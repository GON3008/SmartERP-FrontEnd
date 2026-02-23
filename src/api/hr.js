import request from '@/utils/request'

export function getEmployees(params) {
    return request({ url: '/employees', method: 'get', params })
}

export function getEmployee(id) {
    return request({ url: `/employees/${id}`, method: 'get' })
}

export function createEmployee(data) {
    return request({ url: '/employees', method: 'post', data })
}

export function updateEmployee(id, data) {
    return request({ url: `/employees/${id}`, method: 'put', data })
}

export function deleteEmployee(id) {
    return request({ url: `/employees/${id}`, method: 'delete' })
}

export function getEmployeeStatistics() {
    return request({ url: '/employees/statistics', method: 'get' })
}

// Departments
export function getDepartments(params) {
    return request({ url: '/departments', method: 'get', params })
}

export function getDepartment(id) {
    return request({ url: `/departments/${id}`, method: 'get' })
}

export function createDepartment(data) {
    return request({ url: '/departments', method: 'post', data })
}

export function updateDepartment(id, data) {
    return request({ url: `/departments/${id}`, method: 'put', data })
}

export function deleteDepartment(id) {
    return request({ url: `/departments/${id}`, method: 'delete' })
}

export function getDepartmentStatistics() {
    return request({ url: '/departments/statistics', method: 'get' })
}

// Positions
export function getPositions(params) {
    return request({ url: '/positions', method: 'get', params })
}

export function getPosition(id) {
    return request({ url: `/positions/${id}`, method: 'get' })
}

export function createPosition(data) {
    return request({ url: '/positions', method: 'post', data })
}

export function updatePosition(id, data) {
    return request({ url: `/positions/${id}`, method: 'put', data })
}

export function deletePosition(id) {
    return request({ url: `/positions/${id}`, method: 'delete' })
}
