<template>
  <div class="product-detail-page">
    <!-- 顶部工具栏 -->
    <div class="top-bar">
      <div class="top-inner">
        <img :src="img('logo.png')" class="logo-img" alt="易买网" @click="goHome" />
        <HotSearchBar @search="handleSearch" class="search-area" />
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
      <span class="crumb current">{{ product?.name || '商品详情' }}</span>
    </div>

    <!-- 商品详情主体 -->
    <div v-loading="loading" class="detail-main">
      <div class="detail-content" v-if="product">
        <!-- 左侧图片区 -->
        <div class="product-images">
          <div class="main-image"
               @mouseenter="zoomEnter"
               @mouseleave="zoomLeave"
               @mousemove="zoomMove">
            <!-- 主图 -->
            <transition name="img-fade" mode="out-in">
              <img v-if="showCurrentImage"
                   :key="currentImageSrc"
                   :src="currentImageSrc"
                   :alt="product.name"
                   ref="mainImg"
                   @error="handleImageError(currentFileName)" />
              <el-icon v-else :key="'placeholder'" size="120" color="#ddd"><Picture /></el-icon>
            </transition>
            <!-- 放大镜标记 -->
            <div v-if="zoomVisible && showCurrentImage" class="zoom-lens" :style="lensStyle"></div>
          </div>
          <!-- 大图预览面板 -->
          <div v-if="zoomVisible && showCurrentImage" class="zoom-panel" :style="panelStyle">
            <img :src="currentImageSrc" :style="panelImgStyle" />
          </div>
          <!-- 缩略图列表 -->
          <div class="thumb-list">
            <div class="thumb-arrow prev" @click="prevThumb">‹</div>
            <div class="thumbs-wrapper">
              <div class="thumbs">
                <div v-for="(thumb, index) in thumbList" :key="index"
                  :class="{ active: currentThumbIndex === index }"
                  class="thumb-item"
                  @click="currentThumbIndex = index">
                  <img v-if="showThumb(thumb)" :src="productImageUrl(thumb)" :alt="`缩略图${index+1}`"
                    @error="handleImageError(thumb)" />
                  <el-icon v-else size="40" color="#ddd"><Picture /></el-icon>
                </div>
              </div>
            </div>
            <div class="thumb-arrow next" @click="nextThumb">›</div>
          </div>
        </div>

        <!-- 右侧商品信息 -->
        <div class="product-info">
          <h1 class="product-title">{{ product.name }}</h1>
          <p class="product-subtitle">"开业巨惠，专柜直供"，不光低价，"真"才靠谱！</p>

          <div class="price-section">
            <span class="price-label">本店价格：</span>
            <span class="price-value">¥{{ Number(product.price).toFixed(2) }}</span>
          </div>

          <div class="points-section">
            <span class="points-label">消费积分：</span>
            <span class="points-value">{{ Math.floor(product.price) }}R</span>
          </div>

          <!-- 规格选择 -->
          <div class="spec-section">
            <span class="spec-label">规格选择：</span>
            <div class="spec-options">
              <span v-for="spec in specs" :key="spec"
                :class="{ active: selectedSpec === spec }"
                @click="selectedSpec = spec">{{ spec }}
                <span v-if="selectedSpec === spec" class="check">✓</span>
              </span>
            </div>
          </div>

          <!-- 分享/收藏 -->
          <div class="action-row">
            <span class="share-btn" @click="handleShare">
              <el-icon><Share /></el-icon>分享
            </span>
            <span class="favorite-btn" :class="{ active: isFavorited }" @click="toggleFavorite">
              <el-icon><Star /></el-icon>{{ isFavorited ? '已关注' : '关注商品' }}
            </span>
          </div>

          <!-- 数量选择 + 加入购物车 -->
          <div class="buy-section">
            <div class="quantity-selector">
              <el-input-number v-model="quantity" :min="1" :max="product.stock || 99" size="small" />
            </div>
            <div class="buy-subtotal">
              <span class="subtotal-label">小计：</span>
              <span class="subtotal-price">¥{{ buySubtotal.toFixed(2) }}</span>
            </div>
            <el-button type="primary" size="large" class="add-cart-btn" @click="addToCart">
              <el-icon><ShoppingCart /></el-icon>加入购物车
            </el-button>
          </div>

          <!-- 库存提示 -->
          <div class="stock-info">
            <span>库存：{{ product.stock || 0 }} 件</span>
          </div>
        </div>

        <!-- 右侧品牌区 -->
        <div class="brand-sidebar">
          <div class="brand-logo">
            <div class="brand-name">{{ brandName }}</div>
          </div>
          <el-button plain class="brand-entry-btn">进入品牌专区</el-button>
        </div>
      </div>
    </div>

    <!-- 推荐区域 -->
    <div class="recommend-section">
      <div class="recommend-sidebar">
        <div class="recommend-title">用户还喜欢</div>
        <div class="recommend-products">
          <div v-for="item in recommendProducts" :key="item.id" class="recommend-item" @click="goDetail(item.id)">
            <div class="recommend-img">
              <img v-if="item.fileName" :src="productImageUrl(item.fileName)" :alt="item.name" />
              <el-icon v-else size="40" color="#ddd"><Picture /></el-icon>
            </div>
            <p class="recommend-name">{{ item.name }}</p>
            <p class="recommend-price">¥{{ Number(item.price).toFixed(2) }}</p>
          </div>
        </div>
      </div>

      <div class="recommend-main">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="推荐搭配" name="combo">
            <div class="combo-section">
              <div class="combo-products">
                <template v-for="(item, index) in comboProducts" :key="item.id">
                  <div class="combo-item" :class="{ selected: isComboSelected(item.id) }" @click="toggleComboItem(item.id)">
                    <span class="combo-check" :class="{ checked: isComboSelected(item.id) }">
                      <el-icon v-if="isComboSelected(item.id)"><CircleCheck /></el-icon>
                    </span>
                    <div class="combo-img">
                      <img v-if="item.fileName" :src="productImageUrl(item.fileName)" :alt="item.name" />
                      <el-icon v-else size="50" color="#ddd"><Picture /></el-icon>
                    </div>
                    <p class="combo-name">{{ item.name }}</p>
                    <p class="combo-price">¥{{ Number(item.price).toFixed(2) }}</p>
                  </div>
                  <!-- 商品之间 + -->
                  <span v-if="index < comboProducts.length - 1" class="combo-plus">+</span>
                </template>
              </div>
              <div class="combo-result" v-if="selectedComboProducts.length > 0">
                <span class="combo-equal">=</span>
                <div class="combo-total">
                  <span class="combo-label">单套价：</span>
                  <span class="combo-price-total">¥{{ comboTotalPrice.toFixed(2) }}</span>
                  <span class="combo-times">× {{ comboQuantity }}</span>
                  <span class="combo-subtotal-label">合计：</span>
                  <span class="combo-subtotal">¥{{ comboSubtotal.toFixed(2) }}</span>
                </div>
                <el-input-number v-model="comboQuantity" :min="1" :max="comboMaxStock" :step-strictly="true" size="small" style="width: 140px" />
                <el-button type="primary" size="large" class="combo-buy-btn" @click="buyCombo">组合购买</el-button>
              </div>
              <div class="combo-empty" v-else>
                <el-empty description="请至少选择一件组合商品" :image-size="60" />
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="商品详情" name="detail">
            <div class="detail-desc">
              <h3>商品详情</h3>
              <p>{{ product?.description || '暂无商品描述' }}</p>
              <h3>规格参数</h3>
              <table class="spec-table">
                <tbody>
                  <tr><td>商品名称</td><td>{{ product?.name }}</td></tr>
                  <tr><td>商品价格</td><td>¥{{ product ? Number(product.price).toFixed(2) : '0.00' }}</td></tr>
                  <tr><td>商品库存</td><td>{{ product?.stock || 0 }} 件</td></tr>
                  <tr><td>上架时间</td><td>{{ product?.createTime || '-' }}</td></tr>
                </tbody>
              </table>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 底部 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ShoppingCart, Picture, Star, Share, CircleCheck } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useImage } from '@/composables/useImage'
import { useCartStore } from '@/stores/cart'
import productApi from '@/api/product'
import categoryApi from '@/api/category'
import Footer from '@/components/Footer.vue'
import CartHover from '@/components/CartHover.vue'
import HotSearchBar from '@/components/HotSearchBar.vue'
import MainNav from '@/components/MainNav.vue'

const router = useRouter()
const route = useRoute()
const { img } = useImage()

const productImageUrl = (fileName) => productApi.imageUrl(fileName)

// 商品数据
const product = ref(null)
const loading = ref(false)

// 搜索
const handleSearch = (keyword) => {
  router.push(`/products?keyword=${encodeURIComponent(keyword)}`)
}

// 购物车
const cartStore = useCartStore()

// 分类名称
const category1Name = ref('')
const category2Name = ref('')

// 品牌名
const brandName = computed(() => {
  if (!product.value?.name) return '品牌'
  // 从商品名提取品牌名
  const name = product.value.name
  if (name.includes('迪奥') || name.includes('Dior')) return 'Dior 迪奥'
  if (name.includes('香奈儿') || name.includes('Chanel')) return 'Chanel 香奈儿'
  return '品牌'
})

// 规格选择
const specs = ['大', '中', '小']
const selectedSpec = ref('中')

// 数量
const quantity = ref(1)
const comboQuantity = ref(1)

// 收藏
const isFavorited = ref(false)

// 缩略图
const thumbList = computed(() => {
  if (!product.value?.fileName) return ['', '', '', '']
  // 模拟多张缩略图（首张商品图）（nginx 静态文件服务器）
  return [product.value.fileName, '', '', '']
})
const currentThumbIndex = ref(0)
// 当前主图文件名
const currentFileName = computed(() => thumbList.value[currentThumbIndex.value] || '')
// 当前主图
const currentImageSrc = computed(() => {
  return productImageUrl(currentFileName.value)
})

// 图片加载失败登记
const failedImages = ref(new Set())
const handleImageError = (fileName) => {
  failedImages.value.add(fileName)
}
const showThumb = (fileName) => !!fileName && !failedImages.value.has(fileName)
// 主图是否可显示（有文件名且未加载失败）
const showCurrentImage = computed(() => showThumb(currentFileName.value))

// 放大镜
const mainImg = ref(null)
const zoomVisible = ref(false)
const lensPos = ref({ x: 0, y: 0 })
const mainRect = ref({ w: 400, h: 400 })

// 放大镜标记大小（小图）和面板大小（大图）
const LENS_SIZE = 150
const PANEL_SIZE = 400
// 放大倍率 = 面板尺寸 / 放大镜尺寸
const ZOOM_RATIO = PANEL_SIZE / LENS_SIZE

const lensStyle = computed(() => ({
  left: `${lensPos.value.x - LENS_SIZE / 2}px`,
  top: `${lensPos.value.y - LENS_SIZE / 2}px`,
  width: `${LENS_SIZE}px`,
  height: `${LENS_SIZE}px`
}))
const panelStyle = computed(() => ({
  // 面板
  top: `${mainRect.value.top}px`,
  left: `${mainRect.value.right + 12}px`,
  width: `${PANEL_SIZE}px`,
  height: `${PANEL_SIZE}px`
}))
const panelImgStyle = computed(() => {
  // 大图按比例放大：背景偏移 = -lensPos * ratio + 面板中心补偿
  const imgW = mainRect.value.w * ZOOM_RATIO
  const imgH = mainRect.value.h * ZOOM_RATIO
  const bgX = -(lensPos.value.x * ZOOM_RATIO - PANEL_SIZE / 2)
  const bgY = -(lensPos.value.y * ZOOM_RATIO - PANEL_SIZE / 2)
  return {
    width: `${imgW}px`,
    height: `${imgH}px`,
    objectFit: 'fill',
    transform: `translate(${bgX}px, ${bgY}px)`
  }
})

const zoomEnter = (e) => {
  const rect = e.currentTarget.getBoundingClientRect()
  mainRect.value = {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    w: rect.width,
    h: rect.height
  }
  zoomVisible.value = true
}
const zoomLeave = () => {
  zoomVisible.value = false
}
const zoomMove = (e) => {
  const rect = e.currentTarget.getBoundingClientRect()
  // 转换坐标
  let x = e.clientX - rect.left
  let y = e.clientY - rect.top
  // 边界
  x = Math.max(LENS_SIZE / 2, Math.min(rect.width - LENS_SIZE / 2, x))
  y = Math.max(LENS_SIZE / 2, Math.min(rect.height - LENS_SIZE / 2, y))
  lensPos.value = { x, y }
}

// 缩略图切换（循环）
const prevThumb = () => {
  const len = thumbList.value.length
  currentThumbIndex.value = (currentThumbIndex.value - 1 + len) % len
}
const nextThumb = () => {
  const len = thumbList.value.length
  currentThumbIndex.value = (currentThumbIndex.value + 1) % len
}

// 推荐商品
const recommendProducts = ref([])
const comboProducts = ref([])
// 组合商品选中集合（默认全部选中）
const selectedComboIds = ref(new Set())
const selectedComboProducts = computed(() => {
  return comboProducts.value.filter(item => selectedComboIds.value.has(item.id))
})
// 判断商品是否被选中
const isComboSelected = (id) => selectedComboIds.value.has(id)
// 切换商品选中状态（至少保留一件）
const toggleComboItem = (id) => {
  const set = new Set(selectedComboIds.value)
  if (set.has(id)) {
    if (set.size <= 1) {
      ElMessage.warning('至少保留一件组合商品')
      return
    }
    set.delete(id)
  } else {
    set.add(id)
  }
  selectedComboIds.value = set
}
const comboTotalPrice = computed(() => {
  return selectedComboProducts.value.reduce((sum, item) => sum + Number(item.price || 0), 0)
})
// 库存（木桶效应）
const comboMaxStock = computed(() => {
  if (selectedComboProducts.value.length === 0) return 99
  return Math.min(...selectedComboProducts.value.map(p => p.stock || 99))
})
// 组合购买：单套价 × 数量 = 合计
const comboSubtotal = computed(() => {
  const qty = comboQuantity.value || 1
  return comboTotalPrice.value * qty
})
// 单项购买：单价 × 数量 = 小计
const buySubtotal = computed(() => {
  const qty = quantity.value || 1
  return (product.value ? Number(product.value.price) : 0) * qty
})

// 防护
watch(quantity, (v) => {
  if (v === null || v === undefined || v < 1) {
    quantity.value = 1
  } else {
    const max = product.value?.stock || 99
    if (v > max) quantity.value = max
  }
})
watch(comboQuantity, (v) => {
  if (v === null || v === undefined || v < 1) {
    comboQuantity.value = 1
  } else {
    const max = comboMaxStock.value || 99
    if (v > max) comboQuantity.value = max
  }
})

// Tab
const activeTab = ref('combo')

// 加载商品详情
const loadProduct = async () => {
  loading.value = true
  try {
    const id = route.params.id
    const res = await productApi.getById(id)
    product.value = res.data
    // 切换商品时回到首张缩略图
    currentThumbIndex.value = 0
    // 加载分类名称
    if (res.data?.categoryLevel1Id) {
      try {
        const catRes = await categoryApi.getById(res.data.categoryLevel1Id)
        category1Name.value = catRes.data?.name || ''
      } catch (e) {}
    }
    if (res.data?.categoryLevel2Id) {
      try {
        const catRes = await categoryApi.getById(res.data.categoryLevel2Id)
        category2Name.value = catRes.data?.name || ''
      } catch (e) {}
    }
    // 加载推荐商品
    loadRecommendProducts()
    // 添加到浏览历史
    /* addToHistory(res.data) */
  } catch (e) {
    ElMessage.error('加载商品详情失败')
  } finally {
    loading.value = false
  }
}

// 加载推荐商品
const loadRecommendProducts = async () => {
  try {
    if (product.value?.categoryLevel1Id) {
      const res = await productApi.getByCategory1(product.value.categoryLevel1Id, 8)
      const list = res.list || []
      recommendProducts.value = list.filter(p => p.id !== product.value?.id).slice(0, 4)
      comboProducts.value = list.filter(p => p.id !== product.value?.id).slice(0, 3)
      // 默认全部选中
      selectedComboIds.value = new Set(comboProducts.value.map(p => p.id))
    }
  } catch (e) {
    // 无推荐数据时静默
  }
}

// 添加到浏览历史
/* const addToHistory = (prod) => {
  // 浏览历史本地存储
  try {
    const history = JSON.parse(localStorage.getItem('browseHistory') || '[]')
    const filtered = history.filter(item => item.id !== prod.id)
    filtered.unshift(prod)
    if (filtered.length > 10) filtered.pop()
    localStorage.setItem('browseHistory', JSON.stringify(filtered))
  } catch (e) {}
} */

// 加入购物车
const addToCart = async () => {
  const qty = quantity.value || 1
  const isSuccess = await cartStore.addToCart(product.value, qty)
  if (isSuccess) {
    ElMessage.success(`已将「${product.value.name}」${qty}件加入购物车`)
  }
}

// 跳转购物车
const goCart = () => {
  router.push('/cart')
}

// 收藏切换
const toggleFavorite = () => {
  isFavorited.value = !isFavorited.value
  ElMessage.success(isFavorited.value ? '已关注该商品' : '已取消关注')
}

// 分享
const handleShare = () => {
  ElMessage.info('分享功能暂未开放')
}

// 跳转详情
const goDetail = (id) => {
  router.push(`/product/${id}`)
}

// 组合购买
const buyCombo = async () => {
  // 选中保护
  if (selectedComboProducts.value.length === 0) {
    ElMessage.warning('请至少选择一件组合商品')
    return
  }
  // 库存（木桶效应）
  const overStock = selectedComboProducts.value.find(p => (p.stock || 0) < comboQuantity.value)
  if (overStock) {
    ElMessage.warning(`「${overStock.name}」库存不足（仅剩 ${overStock.stock || 0} 件）`)
    return
  }
  const qty = comboQuantity.value
  // 顺序 await 逐件加入（异步调用）
  for (const p of selectedComboProducts.value) {
    const isSuccess = await cartStore.addToCart(p, qty)
    if (!isSuccess) return // 未登录/失败时终止
  }
  ElMessage.success(`已将 ${selectedComboProducts.value.length} 件组合商品 × ${qty} 套加入购物车`)
}

// 返回首页
const goHome = () => {
  router.push('/')
}

onMounted(() => {
  loadProduct()
})
</script>

<style scoped>
.product-detail-page {
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
  color: #333;
  cursor: default;
}
.breadcrumb .sep {
  color: #ccc;
}

/* 商品详情主体 */
.detail-main {
  max-width: 1200px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #e8e8e8;
}
.detail-content {
  display: flex;
  padding: 20px;
  gap: 20px;
  overflow-x: hidden;
}

/* 左侧图片区 */
.product-images {
  width: 400px;
  flex-shrink: 0;
}
.main-image {
  position: relative;
  width: 400px;
  height: 400px;
  border: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  background: #fafafa;
  cursor: crosshair;
  overflow: hidden;
}
.main-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  pointer-events: none;
}
/* 放大镜标记 */
.zoom-lens {
  position: absolute;
  border: 1px solid rgba(255, 102, 0, 0.7);
  background: rgba(255, 255, 255, 0.25);
  pointer-events: none;
  z-index: 10;
}
/* 大图预览面板 */
.zoom-panel {
  position: fixed;
  border: 1px solid #eee;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  pointer-events: none;
}
.zoom-panel img {
  position: absolute;
  top: 0;
  left: 0;
  max-width: none;
}

/* 缩略图列表 */
.thumb-list {
  display: flex;
  align-items: center;
  gap: 8px;
}
.thumb-arrow {
  width: 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 20px;
  color: #999;
  border-radius: 3px;
}
.thumb-arrow:hover {
  background: #ff6600;
  color: #fff;
}
.thumbs-wrapper {
  flex: 1;
  overflow: hidden;
}
.thumbs {
  display: flex;
  gap: 8px;
}
.thumb-item {
  width: 60px;
  height: 60px;
  border: 2px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}
.thumb-item.active {
  border-color: #ff6600;
}
.thumb-item img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 主图切换淡入淡出 */
.img-fade-enter-active, .img-fade-leave-active { transition: opacity 0.25s ease; }
.img-fade-enter-from, .img-fade-leave-to { opacity: 0; }

/* 中间商品信息 */
.product-info {
  flex: 1;
  min-width: 0;
  padding: 0 10px;
}
.product-title {
  font-size: 20px;
  color: #333;
  margin: 0 0 8px;
  font-weight: bold;
}
.product-subtitle {
  font-size: 14px;
  color: #ff4e00;
  margin-bottom: 20px;
}
.price-section {
  background: #fff5f0;
  padding: 15px 20px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  border-radius: 4px;
}
.price-label {
  font-size: 14px;
  color: #999;
  width: 80px;
  flex-shrink: 0;
}
.price-value {
  font-size: 28px;
  font-weight: bold;
  color: #ff4e00;
}
.points-section {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 8px 20px;
}
.points-label {
  font-size: 14px;
  color: #999;
  width: 80px;
  flex-shrink: 0;
}
.points-value {
  font-size: 14px;
  color: #333;
}

/* 规格选择 */
.spec-section {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  padding: 8px 20px;
}
.spec-label {
  font-size: 14px;
  color: #999;
  width: 80px;
  padding-top: 6px;
  flex-shrink: 0;
}
.spec-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.spec-options span {
  position: relative;
  padding: 6px 16px;
  border: 1px solid #ccc;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  border-radius: 3px;
  background: #fff;
}
.spec-options span:hover {
  border-color: #ff6600;
  color: #ff6600;
}
.spec-options span.active {
  border-color: #ff6600;
  color: #ff6600;
  border-width: 2px;
  padding: 5px 15px;
}
.spec-options .check {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #ff6600;
  color: #fff;
  font-size: 10px;
  line-height: 1;
  padding: 1px 3px;
}

/* 分享/收藏 */
.action-row {
  display: flex;
  gap: 30px;
  padding: 10px 20px;
  margin-bottom: 20px;
}
.share-btn, .favorite-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}
.share-btn:hover, .favorite-btn:hover {
  color: #ff6600;
}
.favorite-btn.active {
  color: #ff6600;
}

/* 购买区 */
.buy-section {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 0;
  border-top: 1px solid #f0f0f0;
}
.quantity-selector {
  width: 140px;
  flex-shrink: 0;
}
.quantity-selector :deep(.el-input-number) {
  width: 100%;
}
.buy-subtotal {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}
.subtotal-label { font-size: 13px; color: #999; line-height: 1; }
.subtotal-price {
  font-size: 20px;
  color: #ff4e00;
  font-weight: bold;
  line-height: 1;
  width: 75px;
  text-align: right;
  font-variant-numeric: tabular-nums;   /* 等宽数字 */
}
.add-cart-btn {
  flex-shrink: 0;
  width: 160px;
  background: #ff6600;
  border-color: #ff6600;
  height: 50px;
  font-size: 16px;
}
.add-cart-btn:hover {
  background: #ff4e00;
  border-color: #ff4e00;
}
.stock-info {
  padding: 0 20px 10px;
  font-size: 13px;
  color: #999;
}

/* 右侧品牌区 */
.brand-sidebar {
  width: 160px;
  flex-shrink: 0;
  text-align: center;
}
.brand-logo {
  height: 120px;
  border: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  background: #fafafa;
}
.brand-name {
  font-size: 36px;
  font-weight: bold;
  color: #333;
  font-family: serif;
}
.brand-entry-btn {
  width: 100%;
}

/* 推荐区域 */
.recommend-section {
  max-width: 1200px;
  margin: 15px auto;
  display: flex;
  gap: 10px;
}
.recommend-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e8e8e8;
}
.recommend-title {
  padding: 10px 12px;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  border-bottom: 1px solid #eee;
}
.recommend-products {
  padding: 10px;
}
.recommend-item {
  text-align: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}
.recommend-item:last-child {
  border-bottom: none;
}
.recommend-img {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}
.recommend-img img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.recommend-name {
  font-size: 12px;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recommend-price {
  font-size: 13px;
  color: #ff4e00;
  font-weight: bold;
}

.recommend-main {
  flex: 1;
  background: #fff;
  border: 1px solid #e8e8e8;
  padding: 0 20px 20px;
}

/* 组合购买 */
.combo-section {
  padding-top: 20px;
}
.combo-products {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.combo-item {
  position: relative;
  width: 160px;
  text-align: center;
  border: 2px solid #eee;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.combo-item:hover {
  border-color: #ffcc99;
}
.combo-item.selected {
  border-color: #ff6600;
  background: #fffaf5;
}
/* 勾选标记 */
.combo-check {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 20px;
  height: 20px;
  border: 1.5px solid #ccc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  transition: all 0.2s;
}
.combo-check.checked {
  background: #ff6600;
  border-color: #ff6600;
  color: #fff;
}
.combo-check .el-icon {
  font-size: 14px;
}
.combo-img {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}
.combo-img img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.combo-name {
  font-size: 12px;
  color: #333;
  margin-bottom: 4px;
  height: 32px;
  overflow: hidden;
  line-height: 16px;
}
.combo-price {
  font-size: 14px;
  color: #ff4e00;
  font-weight: bold;
}
.combo-plus {
  font-size: 24px;
  color: #999;
  font-weight: bold;
}
.combo-result {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 15px;
  padding: 15px 20px;
  border-top: 1px solid #eee;
}
.combo-empty {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}
.combo-equal {
  font-size: 24px;
  color: #999;
  font-weight: bold;
}
.combo-total {
  text-align: right;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.combo-label {
  font-size: 13px;
  color: #999;
  line-height: 1;
}
.combo-price-total {
  font-size: 16px;
  color: #ff4e00;
  font-weight: bold;
  line-height: 1;
}
.combo-times {
  font-size: 13px;
  color: #999;
  line-height: 1;
}
.combo-subtotal-label {
  font-size: 13px;
  color: #333;
  margin-left: 6px;
  line-height: 1;
}
.combo-subtotal {
  font-size: 22px;
  font-weight: bold;
  color: #ff4e00;
  line-height: 1;
  width: 120px;
  text-align: right;
  font-variant-numeric: tabular-nums;   /* 等宽数字 */
}
.combo-buy-btn {
  width: 160px;
  height: 50px;
  font-size: 16px;
  background: #ff6600;
  border-color: #ff6600;
}
.combo-buy-btn:hover {
  background: #ff4e00;
  border-color: #ff4e00;
}

/* 商品详情描述 */
.detail-desc {
  padding: 20px 0;
}
.detail-desc h3 {
  font-size: 16px;
  color: #333;
  margin: 20px 0 10px;
  padding-left: 10px;
  border-left: 3px solid #ff6600;
}
.detail-desc h3:first-child {
  margin-top: 0;
}
.detail-desc p {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
}
.spec-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.spec-table td {
  padding: 10px 15px;
  border: 1px solid #eee;
  color: #666;
}
.spec-table td:first-child {
  width: 120px;
  background: #fafafa;
  color: #999;
}
</style>
