import request from '@/utils/request'

/**
 * 商品分类相关 API（easybuy_product_category 表）
 */
const categoryApi = {
  /** 查询分类树形结构 */
  getTree() {
    return request.get('/productCategory/tree')
  },

  /** 查询所有分类（平铺） */
  getAll() {
    return request.get('/productCategory/all')
  },

  /** 分页条件查询 */
  getPage(params) {
    return request.get('/productCategory/page', { params })
  },

  /** 根据父级 ID 查询子分类 */
  getByParent(parentId) {
    return request.get(`/productCategory/parent/${parentId}`)
  },

  /** 根据级别查询（1/2/3） */
  getByType(type) {
    return request.get(`/productCategory/type/${type}`)
  },

  /** 根据 ID 查询 */
  getById(id) {
    return request.get(`/productCategory/${id}`)
  },

  /** 新增分类 */
  add(data) {
    return request.post('/productCategory', data)
  },

  /** 修改分类 */
  update(data) {
    return request.put('/productCategory', data)
  },

  /** 删除分类（有下级或被商品引用则不可删） */
  remove(id) {
    return request.delete(`/productCategory/${id}`)
  }
}

export default categoryApi
