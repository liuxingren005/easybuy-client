import request from '@/utils/request'

/**
 * 购物车相关 API（Redis 存储）
 */
const cartApi = {
  /** 查询购物车列表 */
  getList() {
    return request.get('/cart')
  },

  /** 加入购物车 { productId, quantity } */
  add(data) {
    return request.post('/cart', data)
  },

  /** 修改购买数量 { quantity } */
  updateQuantity(productId, quantity) {
    return request.put(`/cart/${productId}`, { quantity })
  },

  /** 移除单项 */
  remove(productId) {
    return request.delete(`/cart/${productId}`)
  },

  /** 清空购物车 */
  clear() {
    return request.delete('/cart')
  }
}

export default cartApi
