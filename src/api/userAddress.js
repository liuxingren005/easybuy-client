import request from '@/utils/request'

/**
 * 用户地址相关 API（easybuy_user_address 表）
 */
const userAddressApi = {
  /**
   * 根据用户ID查询地址列表
   * @param {number} userId - 用户ID
   */
  findByUserId(userId) {
    return request.get(`/userAddress/user/${userId}`)
  },

  /**
   * 根据ID查询地址详情
   * @param {number} id - 地址ID
   */
  getById(id) {
    return request.get(`/userAddress/${id}`)
  },

  /**
   * 查询用户默认地址
   * @param {number} userId - 用户ID
   */
  findDefault(userId) {
    return request.get(`/userAddress/default/${userId}`)
  },

  /**
   * 新增地址
   */
  add(data) {
    return request.post('/userAddress', data)
  },

  /**
   * 修改地址
   */
  update(data) {
    return request.put('/userAddress', data)
  },

  /**
   * 删除地址（逻辑删除）
   */
  remove(id) {
    return request.delete(`/userAddress/${id}`)
  },

  /**
   * 设置默认地址
   * @param {number} id - 地址ID
   * @param {number} userId - 用户ID
   */
  setDefault(id, userId) {
    return request.put(`/userAddress/default/${id}/${userId}`)
  }
}

export default userAddressApi
