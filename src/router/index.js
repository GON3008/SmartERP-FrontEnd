import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
                path: 'products',
                name: 'Products',
                component: () => import('@/views/products/List.vue'),
                meta: { title: 'Quản lý sản phẩm' }
            },
            {
                path: 'products/create',
                name: 'ProductCreate',
                component: () => import('@/views/products/Form.vue'),
                meta: { title: 'Thêm sản phẩm' }
            },
            {
                path: 'products/:id/edit',
                name: 'ProductEdit',
                component: () => import('@/views/products/Form.vue'),
                meta: { title: 'Chỉnh sửa sản phẩm' }
            },
            {
                path: 'orders',
                name: 'Orders',
                component: () => import('@/views/orders/List.vue'),
                meta: { title: 'Quản lý đơn hàng' }
            },
            {
                path: 'orders/create',
                name: 'OrderCreate',
                component: () => import('@/views/orders/Create.vue'),
                meta: { title: 'Tạo đơn hàng' }
            },
            {
                path: 'orders/:id',
                name: 'OrderDetail',
                component: () => import('@/views/orders/Detail.vue'),
                meta: { title: 'Chi tiết đơn hàng' }
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
        ]
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

// Navigation guard
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

    // Set page title
    document.title = to.meta.title
        ? `${to.meta.title} - ${import.meta.env.VITE_APP_TITLE}`
        : import.meta.env.VITE_APP_TITLE

    if (requiresAuth && !authStore.isAuthenticated) {
        // Chưa đăng nhập, chuyển đến trang login
        next({ name: 'Login', query: { redirect: to.fullPath } })
    } else if (!requiresAuth && authStore.isAuthenticated) {
        // Đã đăng nhập, không cần vào trang auth nữa → về dashboard
        next({ name: 'Dashboard' })
    } else {
        next()
    }
})

export default router
