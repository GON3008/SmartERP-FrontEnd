import request from '@/utils/request'

/** Lấy toàn bộ settings (nhóm thành company, security, mail, maintenance) */
export const getSettings = () => request.get('/settings')

/** Lưu một nhóm settings
 * @param {string} group  'company' | 'security' | 'mail' | 'maintenance'
 * @param {object} values key-value pairs of the group
 */
export const saveSettings = (group, values) =>
    request.post('/settings', { group, values })

/** Kiểm tra trạng thái hệ thống thật (DB, Cache, Storage...) */
export const getSystemStatus = () => request.get('/settings/status')

/** Xóa toàn bộ cache Laravel */
export const clearCache = () => request.post('/settings/clear-cache')

/** Chạy ANALYZE TABLE tối ưu DB */
export const optimizeDb = () => request.post('/settings/optimize-db')

/** Gửi email test qua cấu hình SMTP trong DB
 * @param {string} email  Địa chỉ nhận
 */
export const testEmail = (email) => request.post('/settings/test-email', { email })

/** Bật / tắt chế độ bảo trì (artisan up/down)
 * @param {boolean} enabled
 */
export const toggleMaintenance = (enabled) =>
    request.post('/settings/maintenance', { enabled })
