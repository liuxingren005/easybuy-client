import request from '@/utils/request'

/**
 * 订单相关 API
 * 订单状态：1-待付款 2-已付款 3-已关闭 4-已退款
 */
const orderApi = {
  /**
   * 管理员分页查询全部订单
   * @param {Object} params - 查询参数
   * @param {number} params.pageNum - 页码
   * @param {number} params.pageSize - 每页条数
   * @param {string} [params.loginName] - 用户名（模糊）
   * @param {string} [params.serialNumber] - 订单号（模糊）
   * @param {number} [params.status] - 订单状态
   * @param {string} [params.startTime] - 开始日期
   * @param {string} [params.endTime] - 结束日期
   */
  getPage(params) {
    return request.get('/order/page', { params })
  },

  /**
   * 用户分页查询自己的订单
   * @param {Object} params - 查询参数
   */
  getMyPage(params) {
    return request.get('/order/my/page', { params })
  },

  /**
   * 根据ID查询订单详情（明细）
   */
  getById(id) {
    return request.get(`/order/${id}`)
  },

  /**
   * 新增订单
   */
  add(data) {
    return request.post('/order', data)
  },

  /**
   * 修改订单
   */
  update(data) {
    return request.put('/order', data)
  },

  /**
   * 关闭订单（仅待付款状态关闭）
   */
  close(id) {
    return request.put(`/order/${id}/close`)
  },

  /**
   * 支付订单（仅待付款状态支付）
   */
  pay(id) {
    return request.put(`/order/${id}/pay`)
  },
  /**
   * 支付订单（支付方式）
   * @param {number} id - 订单ID
   * @param {number} payType - 支付方式（1:支付宝 2:微信）
   */
  payWithType(id, payType, transactionId) {
    const params = { payType }
    if (transactionId) params.transactionId = transactionId
    return request.put(`/order/${id}/pay/${payType}`, null, { params })
  },
  /**
   * 退款（仅已付款状态退款，管理员操作）
   */
  refund(id) {
    return request.put(`/order/${id}/refund`)
  },

  /**
   * 删除订单（逻辑删除，仅已关闭状态删除）
   */
  remove(id) {
    return request.delete(`/order/${id}`)
  }
}

export default orderApi
