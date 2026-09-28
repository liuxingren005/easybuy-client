import request from '@/utils/request'

/**
 * 用户相关 API（easybuy_user 表）
 * 密码：SM3 国密加密
 */
const userApi = {
  /** 用户登录（loginName/邮箱 + password） */
  login(data) {
    return request.post('/user/login', data)
  },

  /** 用户注册 */
  register(data) {
    return request.post('/user/register', data)
  },

  /**
   * 发送邮箱验证码
   * @param {Object} data { email: 'xx@xx.com', scene: 'register' | 'changePassword' }
   */
  sendEmailCode(data) {
    return request.post('/user/sendEmailCode', data)
  },

  /** 退出登录（删除 Redis 会话） */
  logout() {
    return request.post('/user/logout')
  },

  /** 获取当前登录用户 */
  getCurrent() {
    return request.get('/user/current')
  },

  /** 修改个人基础信息 */
  updateProfile(data) {
    return request.put('/user/profile', data)
  },

  /** 修改个人密码 */
  changePassword(data) {
    return request.put('/user/password', data)
  },

  /** 分页查询用户列表 */
  getPage(params) {
    return request.get('/user/page', { params })
  },

  /** 根据 ID 查询用户 */
  getById(id) {
    return request.get(`/user/${id}`)
  },

  /** 修改用户 */
  update(data) {
    return request.put('/user', data)
  },

  /** 删除用户 */
  remove(id) {
    return request.delete(`/user/${id}`)
  }
}

export default userApi
