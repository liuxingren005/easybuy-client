<template>
  <div class="product-list-page">
    <!-- 顶部工具栏 -->
    <div class="top-bar">
      <div class="top-inner">
        <img :src="img('logo.png')" class="logo-img" alt="易买网" @click="goHome" />
        <HotSearchBar v-model="searchKeyword" @search="handleSearch" class="search-area" />
        <div class="cart-area">
          <CartHover />
        </div>
      </div>
    </div>

    <!-- 主导航 -->
    <MainNav />

    <!-- 面包屑导航 -->
    <div class="breadcrumb">
      <span class="crumb" @click="goHome">全部</span>
      <span class="sep">›</span>
      <span class="crumb" v-if="category1Name">{{ category1Name }}</span>
      <span class="sep" v-if="category1Name">›</span>
      <span class="crumb" v-if="category2Name">{{ category2Name }}</span>
      <span class="sep" v-if="category2Name">›</span>
      <span class="crumb current" v-if="searchKeyword">搜索：{{ searchKeyword }}</span>
      <span class="crumb current" v-else-if="category3Name">{{ category3Name }}</span>
      <!-- 已选筛选 -->
      <span v-if="selectedBrand" class="filter-tag">
        品牌：{{ selectedBrand }}
        <span class="close" @click="selectedBrand = ''">×</span>
      </span>
      <span v-if="priceRange" class="filter-tag">
        价格：{{ priceRange }}
        <span class="close" @click="clearPriceRange">×</span>
      </span>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <!-- 品牌筛选 -->
      <div class="filter-row">
        <span class="filter-label">品牌：</span>
        <div class="filter-options">
          <span :class="{ active: !selectedBrand }" @click="selectedBrand = ''; loadProducts()">全部</span>
          <span v-for="brand in brands" :key="brand" :class="{ active: selectedBrand === brand }"
            @click="selectBrand(brand)">{{ brand }}</span>
        </div>
      </div>
      <!-- 价格筛选 -->
      <div class="filter-row">
        <span class="filter-label">价格：</span>
        <div class="filter-options">
          <span :class="{ active: !priceRange }" @click="clearPriceRange">全部</span>
          <span v-for="range in priceRanges" :key="range.label" :class="{ active: priceRange === range.label }"
            @click="selectPriceRange(range)">{{ range.label }}</span>
        </div>
      </div>
      <!-- 类型筛选 -->
      <div class="filter-row">
        <span class="filter-label">类型：</span>
        <div class="filter-options">
          <span :class="{ active: !selectedType }" @click="selectedType = ''; loadProducts()">全部</span>
          <span v-for="type in types" :key="type" :class="{ active: selectedType === type }"
            @click="selectType(type)">{{ type }}</span>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧收藏夹 -->
      <div class="sidebar">
        <div class="sidebar-title">
          <span class="title-text">我的收藏</span>
          <span class="clear-btn" @click="clearFavorites">清空</span>
        </div>
        <div class="history-list">
          <div v-for="(item, index) in favoriteList" :key="item.id" class="history-item"
            @click="goDetail(item.id)">
            <div class="history-img">
              <img v-if="item.fileName" :src="productImageUrl(item.fileName)" :alt="item.name" />
              <el-icon v-else size="40" color="#ddd">
                <Picture />
              </el-icon>
            </div>
            <p class="history-name">{{ stripHtml(item.name) }}</p>
            <p class="history-price">¥{{ Number(item.price).toFixed(2) }}</p>
          </div>
          <div v-if="favoriteList.length === 0" class="empty-history">暂无收藏商品</div>
        </div>
      </div>

      <!-- 右侧商品列表 -->
      <div class="product-content">
        <!-- 排序栏 -->
        <div class="sort-bar">
          <div class="sort-options">
            <span :class="{ active: sortBy === 'default' }" @click="sortBy = 'default'; loadProducts()">默认</span>
            <span :class="{ active: sortBy === 'sales' }" @click="sortBy = 'sales'; loadProducts()">
              销量
              <el-icon class="sort-icon">
                <Sort />
              </el-icon>
            </span>
            <span :class="{ active: sortBy === 'price' }" @click="togglePriceSort()">
              价格
              <el-icon class="sort-icon">{{ priceAsc ? '↑' : '↓' }}</el-icon>
            </span>
            <span :class="{ active: sortBy === 'new' }" @click="sortBy = 'new'; loadProducts()">新品</span>
          </div>
          <div class="total-count">共发现 {{ total }} 件</div>
        </div>

        <!-- 商品网格 -->
        <div v-loading="loading" class="product-grid">
          <div v-for="product in productList" :key="product.id" class="product-card" @click="goDetail(product.id)">
            <div class="product-image">
              <img v-if="showImage(product.fileName)" :src="productImageUrl(product.fileName)"
                :alt="stripHtml(product.name)" class="product-img" @error="handleImageError(product.fileName)" />
              <el-icon v-else size="60" color="#ddd">
                <Picture />
              </el-icon>
            </div>

            <p class="product-name" v-html="product.name"></p>
            <p class="product-desc" v-html="product.description || '暂无描述'"></p>

            <div class="product-bottom">
              <span class="product-price">¥{{ Number(product.price).toFixed(2) }}</span>
              <span class="product-sales">{{ product.stock || 0 }}件</span>
            </div>
            <div class="product-actions">
              <el-button size="small" :type="favoriteIds.has(product.id) ? 'success' : 'danger'" plain
                @click.stop="toggleFavorite(product)">
                <el-icon>
                  <Star />
                </el-icon>{{ favoriteIds.has(product.id) ? '已收藏' : '收藏' }}
              </el-button>
              <el-button size="small" type="primary" @click.stop="addToCart(product)">
                <el-icon>
                  <ShoppingCart />
                </el-icon>加入购物车
              </el-button>
            </div>
          </div>
          <div v-if="!loading && productList.length === 0" class="no-products">
            <el-empty description="暂无符合条件的商品" />
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination" v-if="total > 0">
          <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :page-sizes="[12, 24, 48]"
            :total="total" layout="total, prev, pager, next, jumper" background @size-change="handleSizeChange"
            @current-change="handlePageChange" />
        </div>
      </div>
    </div>

    <!-- 底部 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ShoppingCart, Picture, Star, Sort } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useImageResolver, useImageFallback } from '@/composables/useImage'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import productApi from '@/api/product'
import categoryApi from '@/api/category'
import favoriteApi from '@/api/favorite'
import Footer from '@/components/Footer.vue'
import CartHover from '@/components/CartHover.vue'
import HotSearchBar from '@/components/HotSearchBar.vue'
import MainNav from '@/components/MainNav.vue'
import { stripHtml } from '@/utils/stripHtml'

const router = useRouter()
const route = useRoute()
const { img } = useImageResolver()
const { showImage, handleImageError } = useImageFallback()

// 商品图片地址
const productImageUrl = (fileName) => productApi.imageUrl(fileName)

// 搜索关键词
const searchKeyword = ref('')

// 购物车
const cartStore = useCartStore()

// 用户（收藏登录）
const userStore = useUserStore()

// 收藏列表
const favoriteList = ref([])

// 已收藏商品ID集合
const favoriteIds = computed(() => new Set(favoriteList.value.map(item => item.id)))

// 分类信息
const category1Name = ref('')
const category2Name = ref('')
const category3Name = ref('')

// 筛选条件
const selectedBrand = ref('')
const selectedType = ref('')
const priceRange = ref('')
const minPrice = ref(null)
const maxPrice = ref(null)

// 品牌列表（接口）
const brands = [
  '香奈儿（Chanel）', '迪奥（Dior）', '范思哲（VERSACE）', '菲拉格慕（Ferragamo）',
  '兰蔻（LANCOME）', '爱马仕（HERMÈS）', '卡文克莱（Calvin Klein）', '古驰（GUCCI）',
  '宝格丽（BVLGARI）', '阿迪达斯（Adidas）', '卡尔文·克莱恩（CK）', '大卫杜夫（Davidoff）'
]

// 价格区间
const priceRanges = [
  { label: '0-199', min: 0, max: 199 },
  { label: '200-399', min: 200, max: 399 },
  { label: '400-599', min: 400, max: 599 },
  { label: '600-899', min: 600, max: 899 },
  { label: '900-1299', min: 900, max: 1299 },
  { label: '1300-1399', min: 1300, max: 1399 },
  { label: '1500以上', min: 1500, max: null }
]

// 类型列表
const types = ['女士香水', '男士香水', 'Q版香水', '组合套装', '香体走珠', '其它']

// 排序
const sortBy = ref('default')
const priceAsc = ref(true)

// 分页
const pageNum = ref(1)
const pageSize = ref(12)
const total = ref(0)
const loading = ref(false)
const productList = ref([])

// 浏览历史
const browseHistory = ref([])

// 加载商品列表
const loadProducts = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value || undefined,
      categoryLevel1Id: route.query.category1Id ? Number(route.query.category1Id) : undefined,
      minPrice: minPrice.value,
      maxPrice: maxPrice.value
    }
    const res = await productApi.search(params)
    productList.value = res.page?.list || []
    total.value = res.page?.total || 0
  } catch (e) {
    // 降级：使用分页查询
    try {
      const params = {
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        categoryLevel1Id: route.query.category1Id ? Number(route.query.category1Id) : undefined,
        categoryLevel2Id: route.query.category2Id ? Number(route.query.category2Id) : undefined,
        categoryLevel3Id: route.query.category3Id ? Number(route.query.category3Id) : undefined
      }
      const res = await productApi.getPage(params)
      productList.value = res.page?.list || []
      total.value = res.page?.total || 0
    } catch (err) {
      productList.value = []
      total.value = 0
    }
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = (keyword) => {
  pageNum.value = 1
  loadProducts()
}

// 选择品牌
const selectBrand = (brand) => {
  selectedBrand.value = brand
  pageNum.value = 1
  loadProducts()
}

// 选择价格区间
const selectPriceRange = (range) => {
  priceRange.value = range.label
  minPrice.value = range.min
  maxPrice.value = range.max
  pageNum.value = 1
  loadProducts()
}

// 清除价格筛选
const clearPriceRange = () => {
  priceRange.value = ''
  minPrice.value = null
  maxPrice.value = null
  pageNum.value = 1
  loadProducts()
}

// 选择类型
const selectType = (type) => {
  selectedType.value = type
  pageNum.value = 1
  loadProducts()
}

// 价格排序切换
const togglePriceSort = () => {
  sortBy.value = 'price'
  priceAsc.value = !priceAsc.value
  loadProducts()
}

// 分页
const handlePageChange = () => {
  loadProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSizeChange = () => {
  pageNum.value = 1
  loadProducts()
}

// 跳转商品详情
const goDetail = (id) => {
  // 浏览历史本地存储
  /* const product = productList.value.find(p => p.id === id)
  if (product) {
    addToHistory(product)
  } */
  router.push(`/product/${id}`)
}

// 添加到浏览历史
/* const addToHistory = (product) => {
  // 浏览历史本地存储
  const history = JSON.parse(localStorage.getItem('browseHistory') || '[]')
  // 去重
  const filtered = history.filter(item => item.id !== product.id)
  filtered.unshift(product)
  // 最多保留10条
  if (filtered.length > 10) filtered.pop()
  localStorage.setItem('browseHistory', JSON.stringify(filtered))
  browseHistory.value = filtered
} */

// 清空浏览历史
const clearHistory = () => {
  // 浏览历史本地存储
  /* localStorage.removeItem('browseHistory') */
  browseHistory.value = []
}

// 加入购物车
const addToCart = async (product) => {
  const isSuccess = await cartStore.addToCart(product, 1)
  if (isSuccess) {
    ElMessage.success(`已将「${stripHtml(product.name)}」加入购物车`)
  }
}

// 跳转购物车
const goCart = () => {
  router.push('/cart')
}

// 收藏/取消收藏切换
const toggleFavorite = async (product) => {
  // 收藏登录
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再收藏商品')
    router.push('/login')
    return
  }
  const isFavorited = favoriteIds.value.has(product.id)
  try {
    const res = isFavorited
      ? await favoriteApi.remove(product.id)
      : await favoriteApi.add(product.id)
    favoriteList.value = res.list || []
    ElMessage.success(isFavorited ? '已取消收藏' : '收藏成功')
  } catch (e) { }
}

// 加载收藏列表
const loadFavorites = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await favoriteApi.getList()
    favoriteList.value = res.list || []
  } catch (e) { }
}

// 清空收藏
const clearFavorites = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await favoriteApi.clear()
    favoriteList.value = res.list || []
    ElMessage.success('已清空收藏')
  } catch (e) { }
}

// 返回首页
const goHome = () => {
  router.push('/')
}

// 加载分类名称
const loadCategoryNames = async () => {
  try {
    if (route.query.category1Id) {
      const res = await categoryApi.getById(route.query.category1Id)
      category1Name.value = res.data?.name || ''
    }
    if (route.query.category2Id) {
      const res = await categoryApi.getById(route.query.category2Id)
      category2Name.value = res.data?.name || ''
    }
    if (route.query.category3Id) {
      const res = await categoryApi.getById(route.query.category3Id)
      category3Name.value = res.data?.name || ''
    }
  } catch (e) { }
}

onMounted(() => {
  // 从URL获取搜索关键词
  if (route.query.keyword) {
    searchKeyword.value = route.query.keyword
  }
  // 加载浏览历史（本地存储）
  /* browseHistory.value = JSON.parse(localStorage.getItem('browseHistory') || '[]') */
  // 加载分类名称
  loadCategoryNames()
  // 加载收藏列表
  loadFavorites()
  // 加载商品
  loadProducts()
})
</script>

<style scoped>
.product-list-page {
  background: #f5f5f5;
  min-height: 100vh;
}

/* 顶部工具栏 */
.top-bar {
  background: #fff;
  border-bottom: 1px solid #eee;
}

.top-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 15px 20px;
}

.logo-img {
  height: 50px;
  width: auto;
  cursor: pointer;
}

.search-area {
  flex: 1;
  max-width: 600px;
}

/* 面包屑 */
.breadcrumb {
  max-width: 1200px;
  margin: 10px auto;
  padding: 0 20px;
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.breadcrumb .crumb {
  cursor: pointer;
}

.breadcrumb .crumb:hover {
  color: #ff6600;
}

.breadcrumb .crumb.current {
  color: #ff6600;
  font-weight: bold;
  cursor: default;
}

.breadcrumb .sep {
  color: #ccc;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #fff5f0;
  color: #ff6600;
  border: 1px solid #ffd4b8;
  border-radius: 3px;
  font-size: 12px;
  margin-left: 10px;
}

.filter-tag .close {
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

/* 筛选区域 */
.filter-section {
  max-width: 1200px;
  margin: 0 auto 10px;
  background: #fff;
  border: 1px solid #e8e8e8;
}

.filter-row {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-row:last-child {
  border-bottom: none;
}

.filter-label {
  width: 70px;
  flex-shrink: 0;
  color: #999;
  font-size: 13px;
  padding-top: 4px;
}

.filter-options {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 0;
}

.filter-options span {
  padding: 4px 12px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.2s;
}

.filter-options span:hover {
  color: #ff6600;
}

.filter-options span.active {
  background: #ff6600;
  color: #fff;
}

/* 主内容区 */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 10px;
}

/* 左侧边栏 */
.sidebar {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e8e8e8;
}

.sidebar-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
}

.title-text {
  font-size: 14px;
  font-weight: bold;
  color: #ff6600;
  border-left: 3px solid #ff6600;
  padding-left: 8px;
}

.clear-btn {
  font-size: 12px;
  color: #999;
  cursor: pointer;
}

.clear-btn:hover {
  color: #ff6600;
}

.history-list {
  padding: 10px;
}

.history-item {
  text-align: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.history-item:last-child {
  border-bottom: none;
}

.history-img {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}

.history-img img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.history-name {
  font-size: 12px;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-price {
  font-size: 13px;
  color: #ff4e00;
  font-weight: bold;
}

.empty-history {
  text-align: center;
  color: #ccc;
  padding: 30px 0;
  font-size: 12px;
}

/* 右侧商品内容 */
.product-content {
  flex: 1;
  background: #fff;
  border: 1px solid #e8e8e8;
}

/* 排序栏 */
.sort-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #eee;
  background: #fafafa;
}

.sort-options {
  display: flex;
  gap: 0;
}

.sort-options span {
  padding: 6px 16px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  border: 1px solid #ddd;
  border-right: none;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-options span:first-child {
  border-radius: 3px 0 0 3px;
}

.sort-options span:last-child {
  border-right: 1px solid #ddd;
  border-radius: 0 3px 3px 0;
}

.sort-options span.active {
  background: #ff6600;
  color: #fff;
  border-color: #ff6600;
}

.sort-icon {
  font-size: 12px;
}

.total-count {
  font-size: 13px;
  color: #999;
}

/* 商品网格 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 10px;
  min-height: 400px;
}

.product-card {
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.product-card:hover {
  border-color: #ff6600;
  box-shadow: 0 2px 8px rgba(255, 102, 0, 0.15);
}

.product-image {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 4px;
  margin-bottom: 8px;
}

.product-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.product-name {
  font-size: 13px;
  color: #333;
  margin-bottom: 4px;
  height: 36px;
  line-height: 18px;
  overflow: hidden;
  display: box;
  line-clamp: 2;
  box-orient: vertical;
}

.product-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
  height: 18px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.product-price {
  font-size: 18px;
  font-weight: bold;
  color: #ff4e00;
}

.product-sales {
  font-size: 12px;
  color: #999;
}

.product-actions {
  display: flex;
  gap: 6px;
}

.product-actions .el-button {
  flex: 1;
}

.no-products {
  grid-column: 1 / -1;
  padding: 60px 0;
}

/* 分页 */
.pagination {
  padding: 20px;
  display: flex;
  justify-content: center;
}
</style>
