import request from '@/utils/request'

/**
 * 支付相关 API
 * 支付方式：1-支付宝 2-微信
 */
const payApi = {
  /**
   * 支付宝支付（电脑网站支付）
   * axios 请求携带 JWT，获取支付宝支付表单 HTML
   * @param {number} orderId - 订单ID
   * @returns {string} 支付宝自动提交表单 HTML
   */
  alipayPay(orderId) {
    return request.get('/alipay/pay', { params: { orderId } })
  },

  /**
   * 查询支付宝交易状态
   * @param {string} orderNo - 商户订单号
   */
  alipayQuery(orderNo) {
    return request.get('/alipay/query', { params: { orderNo } })
  },

  /**
   * 创建微信支付订单（Native 扫码支付）
   * @param {number} orderId - 订单ID
   * @returns {Object} { outTradeNo, codeUrl }
   */
  wechatPay(orderId) {
    return request.get('/wechat/pay', { params: { orderId } })
  },

  /**
   * 查询微信支付交易状态
   * @param {string} orderNo - 商户订单号
   * @returns {Object} { tradeState, tradeStateDesc, transactionId }
   */
  wechatQuery(orderNo) {
    return request.get('/wechat/query', { params: { orderNo } })
  }
}

export default payApi
