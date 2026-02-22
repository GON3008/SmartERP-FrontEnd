import request from '@/utils/request'

/**
 * GET /api/reports/dashboard
 * Returns: { overview, sales, inventory, production, hr }
 */
export function getDashboard() {
    return request.get('/reports/dashboard')
}

/**
 * GET /api/reports/sales
 * @param {string} period - 'daily' | 'weekly' | 'monthly' | 'yearly'
 * @param {object} filters - { from_date, to_date }
 * Returns: { period, data: [{period, orders_count, revenue, avg_order_value}], summary }
 */
export function getSalesReport(period = 'monthly', filters = {}) {
    return request.get('/reports/sales', { params: { period, ...filters } })
}

/**
 * GET /api/reports/top-products
 * @param {number} limit
 * @param {object} filters - { from_date, to_date }
 * Returns: { data: [{id, sku, name, category, total_sold, total_revenue}] }
 */
export function getTopProducts(limit = 10, filters = {}) {
    return request.get('/reports/top-products', { params: { limit, ...filters } })
}

/**
 * GET /api/reports/inventory-movement
 * @param {object} filters - { from_date, to_date }
 * Returns: { total_stock_in, total_stock_out, net_movement }
 */
export function getInventoryMovement(filters = {}) {
    return request.get('/reports/inventory-movement', { params: filters })
}

/**
 * GET /api/reports/customers
 * @param {object} filters - { min_orders, per_page }
 * Returns: paginated list of customers with orders_count & orders_sum_total_amount
 */
export function getCustomersReport(filters = {}) {
    return request.get('/reports/customers', { params: filters })
}

/**
 * GET /api/reports/production-efficiency
 * @param {object} filters - { from_date, to_date }
 * Returns: { total_orders, completed_orders, completion_rate, total_quantity_produced, average_production_time }
 */
export function getProductionEfficiency(filters = {}) {
    return request.get('/reports/production-efficiency', { params: filters })
}

/**
 * GET /api/reports/financial-summary
 * Only accessible by Super Admin, Admin, Accountant
 * @param {object} filters - { from_date, to_date }
 * Returns: { period: {from, to}, revenue, expenses, profit, profit_margin }
 */
export function getFinancialSummary(filters = {}) {
    return request.get('/reports/financial-summary', { params: filters })
}
