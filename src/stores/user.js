import { defineStore } from 'pinia'
import userApi from '@/api/user'
import { useCartStore } from '@/stores/cart'

export const useUserStore = defineStore('user', {
  state: () => ({
    // 用户信息
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
    // JWT 令牌
    token: localStorage.getItem('token') || ''
  }),

  getters: {
    isLoggedIn: (state) => !!state.token && !!state.userInfo,
    // 后台管理员
    isAdmin: (state) => state.userInfo?.type === 1,
    // 用户名（userName），登录名（loginName）
    userName: (state) => state.userInfo?.userName || '',
    loginName: (state) => state.userInfo?.loginName || ''
  },

  actions: {
    /**
     * 登录
     */
    async login(loginForm) {
      const res = await userApi.login(loginForm)
      if (res.code === 200) {
        this.userInfo = res.data
        this.token = res.token
        localStorage.setItem('userInfo', JSON.stringify(res.data))
        localStorage.setItem('token', res.token)
      }
      return res
    },

    /**
     * 注册
     */
    async register(registerForm) {
      return await userApi.register(registerForm)
    },

    /**
     * 同步当前登录用户信息（修改个人资料后刷新）
     */
    setUserInfo(info) {
      this.userInfo = info
      localStorage.setItem('userInfo', JSON.stringify(info))
    },

    /**
     * 退出登录
     */
    async logout() {
      try {
        await userApi.logout()
      } catch (e) {

      }
      this.userInfo = null
      this.token = ''
      localStorage.removeItem('userInfo')
      localStorage.removeItem('token')

      useCartStore().resetLocal()
    }
  }
})
