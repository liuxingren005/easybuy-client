import request from '@/utils/request'

/**
 * 收藏夹相关 API（Redis List 存储）
 */
const favoriteApi = {
  /** 查询收藏列表 */
  getList() {
    return request.get('/favorite')
  },

  /** 添加收藏 { productId } */
  add(productId) {
    return request.post('/favorite', { productId })
  },

  /** 移除单项收藏 */
  remove(productId) {
    return request.delete(`/favorite/${productId}`)
  },

  /** 清空收藏 */
  clear() {
    return request.delete('/favorite')
  }
}

export default favoriteApi
