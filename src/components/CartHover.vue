<template>
  <div class="cart-hover">
    <div class="cart-btn" @click="goCart" @mouseenter="onEnter" @mouseleave="onLeave">
      <el-icon>
        <ShoppingCart />
      </el-icon>
      <span class="cart-label">购物车</span>
      <span v-if="cartStore.totalCount > 0" class="cart-badge">{{ cartStore.totalCount }}</span>
    </div>

    <!-- 悬停面板 -->
    <div v-if="show" class="cart-dropdown" @mouseenter="onEnter" @mouseleave="onLeave">
      <template v-if="cartStore.cartList.length > 0">
        <div class="dropdown-header">
          <span>共 {{ cartStore.totalCount }} 件商品</span>
          <el-button link type="primary" size="small" @click="goCart">去购物车</el-button>
        </div>
        <div class="dropdown-list">
          <div v-for="item in cartStore.cartList" :key="item.id" class="dropdown-item"
            :class="{ 'item-invalid': item.invalid }" @click="!item.invalid && goDetail(item.id)">
            <div class="item-img">
              <img v-if="showImage(item.fileName)" :src="productImageUrl(item.fileName)" :alt="item.name"
                @error="handleImageError(item.fileName)" />
              <el-icon v-else size="32" color="#ddd">
                <Picture />
              </el-icon>
            </div>
            <div class="item-info">
              <div class="item-name-row">
                <span class="item-name" :title="item.name">{{ item.name }}</span>
                <el-tag v-if="item.invalid" type="danger" size="small" effect="plain">商品不存在或已下架</el-tag>
              </div>
              <div class="item-bottom">
                <span class="item-price">
                  <template v-if="item.invalid">--</template>
                  <template v-else>¥{{ Number(item.price).toFixed(2) }}</template>
                </span>
                <span class="item-qty">x{{ item.quantity }}</span>
              </div>
            </div>
            <el-icon class="item-delete" @click.stop="removeItem(item.id)">
              <Close />
            </el-icon>
          </div>
        </div>
        <div class="dropdown-footer">
          <span class="total-text">合计：<b class="total-price">¥{{ cartStore.totalAmount.toFixed(2) }}</b></span>
          <el-button type="primary" size="default" @click="goCheckout">去购物车结算</el-button>
        </div>
      </template>
      <template v-else>
        <div class="dropdown-empty">
          <el-icon size="40" color="#ccc">
            <ShoppingCart />
          </el-icon>
          <p>购物车是空的</p>
          <el-button link type="primary" @click="goHome">去逛逛</el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ShoppingCart, Picture, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCartStore } from '@/stores/cart'
import productApi from '@/api/product'
import { useImageFallback } from '@/composables/useImage'

const router = useRouter()
const cartStore = useCartStore()
const { showImage, handleImageError } = useImageFallback()
const show = ref(false)
let hideTimer = null

// 组件挂载时拉取购物车
onMounted(() => {
  cartStore.load()
})

// 进入：立即显示 + 取消隐藏定时器
const onEnter = () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  show.value = true
}

// 离开：延迟隐藏
const onLeave = () => {
  hideTimer = setTimeout(() => {
    show.value = false
    hideTimer = null
  }, 150)
}

const productImageUrl = (fileName) => productApi.imageUrl(fileName)

const goCart = () => {
  show.value = false
  router.push('/cart')
}

const goCheckout = () => {
  show.value = false
  router.push('/checkout')
}

const goHome = () => {
  show.value = false
  router.push('/')
}

// 点击购物车单项跳转商品详情页
const goDetail = (id) => {
  show.value = false
  router.push(`/product/${id}`)
}

const removeItem = (id) => {
  ElMessageBox.confirm('确定要移除这件商品吗？', '删除确认', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    await cartStore.removeFromCart(id)
    ElMessage.success('已移除')
  }).catch(() => { })
}
</script>

<style scoped>
.cart-hover {
  position: relative;
  display: inline-block;
}

.cart-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: all 0.2s;
  white-space: nowrap;
}

.cart-btn:hover {
  border-color: #ff6600;
  color: #ff6600;
}

.cart-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  background: #ff6600;
  color: #fff;
  font-size: 12px;
  border-radius: 10px;
  line-height: 1;
}

/* 下拉面板 */
.cart-dropdown {
  position: absolute;
  top: calc(100% + 2px);
  right: 0;
  width: 340px;
  max-height: 420px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  overflow: hidden;
}

.cart-dropdown::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 24px;
  width: 12px;
  height: 12px;
  background: #fff;
  transform: rotate(45deg);
  box-shadow: -2px -2px 6px rgba(0, 0, 0, 0.06);
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  color: #666;
}

.dropdown-list {
  max-height: 280px;
  overflow-y: auto;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  transition: background 0.15s;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #fafafa;
}

.item-img {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.item-img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.item-name {
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

/* 失效商品 */
.dropdown-item.item-invalid {
  cursor: default;
}

.dropdown-item.item-invalid .item-img,
.dropdown-item.item-invalid .item-info {
  opacity: 0.55;
}

.item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.item-price {
  color: #ff4e00;
  font-weight: 500;
}

.item-qty {
  color: #999;
  font-size: 12px;
}

.item-delete {
  color: #ccc;
  cursor: pointer;
  font-size: 16px;
  flex-shrink: 0;
  transition: color 0.2s;
}

.item-delete:hover {
  color: #ff4e00;
}

.dropdown-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.total-text {
  font-size: 13px;
  color: #666;
}

.total-price {
  font-size: 18px;
  color: #ff4e00;
  margin-left: 4px;
}

.dropdown-empty {
  padding: 40px 20px;
  text-align: center;
  color: #999;
}

.dropdown-empty p {
  margin: 8px 0 4px;
  font-size: 14px;
}
</style>
