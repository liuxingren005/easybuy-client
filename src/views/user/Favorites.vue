<template>
  <div class="favorites-page">
    <h2 class="page-title">我的收藏</h2>

    <!-- 操作栏 -->
    <div class="action-bar" v-if="favoriteList.length > 0">
      <span class="tip">共 {{ favoriteList.length }} 件收藏商品（最多 6 件，先进先出）</span>
      <el-button size="small" type="danger" plain @click="handleClear">清空收藏</el-button>
    </div>

    <!-- 暂无数据 -->
    <el-empty v-if="!loading && favoriteList.length === 0" description="暂无收藏商品" />

    <!-- 收藏列表 -->
    <div v-else class="favorite-grid" v-loading="loading">
      <div v-for="item in favoriteList" :key="item.id" class="favorite-card">
        <div class="favorite-image" @click="goDetail(item.id)">
          <img v-if="showImage(item.fileName)" :src="productImageUrl(item.fileName)" :alt="stripHtml(item.name)"
            class="favorite-img" @error="handleImageError(item.fileName)" />
          <el-icon v-else size="60" color="#ddd">
            <Picture />
          </el-icon>
          <div v-if="item.invalid" class="invalid-mask">已失效</div>
        </div>
        <p class="favorite-name" @click="goDetail(item.id)">{{ stripHtml(item.name) }}</p>
        <p class="favorite-price">¥{{ Number(item.price).toFixed(2) }}</p>
        <div class="favorite-actions">
          <el-button size="small" type="primary" @click="addToCart(item)">
            <el-icon>
              <ShoppingCart />
            </el-icon>加入购物车
          </el-button>
          <el-button size="small" type="danger" plain @click="handleRemove(item)">
            <el-icon>
              <Delete />
            </el-icon>移除
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Picture, ShoppingCart, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import favoriteApi from '@/api/favorite'
import productApi from '@/api/product'
import { useCartStore } from '@/stores/cart'
import { stripHtml } from '@/utils/stripHtml'
import { useImageFallback } from '@/composables/useImage'

const router = useRouter()
const cartStore = useCartStore()

// 图片（无图/加载失败统一占位）
const { showImage, handleImageError } = useImageFallback()

const loading = ref(false)
const favoriteList = ref([])

// 商品图片地址
const productImageUrl = (fileName) => productApi.imageUrl(fileName)

// 加载收藏列表
const loadFavorites = async () => {
  loading.value = true
  try {
    const res = await favoriteApi.getList()
    favoriteList.value = res.list || []
  } catch (e) { } finally {
    loading.value = false
  }
}

// 移除单项收藏
const handleRemove = (item) => {
  ElMessageBox.confirm(`确定要移除收藏的「${stripHtml(item.name)}」吗？`, '移除确认', {
    type: 'warning'
  }).then(async () => {
    try {
      const res = await favoriteApi.remove(item.id)
      favoriteList.value = res.list || []
      ElMessage.success('已移除收藏')
    } catch (e) { }
  }).catch(() => { })
}

// 清空收藏
const handleClear = () => {
  ElMessageBox.confirm('确定要清空全部收藏吗？清空后不可恢复。', '清空确认', {
    type: 'warning',
    confirmButtonText: '确认清空',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      const res = await favoriteApi.clear()
      favoriteList.value = res.list || []
      ElMessage.success('已清空收藏')
    } catch (e) { }
  }).catch(() => { })
}

// 跳转商品详情
const goDetail = (id) => {
  router.push(`/product/${id}`)
}

// 加入购物车
const addToCart = async (item) => {
  // 失效商品不可加入购物车
  if (item.invalid) {
    ElMessage.warning('该商品已失效，无法加入购物车')
    return
  }
  const product = {
    id: item.id,
    name: item.name,
    fileName: item.fileName,
    price: item.price
  }
  const isSuccess = await cartStore.addToCart(product, 1)
  if (isSuccess) {
    ElMessage.success(`已将「${stripHtml(item.name)}」加入购物车`)
  }
}

onMounted(() => {
  loadFavorites()
})
</script>

<style scoped>
.favorites-page {
  padding: 10px;
}

.page-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
  border-left: 4px solid #ff6600;
  padding-left: 10px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 6px;
}

.tip {
  font-size: 13px;
  color: #999;
}

.favorite-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.favorite-card {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 12px;
  background: #fff;
  transition: all 0.2s;
}

.favorite-card:hover {
  border-color: #ff6600;
  box-shadow: 0 2px 8px rgba(255, 102, 0, 0.12);
}

.favorite-image {
  position: relative;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 4px;
  margin-bottom: 10px;
  cursor: pointer;
}

.favorite-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.invalid-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border-radius: 4px;
}

.favorite-name {
  font-size: 13px;
  color: #333;
  margin-bottom: 6px;
  height: 36px;
  line-height: 18px;
  overflow: hidden;
  display: box;
  line-clamp: 2;
  box-orient: vertical;
  cursor: pointer;
}

.favorite-price {
  font-size: 18px;
  font-weight: bold;
  color: #ff4e00;
  margin-bottom: 10px;
}

.favorite-actions {
  display: flex;
  gap: 8px;
}

.favorite-actions .el-button {
  flex: 1;
}
</style>
