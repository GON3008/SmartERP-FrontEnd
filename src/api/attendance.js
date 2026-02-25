import request from '@/utils/request'

// ─── Attendance ───────────────────────────────────────────────

export function getAttendances(params) {
    return request({ url: '/attendances', method: 'get', params })
}

export function recordAttendance(data) {
    return request({ url: '/attendances', method: 'post', data })
}

export function getAttendance(id) {
    return request({ url: `/attendances/${id}`, method: 'get' })
}

export function updateAttendance(id, data) {
    return request({ url: `/attendances/${id}`, method: 'put', data })
}

export function deleteAttendance(id) {
    return request({ url: `/attendances/${id}`, method: 'delete' })
}

export function checkIn(data) {
    return request({ url: '/attendances/check-in', method: 'post', data })
}

export function checkOut(data) {
    return request({ url: '/attendances/check-out', method: 'post', data })
}

export function getMonthlySummary(params) {
    return request({ url: '/attendances/monthly-summary', method: 'get', params })
}

export function getTodayStatus() {
    return request({ url: '/attendances/today-status', method: 'get' })
}

export function getAttendanceReport(params) {
    return request({ url: '/attendances/report', method: 'get', params })
}

export function getLateEmployees(params) {
    return request({ url: '/attendances/late-employees', method: 'get', params })
}

export function getOvertime(params) {
    return request({ url: '/attendances/overtime', method: 'get', params })
}

// ─── Salary ───────────────────────────────────────────────────

export function getSalaries(params) {
    return request({ url: '/salaries', method: 'get', params })
}

export function getSalary(id) {
    return request({ url: `/salaries/${id}`, method: 'get' })
}

export function calculateSalary(data) {
    return request({ url: '/salaries', method: 'post', data })
}

export function updateSalary(id, data) {
    return request({ url: `/salaries/${id}`, method: 'put', data })
}

export function deleteSalary(id) {
    return request({ url: `/salaries/${id}`, method: 'delete' })
}

export function getSalarySummary(params) {
    return request({ url: '/salaries/summary', method: 'get', params })
}

export function getEmployeeSalaries(params) {
    return request({ url: '/salaries/employee', method: 'get', params })
}

export function generatePayroll(data) {
    return request({ url: '/salaries/generate-payroll', method: 'post', data })
}

export function getYearlyStatistics(params) {
    return request({ url: '/salaries/yearly-statistics', method: 'get', params })
}

export function getTopEarners(params) {
    return request({ url: '/salaries/top-earners', method: 'get', params })
}
