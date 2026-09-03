import request from '@/utils/request'

/**
 * 商品相关 API（easybuy_product 表 + Elasticsearch）
 */
const productApi = {
  /** 分页条件查询（名称、创建时间区间，按创建时间倒序） */
  getPage(params) {
    return request.get('/product/page', { params })
  },

  /** 前台-关键字分页搜索（ES，带高亮） */
  search(params) {
    return request.get('/product/search', { params })
  },

  /** 前台-热门推荐（随机抽取已有商品） */
  getHot(limit = 8) {
    return request.get('/product/hot', { params: { limit } })
  },

  /** 前台-按一级分类查询 */
  getByCategory1(id, limit = 8) {
    return request.get(`/product/category1/${id}`, { params: { limit } })
  },

  /** 前台-按二级分类查询 */
  getByCategory2(id, limit = 8) {
    return request.get(`/product/category2/${id}`, { params: { limit } })
  },

  /** 前台-按三级分类查询 */
  getByCategory3(id, limit = 8) {
    return request.get(`/product/category3/${id}`, { params: { limit } })
  },

  /** 根据 ID 查询详情 */
  getById(id) {
    return request.get(`/product/${id}`)
  },

  /** 新增商品（后端同步更新 ES） */
  add(data) {
    return request.post('/product', data)
  },

  /** 修改商品（后端同步更新 ES） */
  update(data) {
    return request.put('/product', data)
  },

  /** 逻辑删除商品（后端同步更新 ES） */
  remove(id) {
    return request.delete(`/product/${id}`)
  },

  /** 图片上传到 SFTP 文件服务器 */
  upload(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/product/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  /** 重建 Elasticsearch 商品索引（全量同步） */
  rebuildIndex() {
    return request.post('/product/es/rebuild')
  },

  /**
   * 商品图片展示地址（后端从 SFTP 读取回传）
   * 部署 nginx 后由 VITE_IMAGE_BASE_URL 指向静态文件服务器（如 http://192.168.222.4/images）
   */
  imageUrl(fileName) {
    if (!fileName) return ''
    // 默认走开发代理（/api → 后端 8080）
    const base = import.meta.env.VITE_IMAGE_BASE_URL || '/api/product/image'
    return `${base}/${fileName}`
  }
}

export default productApi
