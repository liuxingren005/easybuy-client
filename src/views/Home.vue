<template>
  <div class="home-page">
    <!-- 顶部工具栏 -->
    <TopBar />

    <!-- 页头 -->
    <div class="header">
      <div class="header-inner">
        <div class="logo-area"><img :src="img('logo.png')" class="logo-img" alt="易买网" /></div>
        <HotSearchBar @search="handleSearch" class="search-area" />
        <div class="cart-area">
          <CartHover />
        </div>
      </div>
    </div>

    <!-- 主导航 -->
    <div class="nav-bar">
      <div class="nav-inner">
        <div class="nav-categories"><span class="all-categories">全部商品分类</span></div>
        <div class="nav-links">
          <router-link to="/" class="nav-link active">首页</router-link>
          <router-link v-for="item in navLevel1Cats" :key="item.id" :to="`/products?category1Id=${item.id}`"
            class="nav-link">{{ text(item.name) }}</router-link>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <div class="category-sidebar" @mouseenter="catSidebarEnter = true" @mouseleave="handleSidebarLeave">
        <div v-for="(cat, index) in catTree" :key="cat.id" class="category-item"
          @mouseenter="handleCatHover(cat, index)">
          <!-- 一级分类：点击进入该分类商品列表 -->
          <router-link :to="`/products?category1Id=${cat.id}`" class="cat-text">{{ text(cat.name) }}</router-link>
          <span class="arrow">▸</span>
        </div>
        <!-- 二三级分类悬停面板 -->
        <transition name="fade">
          <div v-if="showCatPanel && hoveredLevel1" class="cat-hover-panel" :style="{ top: panelTopOffset + 'px' }"
            @mouseenter="catPanelEnter = true" @mouseleave="catPanelEnter = false">
            <div class="cat-panel-body">
              <template v-if="hoveredLevel1.childCategory && hoveredLevel1.childCategory.length > 0">
                <!-- 多个二级分类块（按行排列） -->
                <div v-for="level2 in hoveredLevel1.childCategory" :key="level2.id" class="cat-block">
                  <div class="cat-block-title">
                    <router-link :to="`/products?category1Id=${hoveredLevel1.id}&category2Id=${level2.id}`">
                      {{ text(level2.name) }} ›
                    </router-link>
                  </div>
                  <div class="cat-block-links">
                    <template v-if="level2.childCategory && level2.childCategory.length > 0">
                      <router-link v-for="level3 in level2.childCategory" :key="level3.id"
                        :to="`/products?category1Id=${hoveredLevel1.id}&category2Id=${level2.id}&category3Id=${level3.id}`"
                        class="level3-item">{{ text(level3.name) }}</router-link>
                    </template>
                    <span v-else class="no-level3">暂无三级分类</span>
                  </div>
                </div>
              </template>
              <div v-else class="cat-empty">该分类下暂无子分类</div>
            </div>
          </div>
        </transition>
      </div>

      <div class="banner-area">
        <el-carousel height="340px" class="banner">
          <el-carousel-item v-for="(banner, i) in banners" :key="i">
            <div class="banner-slide" :style="{ background: banner.bg }" @click="goCategory(banner.categoryId)">
              <!-- 轮播图片（nginx 静态文件服务器） -->
              <img v-if="banner.image" :src="banner.image" :alt="banner.title" class="banner-img" />
              <div class="banner-text">
                <h2>{{ banner.title }}</h2>
                <p>{{ banner.subtitle }}</p>
                <el-button round plain>立即预约</el-button>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>

      <!-- 右侧资讯面板 -->
      <div class="news-panel">
        <div class="panel-header">
          <span class="panel-title">新闻资讯</span>
          <router-link to="/news" class="more-link">更多 &gt;</router-link>
        </div>
        <ul class="news-list">
          <li v-for="news in newsList" :key="news.id" class="news-item" @click="openNewsDetail(news)">
            <span class="news-text">{{ text(news.title) }}</span>
            <span class="news-date">{{ news.createTime }}</span>
          </li>
          <li v-if="newsList.length === 0" class="news-empty">暂无资讯</li>
        </ul>
      </div>
    </div>

    <!-- 商品推荐 -->
    <div class="product-section">
      <div class="section-head">
        <h2 class="section-title">热门推荐</h2>
        <span class="section-sub">随机优选好物 · 每次都有新惊喜</span>
        <span class="section-action" @click="refreshHot">
          <el-icon>
            <Refresh />
          </el-icon>换一批
        </span>
      </div>
      <div v-loading="hotLoading" class="product-grid">
        <div v-for="product in hotProducts" :key="product.id" class="product-card" @click="goProductDetail(product.id)">
          <div class="product-image">
            <!-- 商品图片 -->
            <img v-if="showImage(product.fileName)" :src="productImageUrl(product.fileName)" :alt="text(product.name)"
              class="product-img" @error="handleImageError(product.fileName)" />
            <el-icon v-else size="60" color="#ddd">
              <Picture />
            </el-icon>
            <span class="hot-badge">热门</span>
            <!-- 悬停快捷操作 -->
            <div class="card-actions">
              <el-button size="small" round type="primary" @click.stop="addToCart(product)">
                <el-icon>
                  <ShoppingCart />
                </el-icon>加入购物车
              </el-button>
            </div>
          </div>
          <p class="product-name">{{ text(product.name) }}</p>
          <p class="product-desc">{{ text(product.description) || '暂无描述' }}</p>
          <div class="product-bottom">
            <span class="product-price">￥{{ formatPrice(product.price) }}</span>
            <span class="product-stock">{{ product.stock || 0 }}R</span>
          </div>
        </div>
        <div v-if="!hotLoading && hotProducts.length === 0" class="section-empty">
          <el-empty description="暂无推荐商品" :image-size="80" />
        </div>
      </div>
    </div>

    <!-- 楼层数据：一级分类 -->
    <div v-for="(floor, index) in floors" :key="floor.category.id" class="floor-section">
      <div class="floor-head">
        <span class="floor-num">{{ index + 1 }}F</span>
        <span class="floor-name">{{ text(floor.category.name) }}</span>
        <div class="floor-quick">
          <router-link v-for="level2 in level2Of(floor.category)" :key="level2.id"
            :to="`/products?category1Id=${floor.category.id}&category2Id=${level2.id}`" class="floor-quick-link">{{
              text(level2.name) }}</router-link>
          <router-link :to="`/products?category1Id=${floor.category.id}`" class="floor-more">更多 &gt;</router-link>
        </div>
      </div>
      <div class="floor-body">
        <!-- 左侧：楼层广告图（nginx 静态文件服务器）+ 二、三级分类 -->
        <div class="floor-left">
          <div class="floor-banner">
            <img v-if="floor.image" :src="floor.image" :alt="text(floor.category.name)" class="floor-banner-img" />
            <div v-else class="img-placeholder">
              <el-icon :size="26">
                <Picture />
              </el-icon>
              <span class="placeholder-text">{{ text(floor.category.name) }}</span>
              <span class="placeholder-tip">广告位待引用</span>
            </div>
          </div>
          <div class="floor-cat-cloud">
            <!-- 每个二级分类占一行，行内跟随其三级分类 -->
            <div v-for="level2 in level2Of(floor.category)" :key="level2.id" class="cloud-row">
              <router-link class="cloud-level2"
                :to="`/products?category1Id=${floor.category.id}&category2Id=${level2.id}`">
                {{ text(level2.name) }}
              </router-link>
              <router-link v-for="level3 in level3Of(level2)" :key="level3.id" class="cloud-level3"
                :to="`/products?category1Id=${floor.category.id}&category2Id=${level2.id}&category3Id=${level3.id}`">
                {{ text(level3.name) }}
              </router-link>
            </div>
            <span v-if="level2Of(floor.category).length === 0" class="cloud-empty">暂无子分类</span>
          </div>
        </div>

        <!-- 中间：该楼层最近上架的 6 个商品 -->
        <div v-loading="floor.loading" class="floor-products">
          <div v-for="product in floor.products" :key="product.id" class="floor-product-card"
            @click="goProductDetail(product.id)">
            <div class="product-image">
              <!-- 商品图片 -->
              <img v-if="showImage(product.fileName)" :src="productImageUrl(product.fileName)" :alt="text(product.name)"
                class="product-img" @error="handleImageError(product.fileName)" />
              <el-icon v-else size="46" color="#ddd">
                <Picture />
              </el-icon>
            </div>
            <p class="product-name">{{ text(product.name) }}</p>
            <div class="product-bottom">
              <span class="product-price">￥{{ formatPrice(product.price) }}</span>
              <span class="product-stock">{{ product.stock || 0 }}R</span>
            </div>
          </div>
          <div v-if="!floor.loading && floor.products.length === 0" class="floor-empty">该分类下暂无商品</div>
        </div>

        <!-- 右侧：推荐位图片（nginx 静态文件服务器） -->
        <div class="floor-right">
          <div v-for="(side, i) in floor.sideImages" :key="i" class="floor-side">
            <img v-if="side" :src="side" :alt="text(floor.category.name)" class="floor-side-img" />
            <div v-else class="img-placeholder side">
              <el-icon :size="22">
                <Picture />
              </el-icon>
              <span class="placeholder-tip">推荐位待引用</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 资讯详情弹窗 -->
    <el-dialog v-model="newsDetailVisible" :title="currentNews?.title" width="640px">
      <div class="detail-meta">
        <el-tag size="small" type="warning">资讯</el-tag>
        <span class="detail-date">发布时间：{{ currentNews?.createTime }}</span>
      </div>
      <div class="detail-content">{{ currentNews?.content }}</div>
    </el-dialog>

    <!-- 底部 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Picture, ShoppingCart, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useImage } from '@/composables/useImage'
import { useCartStore } from '@/stores/cart'
import { stripHtml } from '@/utils/stripHtml'
import newsApi from '@/api/news'
import categoryApi from '@/api/category'
import productApi from '@/api/product'
import Footer from '@/components/Footer.vue'
import CartHover from '@/components/CartHover.vue'
import HotSearchBar from '@/components/HotSearchBar.vue'
import TopBar from '@/components/TopBar.vue'
import { useHotProducts } from '@/composables/useHotProducts'

const router = useRouter()

// 购物车
const cartStore = useCartStore()

// 图片资源
const { img } = useImage()

// 商品分类（接口数据 + 悬停面板）
const catTree = ref([])               // 一级→二级→三级分类树
const catFromApi = ref(false)         // 分类树是否来自接口
const hoveredLevel1 = ref(null)       // 当前鼠标悬停的一级分类对象
const catSidebarEnter = ref(false)    // 鼠标是否在分类侧栏区域
const catPanelEnter = ref(false)      // 鼠标是否在分类悬停面板区域
const panelTopOffset = ref(10)        // 悬停面板距侧栏顶部的偏移
let hidePanelTimer = null             // 延迟关闭面板的定时器

// 顶部导航中的一级分类
const navLevel1Cats = computed(() => {
  return catTree.value.slice(0, 7)
})

// 是否显示悬停面板
const showCatPanel = computed(() => {
  return !!hoveredLevel1.value && (catSidebarEnter.value || catPanelEnter.value)
})

// 一级分类悬停
const handleCatHover = (cat, index) => {
  // 清除之前的关闭定时器
  if (hidePanelTimer) {
    clearTimeout(hidePanelTimer)
    hidePanelTimer = null
  }
  hoveredLevel1.value = cat
  // 面板垂直位置
  panelTopOffset.value = index * 36 + 10
}

// 鼠标离开侧栏（延迟关闭）
const handleSidebarLeave = () => {
  catSidebarEnter.value = false
  if (hidePanelTimer) clearTimeout(hidePanelTimer)
  hidePanelTimer = setTimeout(() => {
    if (!catPanelEnter.value) {
      hoveredLevel1.value = null
    }
  }, 150)
}

// 面板鼠标离开 → 同时不在侧栏 → 关闭
watch(catPanelEnter, (entered) => {
  if (!entered && !catSidebarEnter.value) {
    if (hidePanelTimer) clearTimeout(hidePanelTimer)
    hidePanelTimer = setTimeout(() => {
      hoveredLevel1.value = null
    }, 100)
  }
})

onUnmounted(() => {
  if (hidePanelTimer) {
    clearTimeout(hidePanelTimer)
    hidePanelTimer = null
  }
})

// 加载分类树（一级→二级→三级）
const loadCategoryTree = async () => {
  try {
    const res = await categoryApi.getTree()
    const list = res.list || []
    catTree.value = list
    // 接口数据：渲染楼层
    catFromApi.value = true
  } catch (e) {
    catFromApi.value = false
    // 接口未就绪时使用静态占位（保证页面不空白）
    catTree.value = [
      { id: 1, name: '进口食品、生鲜', childCategory: [] },
      { id: 2, name: '食品、饮料、酒', childCategory: [] },
      { id: 3, name: '母婴、玩具、童装', childCategory: [] },
      { id: 4, name: '家居、家庭清洁、纸品', childCategory: [] },
      { id: 5, name: '美妆、个人护理、洗护', childCategory: [] },
      { id: 6, name: '女装、内衣、中老年', childCategory: [] },
      { id: 7, name: '鞋靴、箱包、腕表配饰', childCategory: [] },
      { id: 8, name: '男装、运动', childCategory: [] },
      { id: 9, name: '手机、小家电、电脑', childCategory: [] },
      { id: 10, name: '礼品、充值', childCategory: [] }
    ]
  }
}

const newsList = ref([])

// 资讯详情弹窗
const newsDetailVisible = ref(false)
const currentNews = ref(null)

// 文字动态处理
const text = (val) => stripHtml(val).replace(/\s+/g, ' ').trim()

// 价格格式化
const formatPrice = (val) => Number(val || 0).toFixed(2)

// 商品图片地址（后端 nginx 静态文件服务器回传）
const productImageUrl = (fileName) => productApi.imageUrl(fileName)

// 图片加载失败登记
const failedImages = ref(new Set())
const handleImageError = (fileName) => {
  failedImages.value.add(fileName)
}
const showImage = (fileName) => !!fileName && !failedImages.value.has(fileName)

// 二级分类列表
const level2Of = (cat) => cat?.childCategory || []
// 三级分类列表
const level3Of = (cat) => cat?.childCategory || []

// 轮播广告文案预设
const bannerPresets = [
  { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', title: '新鲜看得见！', subtitle: '有机蔬菜 · 打造绿色生活' },
  { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', title: '中秋送好礼！', subtitle: '全场月饼礼盒 8 折优惠' },
  { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', title: '大牌闪购', subtitle: '低至 5 折 · 限时抢购' }
]

// 轮播广告：图片（nginx 静态文件服务器），副标题取一级分类及其二级分类名称
const banners = computed(() => {
  return bannerPresets.map((preset, i) => {
    const cat = catTree.value[i]
    const level2Names = level2Of(cat).slice(0, 3).map(c => text(c.name)).filter(Boolean)
    return {
      image: '',                       // 广告图：（nginx 静态文件服务器）
      bg: preset.bg,
      title: preset.title,
      subtitle: level2Names.length > 0
        ? `${text(cat.name)} · ${level2Names.join(' / ')}`
        : preset.subtitle,
      categoryId: cat?.id
    }
  })
})

// 热门推荐（随机抽取已有商品，多页共享缓存）
const { hotProducts, loading: hotLoading, load: loadHot } = useHotProducts()

// 楼层数据（一级分类 → 楼层）
const floors = ref([])

// 换一批（重新随机）
const refreshHot = () => loadHot(true)

// 加载楼层：一级分类
const loadFloors = async () => {
  // 分类树为静态占位时不渲染楼层
  if (!catFromApi.value) return
  floors.value = catTree.value.map(cat => ({
    category: cat,
    products: [],
    loading: true,
    image: '',                    // 楼层广告图：（nginx 静态文件服务器）
    sideImages: ['', '']          // 右侧推荐位图：（nginx 静态文件服务器）
  }))
  // 并发拉取各楼层商品（时间最近）
  await Promise.all(floors.value.map(async (floor) => {
    try {
      const res = await productApi.getByCategory1(floor.category.id, 6)
      floor.products = res.list || []
    } catch (e) {
      floor.products = []
    } finally {
      floor.loading = false
    }
  }))
}

// 搜索
const handleSearch = (keyword) => {
  router.push(`/products?keyword=${encodeURIComponent(keyword)}`)
}

// 跳转商品详情
const goProductDetail = (id) => {
  router.push(`/product/${id}`)
}

// 跳转分类商品列表
const goCategory = (categoryId) => {
  if (!categoryId) return
  router.push(`/products?category1Id=${categoryId}`)
}

// 加入购物车
const addToCart = async (product) => {
  const isSuccess = await cartStore.addToCart(product, 1)
  if (isSuccess) {
    ElMessage.success(`已将「${text(product.name)}」加入购物车`)
  }
}

const openNewsDetail = (news) => {
  currentNews.value = news
  newsDetailVisible.value = true
}

onMounted(async () => {
  try {
    // 首页资讯：显示最近的前 10 条
    const res = await newsApi.getList(10)
    newsList.value = res.list || []
  } catch (e) {
    // 接口未就绪时静默
  }
  // 加载分类树（一级/二级/三级）
  await loadCategoryTree()
  // 楼层数据（一级分类展开）
  loadFloors()
  // 热门推荐（随机商品）
  loadHot()
})
</script>

<style scoped>
.home-page {
  background: #f5f5f5;
}

.header {
  background: #fff;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 40px;
}

.logo-img {
  height: 60px;
  width: auto;
}

.search-area {
  flex: 1;
  max-width: 600px;
}

.nav-bar {
  background: #fff;
  border-top: 2px solid #ff6600;
}

/* 内层居中容器 */
.nav-inner {
  display: flex;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.nav-categories {
  background: #ff6600;
  color: #fff;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: bold;
}

.nav-links {
  display: flex;
  gap: 30px;
  padding-left: 30px;
}

.nav-link {
  font-size: 16px;
  color: #333;
  text-decoration: none;
  padding: 12px 0;
}

.nav-link.active {
  color: #ff6600;
  border-bottom: 2px solid #ff6600;
}

.main-content {
  display: flex;
  max-width: 1200px;
  margin: 15px auto;
  background: #fff;
  border-radius: 8px;
  overflow: visible;
  position: relative;
}

.category-sidebar {
  width: 200px;
  border-right: 1px solid #f0f0f0;
  padding: 10px 0;
  position: relative;
}

.category-item {
  padding: 9px 20px;
  min-height: 36px;
  box-sizing: border-box;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 3px solid transparent;
  transition: all 0.15s ease;
}

.category-item .cat-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: inherit;
  text-decoration: none;
}

.category-item:hover .cat-text {
  color: #ff6600;
}

.category-item:hover {
  background: #fff5f0;
  color: #ff6600;
  border-left-color: #ff6600;
}

.category-item:hover .arrow {
  color: #ff6600;
}

.category-item .arrow {
  color: #ccc;
  font-size: 12px;
  margin-left: 6px;
  transition: color 0.15s;
}

/* 分类悬停面板 */
.cat-hover-panel {
  position: absolute;
  left: 200px;
  /* 侧栏宽度 */
  width: 360px;
  /* 宽度匹配 */
  min-height: 320px;
  background: #fff;
  border: 1px solid #ff6600;
  border-left: none;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 100;
  padding: 20px 24px;
  box-sizing: border-box;
}

.cat-panel-body {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  /* 二级分类块 */
  gap: 16px 24px;
  align-content: start;
}

.cat-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cat-block-title a {
  font-size: 14px;
  font-weight: 600;
  color: #ff6600;
  text-decoration: none;
  padding-bottom: 4px;
  border-bottom: 1px dashed #ffd4b8;
  display: inline-block;
}

.cat-block-title a:hover {
  color: #cc5200;
}

.cat-block-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 0;
  line-height: 1.6;
}

.level3-item {
  font-size: 12px;
  color: #666;
  text-decoration: none;
  padding: 0 6px;
  border-right: 1px solid #e0e0e0;
  transition: color 0.15s;
}

.level3-item:last-child {
  border-right: none;
}

.level3-item:hover {
  color: #ff6600;
  text-decoration: underline;
}

.no-level3 {
  font-size: 12px;
  color: #bbb;
}

.cat-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 0;
  color: #bbb;
  font-size: 13px;
}

/* 面板淡入淡出过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.banner-area {
  flex: 1;
  padding: 10px;
}

.banner {
  border-radius: 8px;
  overflow: hidden;
}

.banner-slide {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
}

/* 轮播图片（nginx 静态文件服务器） */
.banner-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-text {
  text-align: center;
  color: #fff;
  position: relative;
  z-index: 1;
}

.banner-text h2 {
  font-size: 36px;
  margin-bottom: 10px;
}

/* 副标题为动态分类名称，单行省略 */
.banner-text p {
  font-size: 18px;
  margin: 0 auto 20px;
  opacity: 0.9;
  max-width: 80%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.news-panel {
  width: 280px;
  padding: 10px 15px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 2px solid #ff6600;
  padding-bottom: 8px;
  margin-bottom: 10px;
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.more-link {
  font-size: 13px;
  color: #999;
}

.news-list {
  list-style: none;
}

.news-item {
  padding: 6px 0;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.news-item:hover .news-text {
  color: #ff6600;
}

.news-text {
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.news-date {
  color: #ccc;
  font-size: 11px;
  white-space: nowrap;
}

.news-empty {
  text-align: center;
  color: #ccc;
  padding: 20px;
}

.product-section {
  max-width: 1200px;
  margin: 15px auto;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

/* 板块标题栏 */
.section-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.section-title {
  font-size: 20px;
  color: #333;
  border-left: 4px solid #ff6600;
  padding-left: 10px;
  line-height: 1.2;
}

.section-sub {
  font-size: 12px;
  color: #999;
}

.section-action {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #ff6600;
  cursor: pointer;
  padding: 4px 12px;
  border: 1px solid #ffd4b8;
  border-radius: 14px;
  transition: all 0.2s;
}

.section-action:hover {
  background: #ff6600;
  color: #fff;
  border-color: #ff6600;
}

.section-empty {
  grid-column: 1 / -1;
  padding: 20px 0;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  min-height: 150px;
}

.product-card {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: box-shadow 0.3s, transform 0.3s, border-color 0.3s;
}

.product-card:hover {
  box-shadow: 0 6px 18px rgba(255, 102, 0, 0.15);
  transform: translateY(-3px);
  border-color: #ffd4b8;
}

/* 图片容器：溢出隐藏，配合悬停放大动画 */
.product-image {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #fafafa;
  border-radius: 4px;
  margin-bottom: 10px;
  overflow: hidden;
}

.product-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.4s ease;
}

/* 图片悬停放大动画 */
.product-card:hover .product-img,
.floor-product-card:hover .product-img {
  transform: scale(1.15);
}

.hot-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  background: #ff6600;
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 50%;
  z-index: 2;
}

/* 悬停浮出的快捷操作 */
.card-actions {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 8px 0;
  z-index: 2;
  background: rgba(255, 255, 255, 0.92);
  opacity: 0;
  transform: translateY(100%);
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.product-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0);
}

.product-name {
  font-size: 13px;
  color: #333;
  margin-bottom: 5px;
  height: 36px;
  line-height: 18px;
  overflow: hidden;
  display: box;
  box-orient: vertical;
  line-clamp: 2;
  transition: color 0.2s;
}

.product-card:hover .product-name,
.floor-product-card:hover .product-name {
  color: #ff6600;
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
}

.product-price {
  font-size: 17px;
  font-weight: bold;
  color: #ff4e00;
}

.product-stock {
  font-size: 12px;
  color: #999;
}

/* 楼层：一级分类展开（二三级分类 + 6 个商品） */
.floor-section {
  max-width: 1200px;
  margin: 15px auto;
  background: #fff;
  border-radius: 8px;
  padding: 15px 20px 20px;
}

.floor-head {
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 2px solid #ff6600;
  padding-bottom: 8px;
}

.floor-num {
  font-size: 18px;
  font-weight: bold;
  font-style: italic;
  color: #fff;
  background: #ff6600;
  padding: 2px 10px;
  border-radius: 4px;
}

.floor-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.floor-quick {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.floor-quick-link {
  font-size: 13px;
  color: #666;
  text-decoration: none;
  transition: color 0.2s;
}

.floor-quick-link:hover {
  color: #ff6600;
}

.floor-more {
  font-size: 13px;
  color: #999;
  text-decoration: none;
}

.floor-more:hover {
  color: #ff6600;
}

.floor-body {
  display: flex;
  gap: 12px;
  padding-top: 12px;
}

/* 左侧：楼层广告图 + 二三级分类 */
.floor-left {
  width: 210px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.floor-banner {
  height: 200px;
  border-radius: 6px;
  overflow: hidden;
}

.floor-banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.floor-banner:hover .floor-banner-img {
  transform: scale(1.08);
}

.floor-cat-cloud {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  line-height: 1.6;
  padding: 8px 4px;
  background: #fafafa;
  border-radius: 6px;
  overflow: hidden;
}

/* 每个二级分类独占一行，行内跟随其三级分类 */
.cloud-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 0;
}

.cloud-level2 {
  font-size: 12px;
  font-weight: 600;
  color: #ff6600;
  text-decoration: none;
  padding: 0 6px;
  border-right: 1px solid #e8e8e8;
}

.cloud-level2:hover {
  text-decoration: underline;
}

.cloud-level3 {
  font-size: 12px;
  color: #666;
  text-decoration: none;
  padding: 0 6px;
  border-right: 1px solid #e8e8e8;
  transition: color 0.15s;
}

.cloud-level3:hover {
  color: #ff6600;
}

.cloud-empty {
  font-size: 12px;
  color: #bbb;
  padding: 0 6px;
}

/* 中间：该楼层最近上架的 6 个商品 */
.floor-products {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  align-content: start;
  min-height: 200px;
}

.floor-product-card {
  border: 1px solid #f5f5f5;
  border-radius: 6px;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  transition: box-shadow 0.3s, transform 0.3s, border-color 0.3s;
}

.floor-product-card:hover {
  box-shadow: 0 4px 14px rgba(255, 102, 0, 0.15);
  transform: translateY(-2px);
  border-color: #ffd4b8;
}

.floor-product-card .product-image {
  height: 110px;
  margin-bottom: 8px;
}

.floor-product-card .product-name {
  height: 18px;
  line-height: 18px;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.floor-empty {
  grid-column: 1 / -1;
  text-align: center;
  color: #bbb;
  font-size: 13px;
  padding: 60px 0;
}

/* 右侧：推荐位图片 */
.floor-right {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.floor-side {
  height: 145px;
  border-radius: 6px;
  overflow: hidden;
}

.floor-side-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.floor-side:hover .floor-side-img {
  transform: scale(1.08);
}

/* 图片占位（nginx 静态文件服务器） */
.img-placeholder {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(135deg, #fff5f0 0%, #f7f7f7 100%);
  border: 1px dashed #ffd4b8;
  border-radius: 6px;
  color: #ffb27a;
}

.placeholder-text {
  font-size: 13px;
  font-weight: 600;
  color: #ff8533;
  text-align: center;
  padding: 0 8px;
}

.placeholder-tip {
  font-size: 11px;
  color: #bbb;
}

/* 资讯详情弹窗 */
.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-date {
  font-size: 13px;
  color: #999;
}

.detail-content {
  font-size: 14px;
  color: #333;
  line-height: 1.8;
  white-space: pre-wrap;
}
</style>
