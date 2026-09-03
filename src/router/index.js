import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/news',
    name: 'NewsList',
    component: () => import('@/views/NewsList.vue')
  },
  {
    // 商品列表页（筛选/搜索）
    path: '/products',
    name: 'ProductList',
    component: () => import('@/views/ProductList.vue')
  },
  {
    // 商品详情页
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('@/views/ProductDetail.vue')
  },
  {
    // 购物车页面
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/Cart.vue')
  },
  {
    // 确认订单页面（结算）
    path: '/checkout',
    name: 'Checkout',
    component: () => import('@/views/Checkout.vue'),
    meta: { requiresAuth: true }
  },
  {
    // 支付页面
    path: '/pay/:orderId',
    name: 'PayOrder',
    component: () => import('@/views/PayOrder.vue'),
    meta: { requiresAuth: true }
  },
  {
    // 支付结果页
    path: '/pay/result',
    name: 'PayResult',
    component: () => import('@/views/PayOrder.vue')
  },
  {
    path: '/admin',
    component: () => import('@/components/AdminLayout.vue'),
    redirect: '/admin/news',
    children: [
      {
        path: 'news',
        name: 'NewsManage',
        component: () => import('@/views/admin/NewsManage.vue'),
        meta: { title: '资讯管理' }
      },
      {
        path: 'users',
        name: 'UserManage',
        component: () => import('@/views/admin/UserManage.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'categories',
        name: 'CategoryManage',
        component: () => import('@/views/admin/CategoryManage.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'products',
        name: 'ProductManage',
        component: () => import('@/views/admin/ProductManage.vue'),
        meta: { title: '商品管理' }
      },
      {
        path: 'search',
        name: 'ProductSearch',
        component: () => import('@/views/admin/ProductSearch.vue'),
        meta: { title: '商品搜索' }
      },
      {
        path: 'orders',
        name: 'OrderManage',
        component: () => import('@/views/admin/OrderManage.vue'),
        meta: { title: '全部订单' }
      }
    ]
  },
  {
    path: '/user',
    component: () => import('@/components/UserLayout.vue'),
    redirect: '/user/profile',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('@/views/user/Profile.vue'),
        meta: { title: '个人信息' }
      },
      {
        path: 'orders',
        name: 'UserOrders',
        component: () => import('@/views/user/Orders.vue'),
        meta: { title: '我的订单' }
      },
      {
        path: 'addresses',
        name: 'UserAddresses',
        component: () => import('@/views/user/Addresses.vue'),
        meta: { title: '收货地址' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：管理员（配合 JWT+Redis 拦截器）
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.path.startsWith('/admin')) {
    if (!userStore.isLoggedIn) {
      next('/login')
      return
    }
    if (!userStore.isAdmin) {
      next('/')
      return
    }
  }
  // 会员中心：普通用户
  if (to.matched.some(r => r.meta.requiresAuth) && !userStore.isLoggedIn) {
    next('/login')
    return
  }
  next()
})

export default router
