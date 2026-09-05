<template>
  <div class="checkout-page">
    <!-- 顶部工具栏 -->
    <div class="top-bar">
      <div class="top-inner">
        <img :src="img('logo.png')" class="logo-img" alt="易买网" @click="goHome" />
        <span class="page-title">确认订单</span>
      </div>
    </div>

    <!-- 主导航 -->
    <MainNav />

    <!-- 确认订单主体 -->
    <div class="checkout-body" v-loading="loading">
      <!-- 空购物车 -->
      <div v-if="checkoutList.length === 0" class="empty-cart">
        <el-empty description="当前无可结算商品，请先添加商品">
          <el-button type="primary" @click="goHome">去购物</el-button>
        </el-empty>
      </div>

      <template v-else>
        <!-- 商品列表 -->
        <div class="section">
          <div class="section-title">
            <span>商品列表</span>
          </div>
          <table class="checkout-table">
            <thead>
              <tr>
                <th class="th-name" width="550">商品名称</th>
                <th class="th-attr" width="140">属性</th>
                <th class="th-qty" width="150">购买数量</th>
                <th class="th-subtotal" width="130">小计</th>
                <th class="th-points" width="140">返还积分</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in checkoutList" :key="item.id" :class="{ 'row-alt': index % 2 === 1 }">
                <td>
                  <div class="cell-product">
                    <div class="product-thumb">
                      <img v-if="showImage(item.fileName)" :src="productImageUrl(item.fileName)"
                        :alt="stripHtml(item.name)" @error="handleImageError(item.fileName)" />
                      <el-icon v-else size="50" color="#ddd">
                        <Picture />
                      </el-icon>
                    </div>
                    <span class="product-name">{{ item.name }}</span>
                  </div>
                </td>
                <td align="center">颜色：默认</td>
                <td align="center">{{ item.quantity }}</td>
                <td align="center" class="cell-subtotal">
                  ￥{{ (Number(item.price) * item.quantity).toFixed(2) }}
                </td>
                <td align="center">
                  {{ Math.floor(Number(item.price)) * item.quantity }}R
                </td>
              </tr>
              <tr class="row-summary">
                <td colspan="5" align="right">
                  商品总价：￥{{ checkoutAmount.toFixed(2) }} ； 返还积分 {{ checkoutPoints }}R
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 收货人信息 -->
        <div class="section">
          <div class="section-title">
            <span>收货人信息</span>
          </div>
          <div class="address-list" v-if="addressList.length > 0">
            <div v-for="addr in addressList" :key="addr.id"
              :class="['address-item', { active: selectedAddressId === addr.id }]" @click="selectedAddressId = addr.id">
              <el-icon v-if="selectedAddressId === addr.id" class="check-icon">
                <CircleCheck />
              </el-icon>
              <div class="address-text">{{ addr.address }}</div>
              <el-tag v-if="addr.isDefault === 1" size="small" type="warning" effect="plain">默认</el-tag>
              <el-button link size="small" @click.stop="editAddress(addr)">修改</el-button>
            </div>
            <div class="address-item add-address" @click="addAddress">
              <el-icon size="24">
                <Plus />
              </el-icon>
              <span>新增收货地址</span>
            </div>
          </div>
          <div v-else class="no-address">
            <el-empty description="暂无收货地址" :image-size="60">
              <el-button type="primary" @click="addAddress">新增收货地址</el-button>
            </el-empty>
          </div>
        </div>

        <!-- 配送方式 -->
        <div class="section">
          <div class="section-title">
            <span>配送方式</span>
          </div>
          <table class="checkout-table">
            <thead>
              <tr>
                <th width="80"></th>
                <th width="200">名称</th>
                <th>订购描述</th>
                <th width="150">费用</th>
                <th width="135">免费额度</th>
                <th width="175">保价费用</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(method, index) in deliveryMethods" :key="index" :class="{ 'row-alt': index % 2 === 1 }">
                <td align="center">
                  <input type="radio" name="delivery" :checked="selectedDelivery === index"
                    @change="selectedDelivery = index" />
                </td>
                <td align="center"><b>{{ method.name }}</b></td>
                <td>{{ method.desc }}</td>
                <td align="center">￥{{ method.fee.toFixed(2) }}</td>
                <td align="center">￥{{ method.freeLimit.toFixed(2) }}</td>
                <td align="center">{{ method.insurance }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 提交订单 -->
        <div class="submit-section">
          <div class="submit-bar">
            <span class="submit-total">
              应付总额：<b class="total-price">￥{{ finalAmount.toFixed(2) }}</b>
            </span>
            <el-button type="primary" size="large" class="submit-btn" :loading="submitting" @click="handleSubmit">
              提交订单
            </el-button>
          </div>
        </div>
      </template>
    </div>

    <!-- 底部 -->
    <Footer />

    <!-- 新增/编辑地址弹窗 -->
    <el-dialog v-model="addressDialogVisible" :title="editingAddress ? '修改地址' : '新增地址'" width="520px">
      <el-form :model="addressForm" label-width="80px">
        <el-form-item label="所在地区">
          <el-cascader v-model="addressForm.region" :options="cascaderOptions"
            :props="{ expandTrigger: 'hover', value: 'value', label: 'label', children: 'children' }"
            placeholder="请选择省/市/区" style="width: 100%" />
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="addressForm.address" placeholder="请输入详细地址（街道、门牌号...）" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="addressForm.remark" placeholder="备注（可选）" />
        </el-form-item>
        <el-form-item label="默认地址">
          <el-switch v-model="addressForm.isDefault" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addressDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAddress">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Picture, Plus, CircleCheck } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useImageResolver, useImageFallback } from '@/composables/useImage'
import { useAddress } from '@/composables/useAddress'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import productApi from '@/api/product'
import orderApi from '@/api/order'
import userAddressApi from '@/api/userAddress'
import { stripHtml } from '@/utils/stripHtml'
import Footer from '@/components/Footer.vue'
import MainNav from '@/components/MainNav.vue'

const router = useRouter()
const route = useRoute()
const { img } = useImageResolver()
const { showImage, handleImageError } = useImageFallback()
const { cascaderOptions } = useAddress()
const cartStore = useCartStore()
const userStore = useUserStore()

// 商品图片地址
const productImageUrl = (fileName) => productApi.imageUrl(fileName)

const loading = ref(false)
const submitting = ref(false)

// 收货地址
const addressList = ref([])
const selectedAddressId = ref(null)

// 配送方式
const deliveryMethods = ref([
  { name: '申通快递', desc: '江、浙、沪地区首重为15元/KG，其他地区18元/KG，续重均为5-6元/KG', fee: 15, freeLimit: 0, insurance: '不支持保价' },
  { name: '城际快递', desc: '运费固定', fee: 15, freeLimit: 0, insurance: '不支持保价' },
  { name: '邮局平邮', desc: '邮政普通包裹，时间较慢但覆盖范围广', fee: 10, freeLimit: 0, insurance: '不支持保价' }
])
const selectedDelivery = ref(0)

// 地址弹窗
const addressDialogVisible = ref(false)
const editingAddress = ref(null)
const addressForm = reactive({
  region: [], // [省, 市, 区] 编码
  address: '', // 详细地址
  remark: '',
  isDefault: 0
})

// 根据地区编码数组获取名称路径
const getRegionLabels = (codes) => {
  if (!codes || codes.length === 0) return ''
  let labels = []
  let level = cascaderOptions.value
  for (const code of codes) {
    const found = level.find(n => n.value === code)
    if (!found) break
    labels.push(found.label)
    level = found.children || []
  }
  return labels.join(' ')
}

// 购物车页携带的已选商品ID（未携带时按全部有效商品结算）
const selectedIdSet = computed(() => {
  const raw = route.query.ids
  if (!raw) return null
  const ids = String(raw).split(',').map(id => Number(id)).filter(id => !Number.isNaN(id))
  return new Set(ids)
})

// 购物车中参与结算的商品（失效商品不参与结算）
const checkoutList = computed(() => {
  const list = cartStore.cartList.filter(i => !i.invalid)
  const set = selectedIdSet.value
  return set ? list.filter(i => set.has(i.id)) : list
})

// 结算商品总价
const checkoutAmount = computed(() =>
  checkoutList.value.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
)

// 结算商品返还总积分
const checkoutPoints = computed(() =>
  checkoutList.value.reduce((sum, item) => sum + Math.floor(Number(item.price)) * item.quantity, 0)
)

// 应付总额（商品总价 + 运费）
const finalAmount = computed(() => {
  const deliveryFee = deliveryMethods.value[selectedDelivery.value]?.fee || 0
  return checkoutAmount.value + deliveryFee
})

// 加载收货地址
const loadAddresses = async () => {
  if (!userStore.userInfo) return
  try {
    const res = await userAddressApi.findByUserId(userStore.userInfo.id)
    addressList.value = res.list || []
    // 自动选中默认地址
    const defaultAddr = addressList.value.find(a => a.isDefault === 1)
    if (defaultAddr) {
      selectedAddressId.value = defaultAddr.id
    } else if (addressList.value.length > 0) {
      selectedAddressId.value = addressList.value[0].id
    }
  } catch (e) {
    // 加载地址失败
  }
}

// 新增地址
const addAddress = () => {
  editingAddress.value = null
  addressForm.region = []
  addressForm.address = ''
  addressForm.remark = ''
  addressForm.isDefault = addressList.value.length === 0 ? 1 : 0
  addressDialogVisible.value = true
}

// 编辑地址
const editAddress = (addr) => {
  editingAddress.value = addr
  addressForm.region = []
  addressForm.address = addr.address
  addressForm.remark = addr.remark || ''
  addressForm.isDefault = addr.isDefault || 0
  addressDialogVisible.value = true
}

// 保存地址
const saveAddress = async () => {
  const detailAddr = addressForm.address.trim()
  if (!detailAddr) {
    ElMessage.warning('请输入详细地址')
    return
  }
  try {
    // 组装地址（省市区 + 详细地址）
    const regionPart = getRegionLabels(addressForm.region)
    const fullAddress = regionPart ? `${regionPart} ${detailAddr}` : detailAddr

    const data = {
      userId: userStore.userInfo.id,
      address: fullAddress,
      remark: addressForm.remark,
      isDefault: addressForm.isDefault
    }
    if (editingAddress.value) {
      data.id = editingAddress.value.id
      await userAddressApi.update(data)
      ElMessage.success('地址修改成功')
    } else {
      await userAddressApi.add(data)
      ElMessage.success('地址添加成功')
    }
    addressDialogVisible.value = false
    loadAddresses()
  } catch (e) {
    // 保存失败
  }
}

// 提交订单
const handleSubmit = async () => {
  if (checkoutList.value.length === 0) {
    ElMessage.warning('当前无可结算商品，请检查购物车')
    return
  }
  const selectedAddr = addressList.value.find(a => a.id === selectedAddressId.value)
  if (!selectedAddr) {
    ElMessage.warning('请选择收货地址')
    return
  }

  submitting.value = true
  try {
    // 构造订单
    const orderData = {
      userId: userStore.userInfo.id,
      loginName: userStore.userInfo.loginName,
      userAddress: selectedAddr.address,
      cost: finalAmount.value,
      // 订单明细
      orderDetailList: checkoutList.value.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        cost: Number(item.price) * item.quantity
      }))
    }

    // 创建订单
    const res = await orderApi.add(orderData)
    const orderId = res.orderId

    // 仅移除已下单的商品（部分结算时保留未选商品）
    await Promise.all(checkoutList.value.map(item => cartStore.removeFromCart(item.id)))

    ElMessage.success('订单提交成功！')

    // 跳转到支付页
    if (orderId) {
      router.push(`/pay/${orderId}`)
    } else {
      router.push('/user/orders')
    }
  } catch (e) {
    ElMessage.error('订单提交失败')
  } finally {
    submitting.value = false
  }
}

// 返回首页
const goHome = () => {
  router.push('/')
}

onMounted(() => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  loading.value = true
  // 并行加载购物车与收货地址
  Promise.all([
    cartStore.load(),
    loadAddresses()
  ]).finally(() => {
    loading.value = false
  })
})
</script>

<style scoped>
.checkout-page {
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

/* 主体 */
.checkout-body {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 20px;
}

.empty-cart {
  background: #fff;
  border: 1px solid #e8e8e8;
  padding: 80px 0;
  text-align: center;
}

/* 区块 */
.section {
  background: #fff;
  border: 1px solid #e8e8e8;
  margin-bottom: 15px;
}

.section-title {
  padding: 12px 20px;
  font-size: 15px;
  font-weight: bold;
  color: #333;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 表格 */
.checkout-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.checkout-table thead tr {
  background: #f5f5f5;
}

.checkout-table th {
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

.checkout-table td {
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
  flex: 1;
  overflow: hidden;
  line-height: 1.5;
  max-height: 3em;
}

.cell-subtotal {
  color: #ff4e00;
  font-weight: bold;
}

/* 汇总 */
.row-summary td {
  padding: 15px 20px;
  border-bottom: none;
  font-size: 14px;
  color: #333;
}

/* 收货地址 */
.address-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px;
}

.address-item {
  position: relative;
  width: 280px;
  min-height: 100px;
  padding: 16px;
  border: 2px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
}

.address-item:hover {
  border-color: #ffd4b8;
}

.address-item.active {
  border-color: #ff6600;
  background: #fff5f0;
}

.check-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #ff6600;
  font-size: 20px;
}

.address-text {
  flex: 1;
  font-size: 14px;
  color: #333;
  overflow: hidden;
  line-height: 1.5;
  min-height: 3em;
  max-height: 3em;
  display: box;
  line-clamp: 2;
  box-orient: vertical;
}

.add-address {
  flex-direction: column;
  justify-content: center;
  text-align: center;
  color: #999;
  border-style: dashed;
}

.add-address span {
  font-size: 13px;
  margin-top: 4px;
}

.no-address {
  padding: 40px 0;
}

/* 提交订单 */
.submit-section {
  background: #fff;
  border: 1px solid #e8e8e8;
}

.submit-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 30px;
  padding: 20px;
}

.submit-total {
  font-size: 16px;
  color: #333;
}

.total-price {
  font-size: 24px;
  color: #ff4e00;
  margin-left: 4px;
}

.submit-btn {
  background: #ff6600;
  border-color: #ff6600;
  width: 200px;
  height: 48px;
  font-size: 16px;
}

.submit-btn:hover {
  background: #ff4e00;
  border-color: #ff4e00;
}
</style>
