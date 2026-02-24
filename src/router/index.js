import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/auth/Login.vue'),
        meta: { requiresAuth: false, title: 'Đăng nhập' }
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/auth/Register.vue'),
        meta: { requiresAuth: false, title: 'Đăng ký' }
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: () => import('@/views/auth/ForgotPassword.vue'),
        meta: { requiresAuth: false, title: 'Quên mật khẩu' }
    },
    {
        path: '/reset-password',
        name: 'ResetPassword',
        component: () => import('@/views/auth/ResetPassword.vue'),
        meta: { requiresAuth: false, title: 'Đặt lại mật khẩu' }
    },
    {
        path: '/',
        component: () => import('@/layouts/MainLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: () => import('@/views/dashboard/Index.vue'),
                meta: { title: 'Tổng quan' }
            },
            {
                path: 'profile',
                name: 'Profile',
                component: () => import('@/views/profile/Profile.vue'),
                meta: { title: 'Hồ sơ cá nhân' }
            },
            {
                path: 'customers',
                name: 'Customers',
                component: () => import('@/views/customers/List.vue'),
                meta: { title: 'Quản lý khách hàng' }
            },
            {
                path: 'customers/:id',
                name: 'CustomerDetail',
                component: () => import('@/views/customers/Detail.vue'),
                meta: { title: 'Chi tiết khách hàng' }
            },
            {
                path: 'products',
                name: 'Products',
                component: () => import('@/views/products/List.vue'),
                meta: { title: 'Quản lý sản phẩm' }
            },
            {
                path: 'products/low-stock',
                name: 'ProductLowStock',
                component: () => import('@/views/products/LowStock.vue'),
                meta: { title: 'Sản phẩm tồn kho thấp' }
            },
            {
                path: 'products/:id',
                name: 'ProductDetail',
                component: () => import('@/views/products/Detail.vue'),
                meta: { title: 'Chi tiết sản phẩm' }
            },
            {
                path: 'orders',
                name: 'Orders',
                component: () => import('@/views/orders/List.vue'),
                meta: { title: 'Quản lý đơn hàng' }
            },
            {
                path: 'orders/:id',
                name: 'OrderDetail',
                component: () => import('@/views/orders/Detail.vue'),
                meta: { title: 'Chi tiết đơn hàng' }
            },

            // ─── Warehouses ───────────────────────────────────
            {
                path: 'warehouses',
                name: 'Warehouses',
                component: () => import('@/views/warehouses/List.vue'),
                meta: { title: 'Quản lý kho hàng' }
            },
            {
                path: 'warehouses/:id',
                name: 'WarehouseDetail',
                component: () => import('@/views/warehouses/Detail.vue'),
                meta: { title: 'Chi tiết kho' }
            },

            // ─── Stock ────────────────────────────────────────
            {
                path: 'stock/in',
                name: 'StockIn',
                component: () => import('@/views/stock/StockIn.vue'),
                meta: { title: 'Nhập kho' }
            },
            {
                path: 'stock/out',
                name: 'StockOut',
                component: () => import('@/views/stock/StockOut.vue'),
                meta: { title: 'Xuất kho' }
            },
            {
                path: 'stock/transfer',
                name: 'StockTransfer',
                component: () => import('@/views/stock/Transfer.vue'),
                meta: { title: 'Chuyển kho' }
            },

            // ─── HR ───────────────────────────────────────────
            {
                path: 'employees',
                name: 'Employees',
                component: () => import('@/views/employees/List.vue'),
                meta: { title: 'Quản lý nhân viên' }
            },
            {
                path: 'employees/:id',
                name: 'EmployeeDetail',
                component: () => import('@/views/employees/Detail.vue'),
                meta: { title: 'Chi tiết nhân viên' }
            },
            {
                path: 'departments',
                name: 'Departments',
                component: () => import('@/views/departments/List.vue'),
                meta: { title: 'Quản lý phòng ban' }
            },
            {
                path: 'positions',
                name: 'Positions',
                component: () => import('@/views/positions/Index.vue'),
                meta: { title: 'Quản lý chức vụ' }
            },

            // ─── Attendance & Salary ──────────────────────────
            {
                path: 'attendances',
                name: 'Attendances',
                component: () => import('@/views/attendances/List.vue'),
                meta: { title: 'Chấm công' }
            },
            {
                path: 'salaries',
                name: 'Salaries',
                component: () => import('@/views/salaries/List.vue'),
                meta: { title: 'Bảng lương' }
            },

            // ─── Production ───────────────────────────────────
            {
                path: 'production',
                name: 'Production',
                component: () => import('@/views/production/List.vue'),
                meta: { title: 'Quản lý sản xuất' }
            },
            {
                path: 'production/:id',
                name: 'ProductionDetail',
                component: () => import('@/views/production/Detail.vue'),
                meta: { title: 'Chi tiết lệnh sản xuất' }
            },

            // ─── Users, Roles, Permissions ────────────────────
            {
                path: 'users',
                name: 'Users',
                component: () => import('@/views/users/List.vue'),
                meta: { title: 'Quản lý người dùng' }
            },
            {
                path: 'users/:id',
                name: 'UserDetail',
                component: () => import('@/views/users/Detail.vue'),
                meta: { title: 'Chi tiết người dùng' }
            },
            {
                path: 'roles',
                name: 'Roles',
                component: () => import('@/views/roles/List.vue'),
                meta: { title: 'Quản lý vai trò' }
            },
            {
                path: 'permissions',
                name: 'Permissions',
                component: () => import('@/views/permissions/List.vue'),
                meta: { title: 'Quản lý quyền hạn' }
            },

            // ─── Reports ──────────────────────────────────────
            {
                path: 'reports/sales',
                name: 'ReportSales',
                component: () => import('@/views/reports/Sales.vue'),
                meta: { title: 'Báo cáo doanh số' }
            },
            {
                path: 'reports/inventory',
                name: 'ReportInventory',
                component: () => import('@/views/reports/Inventory.vue'),
                meta: { title: 'Báo cáo tồn kho' }
            },
            {
                path: 'reports/production-efficiency',
                name: 'ReportProduction',
                component: () => import('@/views/reports/Production.vue'),
                meta: { title: 'Hiệu suất sản xuất' }
            },
            {
                path: 'reports/customers',
                name: 'ReportCustomers',
                component: () => import('@/views/reports/Customers.vue'),
                meta: { title: 'Báo cáo khách hàng' }
            },
            {
                path: 'reports/financial',
                name: 'ReportFinancial',
                component: () => import('@/views/reports/Financial.vue'),
                meta: { title: 'Tổng kết tài chính' }
            },

            {
                path: 'notifications',
                name: 'Notifications',
                component: () => import('@/views/notifications/Index.vue'),
                meta: { title: 'Thông báo' }
            },
            {
                path: 'activity-logs',
                name: 'ActivityLogs',
                component: () => import('@/views/activity-logs/Index.vue'),
                meta: { title: 'Nhật ký hoạt động' }
            },

            // ─── Settings (Super Admin only) ──────────────────
            {
                path: 'settings',
                name: 'Settings',
                component: () => import('@/views/settings/Index.vue'),
                meta: { title: 'Cài đặt hệ thống', requiresSuperAdmin: true }
            },
            {
                path: 'ai/purchase-suggestions',
                name: 'AiPurchaseSuggestions',
                component: () => import('@/views/ai/PurchaseSuggestions.vue'),
                meta: { title: 'Đề xuất nhập hàng AI' }
            },
            {
                path: 'barcode',
                name: 'BarcodeScanner',
                component: () => import('@/views/barcode/Scanner.vue'),
                meta: { title: 'Barcode / QR Scanner' }
            },
            {
                path: 'ocr',
                name: 'OcrInvoiceScanner',
                component: () => import('@/views/ocr/InvoiceScanner.vue'),
                meta: { title: 'OCR – Đọc hóa đơn' }
            },

            // ─── Suppliers ───────────────────────────────────
            {
                path: 'suppliers',
                name: 'Suppliers',
                component: () => import('@/views/suppliers/List.vue'),
                meta: { title: 'Quản lý nhà cung cấp' }
            },
            {
                path: 'suppliers/:id',
                name: 'SupplierDetail',
                component: () => import('@/views/suppliers/Detail.vue'),
                meta: { title: 'Chi tiết nhà cung cấp' }
            },

            // ─── Purchase Orders ─────────────────────────────
            {
                path: 'purchase-orders',
                name: 'PurchaseOrders',
                component: () => import('@/views/purchase-orders/List.vue'),
                meta: { title: 'Quản lý phiếu mua hàng' }
            },
            {
                path: 'purchase-orders/:id',
                name: 'PurchaseOrderDetail',
                component: () => import('@/views/purchase-orders/Detail.vue'),
                meta: { title: 'Chi tiết phiếu mua hàng' }
            },

            // ─── Invoices ────────────────────────────────────
            {
                path: 'invoices',
                name: 'Invoices',
                component: () => import('@/views/invoices/List.vue'),
                meta: { title: 'Quản lý hóa đơn' }
            },
            {
                path: 'invoices/:id',
                name: 'InvoiceDetail',
                component: () => import('@/views/invoices/Detail.vue'),
                meta: { title: 'Chi tiết hóa đơn' }
            },

            // ─── Payments ────────────────────────────────────
            {
                path: 'payments',
                name: 'Payments',
                component: () => import('@/views/payments/List.vue'),
                meta: { title: 'Quản lý thanh toán' }
            },
            {
                path: 'payments/:id',
                name: 'PaymentDetail',
                component: () => import('@/views/payments/Detail.vue'),
                meta: { title: 'Chi tiết thanh toán' }
            },

            // ─── Accounts (AR/AP) ────────────────────────────
            {
                path: 'accounts',
                name: 'Accounts',
                component: () => import('@/views/accounts/List.vue'),
                meta: { title: 'Công nợ phải thu / phải trả' }
            },
            {
                path: 'accounts/:id',
                name: 'AccountDetail',
                component: () => import('@/views/accounts/Detail.vue'),
                meta: { title: 'Chi tiết công nợ' }
            },
        ]
    },
    {
        path: '/403',
        name: 'Forbidden',
        component: () => import('@/views/Forbidden.vue'),
        meta: { title: 'Không có quyền truy cập' }
    },
    {
        path: '/maintenance',
        name: 'Maintenance',
        component: () => import('@/views/Maintenance.vue'),
        meta: { title: 'Hệ thống đang bảo trì', requiresAuth: false }
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFound.vue'),
        meta: { title: 'Không tìm thấy trang' }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// ── Maintenance check ─────────────────────────────────────────
// GET /api/maintenance-status is a dedicated route with:
//   withoutMiddleware(PreventRequestsDuringMaintenance) → always reachable
//   manual CORS headers → no CORS error even when app is in 503 state
let _maintenanceCache = null
let _maintenanceCacheAt = 0

async function checkMaintenance() {
    const now = Date.now()
    if (_maintenanceCache !== null && now - _maintenanceCacheAt < 5000) {
        return _maintenanceCache
    }
    try {
        const res = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/maintenance-status`,
            { timeout: 3000 }
        )
        const inMaintenance = res.data?.enabled === true
        _maintenanceCache = inMaintenance
        _maintenanceCacheAt = now
        return inMaintenance
    } catch {
        // Network error or unexpected failure → assume maintenance OFF
        _maintenanceCache = false
        _maintenanceCacheAt = now
        return false
    }
}

// Navigation guard
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
    const requiresSuperAdmin = to.matched.some(record => record.meta.requiresSuperAdmin)

    // Set page title
    document.title = to.meta.title
        ? `${to.meta.title} - ${import.meta.env.VITE_APP_TITLE}`
        : import.meta.env.VITE_APP_TITLE

    // ── Maintenance check (skip only /maintenance itself to avoid redirect loops) ──
    const skipMaintenanceCheck = to.name === 'Maintenance'
    if (!skipMaintenanceCheck) {
        const inMaintenance = await checkMaintenance()
        if (inMaintenance) {
            // Super Admin can still access during maintenance
            const roles = authStore.userRoles?.map(r => typeof r === 'string' ? r : r?.name).filter(Boolean) ?? []
            const isSuperAdmin = roles.some(r => ['Super Admin', 'super-admin', 'superadmin', 'SuperAdmin'].includes(r))
            if (!isSuperAdmin) {
                // Return early — don't let the auth guard below override this redirect
                return next({ name: 'Maintenance' })
            }
        }
    }

    // ── Normal auth checks ────────────────────────────────────
    if (requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
    } else if (!requiresAuth && authStore.isAuthenticated) {
        next({ name: 'Dashboard' })
    } else if (requiresSuperAdmin && authStore.isAuthenticated) {
        const roles = authStore.userRoles.map(r => typeof r === 'string' ? r : r?.name).filter(Boolean)
        const isSuperAdmin = roles.some(r =>
            ['Super Admin', 'super-admin', 'superadmin', 'SuperAdmin'].includes(r)
        )
        if (!isSuperAdmin) {
            next({ name: 'Forbidden' })
        } else {
            next()
        }
    } else {
        next()
    }
})

/** Call this after toggling maintenance so the router re-checks immediately. */
export function clearMaintenanceCache() {
    _maintenanceCache = null
    _maintenanceCacheAt = 0
}

export default router
