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
                path: 'customers',
                name: 'Customers',
                component: () => import('@/views/customers/List.vue'),
                meta: { title: 'Quản lý khách hàng' }
            },
            {
                path: 'customers/create',
                name: 'CustomerCreate',
                component: () => import('@/views/customers/Form.vue'),
                meta: { title: 'Thêm khách hàng' }
            },
            {
                path: 'customers/:id/edit',
                name: 'CustomerEdit',
                component: () => import('@/views/customers/Form.vue'),
                meta: { title: 'Chỉnh sửa khách hàng' }
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
    } else if (to.name === 'Login' && authStore.isAuthenticated) {
        // Đã đăng nhập, chuyển đến dashboard
        next({ name: 'Dashboard' })
    } else {
        next()
    }
})

export default router
