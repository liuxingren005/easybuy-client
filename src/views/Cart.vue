<template>
  <div class="cart-page">
    <!-- 顶部工具栏 -->
    <div class="top-bar">
      <div class="top-inner">
        <img :src="img('logo.png')" class="logo-img" alt="易买网" @click="goHome" />
        <span class="page-title">购物车</span>
      </div>
    </div>

    <!-- 主导航 -->
    <MainNav />

    <!-- 购物车主体 -->
    <div class="cart-body">
      <!-- 空购物车 -->
      <div v-if="cartStore.cartList.length === 0" class="empty-cart">
        <el-empty description="购物车还是空的，快去挑选心仪的商品吧！">
          <el-button type="primary" @click="goHome">去购物</el-button>
        </el-empty>
      </div>

      <!-- 购物车列表 -->
      <div v-else class="cart-content">
        <table class="cart-table">
          <thead>
            <tr>
              <th class="th-name" width="490">商品名称</th>
              <th class="th-attr" width="140">属性</th>
              <th class="th-qty" width="150">购买数量</th>
              <th class="th-subtotal" width="130">小计</th>
              <th class="th-points" width="140">返还积分</th>
              <th class="th-action" width="150">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in cartStore.cartList" :key="item.id" :class="{ 'row-alt': index % 2 === 1 }">
              <td>
                <div class="cell-product" @click="goDetail(item.id)">
                  <div class="product-thumb">
                    <img v-if="item.fileName" :src="productImageUrl(item.fileName)" :alt="stripHtml(item.name)" />
                    <el-icon v-else size="50" color="#ddd"><Picture /></el-icon>
                  </div>
                  <span class="product-name">{{ item.name }}</span>
                </div>
              </td>
              <td align="center" class="cell-attr">颜色：默认</td>
              <td align="center">
                <div class="qty-control">
                  <el-button size="small" circle @click="decreaseQty(item)">
                    <el-icon><Minus /></el-icon>
                  </el-button>
                  <el-input-number v-model="item.quantity" :min="1" :max="item.stock || 99" size="small"
                    :controls="false" style="width: 60px" @change="onQtyChange(item)" />
                  <el-button size="small" circle @click="increaseQty(item)">
                    <el-icon><Plus /></el-icon>
                  </el-button>
                </div>
              </td>
              <td align="center" class="cell-subtotal">
                ￥{{ (Number(item.price) * item.quantity).toFixed(2) }}
              </td>
              <td align="center" class="cell-points">
                {{ Math.floor(Number(item.price)) * item.quantity }}R
              </td>
              <td align="center" class="cell-action">
                <el-button link type="danger" @click="handleRemove(item)">删除</el-button>
                <el-button link type="primary" @click="handleFavorite(item)">加入收藏</el-button>
              </td>
            </tr>
            <!-- 合计 -->
            <tr class="row-total">
              <td colspan="6">
                <div class="total-bar">
                  <el-button size="default" plain class="clear-cart" @click="handleClearCart">
                    <el-icon><Delete /></el-icon>清空购物车
                  </el-button>
                  <span class="total-text">
                    商品总价：<b class="total-price">￥{{ cartStore.totalAmount.toFixed(2) }}</b>
                  </span>
                </div>
              </td>
            </tr>
            <!-- 操作 -->
            <tr class="row-actions">
              <td colspan="6" align="right">
                <el-button size="large" @click="goHome">
                  <el-icon><ArrowLeft /></el-icon>继续购物
                </el-button>
                <el-button size="large" type="primary" class="checkout-btn" @click="goCheckout">
                  去结算
                </el-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 底部 -->
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Picture, Plus, Minus, ArrowLeft, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useImage } from '@/composables/useImage'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import productApi from '@/api/product'
import { stripHtml } from '@/utils/stripHtml'
import Footer from '@/components/Footer.vue'
import MainNav from '@/components/MainNav.vue'

const router = useRouter()
const { img } = useImage()
const cartStore = useCartStore()
const userStore = useUserStore()

// 商品图片地址
const productImageUrl = (fileName) => productApi.imageUrl(fileName)

// 页面加载时拉取购物车
onMounted(() => {
  cartStore.load()
})

// 清空购物车
const handleClearCart = () => {
  if (cartStore.cartList.length === 0) {
    ElMessage.info('购物车已经是空的了')
    return
  }
  ElMessageBox.confirm('确定要清空购物车吗？此操作不可恢复', '清空购物车', {
    type: 'warning',
    confirmButtonText: '确定清空',
    cancelButtonText: '取消',
    confirmButtonClass: 'el-button--danger'
  }).then(async () => {
    await cartStore.clearCart()
    ElMessage.success('购物车已清空')
  }).catch(() => {})
}

// 增加
const increaseQty = async (item) => {
  if (item.stock && item.quantity >= item.stock) {
    ElMessage.warning('已达到库存上限')
    return
  }
  const oldQty = item.quantity
  // 先更新本地再同步，失败回滚
  item.quantity = oldQty + 1
  const isSuccess = await cartStore.updateQuantity(item.id, oldQty + 1)
  if (!isSuccess) item.quantity = oldQty
}

// 减少
const decreaseQty = async (item) => {
  if (item.quantity <= 1) return
  const oldQty = item.quantity
  item.quantity = oldQty - 1
  const isSuccess = await cartStore.updateQuantity(item.id, oldQty - 1)
  if (!isSuccess) item.quantity = oldQty
}

// 数量变化
const onQtyChange = async (item) => {
  const newQty = Number(item.quantity)
  if (!Number.isInteger(newQty) || newQty < 1) {
    item.quantity = 1
  }
  const oldQty = item.quantity
  const isSuccess = await cartStore.updateQuantity(item.id, item.quantity)
  if (!isSuccess) item.quantity = oldQty
}

// 删除商品
const handleRemove = (item) => {
  ElMessageBox.confirm(`确定要把「${item.name}」移除购物车吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    await cartStore.removeFromCart(item.id)
    ElMessage.success('已移除购物车')
  }).catch(() => {})
}

// 加入收藏（模拟）
const handleFavorite = (item) => {
  ElMessage.success(`已收藏「${item.name}」`)
}

// 结算
const goCheckout = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  router.push('/checkout')
}

// 跳转商品详情
const goDetail = (id) => {
  router.push(`/product/${id}`)
}

// 返回首页
const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.cart-page {
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
  gap: 20px;
  padding: 15px 20px;
}
.logo-img {
  height: 50px;
  width: auto;
  cursor: pointer;
}
.page-title {
  font-size: 20px;
  color: #ff6600;
  border-left: 1px solid #ddd;
  padding-left: 20px;
  font-weight: bold;
}

/* 购物车主体 */
.cart-body {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 20px;
}

/* 空购物车 */
.empty-cart {
  background: #fff;
  border: 1px solid #e8e8e8;
  padding: 80px 0;
  text-align: center;
}

/* 购物车表格 */
.cart-content {
  background: #fff;
  border: 1px solid #e8e8e8;
}
.cart-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.cart-table thead tr {
  background: #f5f5f5;
}
.cart-table th {
  padding: 12px 10px;
  text-align: center;
  color: #666;
  font-weight: normal;
  border-bottom: 1px solid #e8e8e8;
}
.th-name {
  text-align: left !important;
  padding-left: 20px !important;
}
.cart-table td {
  padding: 16px 10px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}
.row-alt {
  background: #fafafa;
}

/* 商品单元格 */
.cell-product {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 10px;
  cursor: pointer; /* 单项可点击跳转详情页 */
}
.product-thumb {
  width: 73px;
  height: 73px;
  border: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #fff;
}
.product-thumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.product-name {
  font-size: 13px;
  color: #333;
  cursor: pointer;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.product-name:hover {
  color: #ff6600;
}

/* 数量控制 */
.qty-control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.qty-control :deep(.el-input__inner) {
  text-align: center;
}

.cell-subtotal {
  color: #ff4e00;
  font-weight: bold;
}
.cell-points {
  color: #666;
}
.cell-action {
  white-space: nowrap;
}

/* 合计 */
.row-total td {
  padding: 20px;
  border-bottom: none;
}
.total-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.clear-cart {
  display: flex;
  align-items: center;
  gap: 4px;
}
.clear-cart .el-icon {
  margin-right: 0;
}
.total-text {
  font-size: 14px;
  color: #333;
}
.total-price {
  font-size: 22px;
  color: #ff4e00;
  margin-left: 4px;
}

/* 操作 */
.row-actions td {
  padding: 20px;
  text-align: right;
  border-bottom: none;
}
.checkout-btn {
  background: #ff6600;
  border-color: #ff6600;
  width: 160px;
  height: 48px;
  font-size: 16px;
  margin-left: 12px;
}
.checkout-btn:hover {
  background: #ff4e00;
  border-color: #ff4e00;
}
</style>
