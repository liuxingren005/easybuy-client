import request from '@/utils/request'

/**
 * 资讯相关 API（easybuy_news 表）
 */
const newsApi = {
  /** 分页条件查询（startTime/endTime yyyy-MM-dd） */
  getPage(params) {
    return request.get('/news/page', { params })
  },

  /** 查询资讯列表 */
  getList(limit) {
    return request.get('/news/list', { params: { limit } })
  },

  /** 根据 ID 查询资讯详情 */
  getById(id) {
    return request.get(`/news/${id}`)
  },

  /** 新增资讯 */
  add(data) {
    return request.post('/news', data)
  },

  /** 修改资讯 */
  update(data) {
    return request.put('/news', data)
  },

  /** 删除资讯（逻辑删除 isDelete=1） */
  remove(id) {
    return request.delete(`/news/${id}`)
  }
}

export default newsApi
