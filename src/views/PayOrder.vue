<template>
  <div class="pay-page">
    <!-- 顶部 -->
    <div class="pay-header">
      <div class="header-inner">
        <img :src="img('logo.png')" class="logo-img" alt="易买网" @click="goHome" />
        <span class="page-title">收银台</span>
      </div>
    </div>

    <!-- 支付主体 -->
    <div class="pay-body">
      <div v-loading="loading" class="pay-content">
        <template v-if="order">
          <!-- 订单信息 -->
          <div class="order-info">
            <div class="info-row">
              <span class="label">订单号：</span>
              <span class="value order-no">{{ order.serialNumber }}</span>
            </div>
            <div class="info-row">
              <span class="label">收货地址：</span>
              <span class="value">{{ order.userAddress }}</span>
            </div>
            <div class="info-row price-row">
              <span class="label">应付金额：</span>
              <span class="price">¥{{ Number(order.cost).toFixed(2) }}</span>
            </div>
          </div>

          <!-- 支付方式选择 -->
          <div class="pay-methods">
            <h3 class="methods-title">选择支付方式</h3>
            <div class="method-list">
              <!-- 支付宝 -->
              <div :class="{ active: payType === 1 }" class="method-item alipay" @click="payType = 1">
                <div class="method-icon">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="#1677FF">
                    <path d="M21.422 15.358c-3.83-1.153-6.055-1.84-6.678-2.062a12.41 12.41 0 0 0 1.32-3.32H12.8V8.872h4v-.68h-4V6.344h-1.536c-.28 0-.312.248-.312.248v1.592H7.2v.68h3.752v1.104H7.88v.616h6.224a10.972 10.972 0 0 1-.888 2.176c-1.408-.464-2.192-.784-4.368-1.176C4.72 12.288 2 13.72 2 16.344 2 19.304 4.44 21.36 8.44 21.36c2.96 0 5.72-1.12 8.12-3.04 2.48 1.28 5.28 2.12 8.28 2.48l.48-3.442zM5.24 17.72c-1.2 0-2.04-.72-2.04-1.84 0-1.04.8-1.84 2.24-1.84 1.84 0 3.44.48 4.88 1.2-1.2 1.28-2.8 2.48-5.08 2.48z"/>
                  </svg>
                </div>
                <div class="method-info">
                  <div class="method-name">支付宝支付</div>
                  <div class="method-desc">推荐支付宝用户使用</div>
                </div>
                <div class="method-check">
                  <el-icon v-if="payType === 1" color="#ff6600"><CircleCheck /></el-icon>
                </div>
              </div>

              <!-- 微信支付 -->
              <div :class="{ active: payType === 2 }" class="method-item wechat" @click="payType = 2">
                <div class="method-icon">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="#07C160">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.406-.032zm-2.708 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.97.983.976.976 0 0 1-.968-.983c0-.542.433-.982.969-.982z"/>
                  </svg>
                </div>
                <div class="method-info">
                  <div class="method-name">微信支付</div>
                  <div class="method-desc">推荐微信用户使用</div>
                </div>
                <div class="method-check">
                  <el-icon v-if="payType === 2" color="#ff6600"><CircleCheck /></el-icon>
                </div>
              </div>
            </div>
          </div>

          <!-- 支付按钮 -->
          <div class="pay-action">
            <el-button type="primary" size="large" class="pay-btn" :loading="paying" @click="handlePay">
              立即支付 ¥{{ Number(order.cost).toFixed(2) }}
            </el-button>
            <el-button size="large" class="back-btn" @click="goBack">返回订单</el-button>
          </div>

          <!-- 支付宝支付等待弹窗 -->
          <el-dialog v-model="alipayWaitingVisible" title="支付宝支付" width="400px" :close-on-click-modal="false" :show-close="false">
            <div class="qr-code-section">
              <div class="qr-amount">
                <span>支付金额：</span>
                <span class="amount">¥{{ Number(order.cost).toFixed(2) }}</span>
              </div>
              <div class="alipay-waiting">
                <el-icon class="is-loading" size="48"><Loading /></el-icon>
                <p>支付宝页面已在新窗口打开</p>
                <p class="wait-tip">请在新窗口完成支付</p>
              </div>
              <div class="qr-status" v-if="polling">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>等待支付中...</span>
              </div>
              <div class="alipay-actions">
                <el-button type="primary" @click="checkAlipayPaid">我已完成支付</el-button>
                <el-button @click="cancelAlipayPay">取消支付</el-button>
              </div>
            </div>
          </el-dialog>

          <!-- 微信支付二维码弹窗 -->
          <el-dialog v-model="qrCodeVisible" title="微信扫码支付" width="400px" :close-on-click-modal="false">
            <div class="qr-code-section">
              <div class="qr-amount">
                <span>支付金额：</span>
                <span class="amount">¥{{ Number(order.cost).toFixed(2) }}</span>
              </div>
              <div class="qr-code-img" v-if="qrCodeUrl">
                <img :src="qrCodeUrl" alt="微信支付二维码" />
              </div>
              <div v-else class="qr-loading">
                <el-icon class="is-loading" size="40"><Loading /></el-icon>
                <p>正在生成二维码...</p>
              </div>
              <p class="qr-tip">请使用微信扫描二维码完成支付</p>
              <div class="qr-status" v-if="polling">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>等待支付中...</span>
              </div>
            </div>
          </el-dialog>
        </template>

        <el-empty v-else description="订单信息加载失败" />
      </div>
    </div>

    <!-- 支付结果页 -->
    <div v-if="showResult" class="pay-result">
      <div class="result-content">
        <el-icon v-if="paySuccess" class="result-icon success" size="64"><CircleCheck /></el-icon>
        <el-icon v-else class="result-icon fail" size="64"><CircleClose /></el-icon>
        <h2 class="result-title">{{ paySuccess ? '支付成功' : '支付失败' }}</h2>
        <p class="result-desc" v-if="paySuccess">您的订单已支付成功，感谢您的购买！</p>
        <p class="result-desc" v-else>支付过程中出现问题，请稍后重试</p>
        <div class="result-actions">
          <el-button type="primary" @click="goOrders">查看我的订单</el-button>
          <el-button @click="goHome">返回首页</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { CircleCheck, CircleClose, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useImage } from '@/composables/useImage'
import orderApi from '@/api/order'
import payApi from '@/api/pay'

const router = useRouter()
const route = useRoute()
const { img } = useImage()

const order = ref(null)
const loading = ref(false)
const paying = ref(false)
const payType = ref(1) // 1:支付宝 2:微信

// 支付宝等待
const alipayWaitingVisible = ref(false)
// 支付宝商户订单号（主动查询）
const alipayOutTradeNo = ref('')

// 微信二维码
const qrCodeVisible = ref(false)
const qrCodeUrl = ref('')
const polling = ref(false)
let pollTimer = null
// 支付宝支付新窗口引用（用于支付完成后关闭）
let alipayWin = null

// 支付结果
const showResult = ref(false)
const paySuccess = ref(false)

// 加载订单信息
const loadOrder = async () => {
  loading.value = true
  try {
    // 路由 → 查询
    const orderId = route.params.orderId || route.query.orderId
    if (orderId) {
      const res = await orderApi.getById(orderId)
      order.value = res.data
    }
  } catch (e) {
    ElMessage.error('加载订单信息失败')
  } finally {
    loading.value = false
  }
}

// 支付
const handlePay = async () => {
  if (!order.value) return
  if (order.value.status !== 1) {
    ElMessage.warning('订单状态不正确，无法支付')
    return
  }

  paying.value = true
  try {
    if (payType.value === 1) {
      // 支付宝支付：跳转到支付宝页面
      await alipayPay()
    } else if (payType.value === 2) {
      // 微信支付：显示二维码
      await wechatPay()
    }
  } catch (e) {
    ElMessage.error(e?.message || '支付发起失败')
  } finally {
    paying.value = false
  }
}

// 支付宝支付
const alipayPay = async () => {
  // 结构化对象：{ code, message, data: { html, outTradeNo } }
  const res = await payApi.alipayPay(order.value.id)
  const data = res.data || {}
  const html = data.html
  const outTradeNo = data.outTradeNo
  if (!html) {
    ElMessage.error('获取支付宝支付表单失败')
    return
  }
  // 轮询主动查询支付宝交易状态
  alipayOutTradeNo.value = outTradeNo || ''
  // 新窗口写入表单 HTML
  alipayWin = window.open('', '_blank')
  if (alipayWin) {
    alipayWin.document.write(html)
    alipayWin.document.close()
  } else {
    ElMessage.warning('请允许浏览器弹出窗口以打开支付宝支付页面')
  }
  // 显示等待弹窗
  alipayWaitingVisible.value = true
  polling.value = true
  // 轮询订单状态，主动查询支付宝并同步本地订单
  startOrderPolling()
}

// 轮询订单状态（支付宝、微信通用）
const startOrderPolling = () => {
  let count = 0
  const maxCount = 20 // 最多轮询

  pollTimer = setInterval(async () => {
    count++
    if (count >= maxCount) {
      stopPolling()
      closeAlipayWin()
      alipayWaitingVisible.value = false
      ElMessage.warning('支付超时，请重新发起支付')
      return
    }

  try {
      // 主动查询支付宝交易状态
      if (alipayOutTradeNo.value) {
        const payRes = await payApi.alipayQuery(alipayOutTradeNo.value)
        if (payRes.data?.success && 
            (payRes.data.tradeStatus === 'TRADE_SUCCESS' || payRes.data.tradeStatus === 'TRADE_FINISHED')) {
          // 支付成功，后端已同步订单
          stopPolling()
          closeAlipayWin()
          alipayWaitingVisible.value = false
          qrCodeVisible.value = false
          const orderRes = await orderApi.getById(order.value.id)
          order.value = orderRes.data
          paySuccess.value = true
          showResult.value = true
          return
        }
      }
      // 同时检查本地订单状态（异步回调可能已更新）
      const res = await orderApi.getById(order.value.id)
      if (res.data && res.data.status === 2) {
        // 支付成功
        stopPolling()
        closeAlipayWin()
        alipayWaitingVisible.value = false
        qrCodeVisible.value = false
        order.value = res.data
        paySuccess.value = true
        showResult.value = true
      }
    } catch (e) {
      // 轮询失败，继续
    }
  }, 3000) // 单次轮询时间
}

// 检查支付宝支付状态
const checkAlipayPaid = async () => {
  try {
    const res = await orderApi.getById(order.value.id)
    if (res.data && res.data.status === 2) {
      // 支付成功
      stopPolling()
      closeAlipayWin()
      alipayWaitingVisible.value = false
      order.value = res.data
      paySuccess.value = true
      showResult.value = true
    } else {
      ElMessage.info('暂未检测到支付结果，请稍后再试')
    }
  } catch (e) {
    ElMessage.error('查询支付状态失败')
  }
}

// 取消支付宝支付
const cancelAlipayPay = () => {
  stopPolling()
  closeAlipayWin()
  alipayWaitingVisible.value = false
}

// 微信支付
const wechatPay = async () => {
  qrCodeVisible.value = true
  qrCodeUrl.value = ''
  try {
    // 调用微信支付接口获取二维码链接
    const res = await payApi.wechatPay(order.value.id)
    if (res.data?.codeUrl) {
      // 使用在线二维码生成服务生成二维码图片
      qrCodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(res.data.codeUrl)}`

      // 轮询查询微信支付状态
      startWechatPolling(res.data.outTradeNo)
    } else {
      ElMessage.error(res.message || '微信支付下单失败')
      qrCodeVisible.value = false
    }
  } catch (e) {
    ElMessage.error('微信支付发起失败')
    qrCodeVisible.value = false
  }
}

// 轮询微信支付状态
const startWechatPolling = (outTradeNo) => {
  polling.value = true
  let count = 0
  const maxCount = 20 // 最多轮询

  pollTimer = setInterval(async () => {
    count++
    if (count >= maxCount) {
      stopPolling()
      qrCodeVisible.value = false
      ElMessage.warning('支付超时，请重新发起支付')
      return
    }

    try {
      const res = await payApi.wechatQuery(outTradeNo)
      const data = res.data || {}
      if (data.tradeState === 'SUCCESS') {
        // 支付成功
        stopPolling()
        qrCodeVisible.value = false
        // 异步回调可能已更新订单
        try {
          await orderApi.payWithType(order.value.id, 2, data.transactionId)
        } catch (e) {
          // 静默
        }
        paySuccess.value = true
        showResult.value = true
        // 重新加载订单
        const orderRes = await orderApi.getById(order.value.id)
        order.value = orderRes.data
      } else if (data.tradeState === 'CLOSED' || data.tradeState === 'PAYERROR') {
        stopPolling()
        qrCodeVisible.value = false
        ElMessage.error('支付失败，请重试')
      }
    } catch (e) {
      // 轮询失败，继续
    }
  }, 3000) // 单次轮询时间
}

// 停止轮询
const stopPolling = () => {
  polling.value = false
  if (pollTimer) {
    clearInterval(pollTimer)
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

// 关闭支付宝支付新窗口
const closeAlipayWin = () => {
  if (alipayWin && !alipayWin.closed) {
    try {
      alipayWin.close()
    } catch (e) {
      // 忽略
    }
  }
  alipayWin = null
}

// 返回订单
const goBack = () => {
  stopPolling()
  router.push('/user/orders')
}

// 查看订单
const goOrders = () => {
  router.push('/user/orders')
}

// 返回首页
const goHome = () => {
  router.push('/')
}

onMounted(async () => {
  // 检查是否支付宝同步跳转
  if (route.query.success) {
    paySuccess.value = route.query.success === 'true'
    showResult.value = true
  } else if (route.query.is_success) {
    // 支付宝同步跳转
    paySuccess.value = route.query.is_success === 'Y' || route.query.is_success === 'T'
    showResult.value = true
  }
  // 加载订单
  const orderId = route.params.orderId || route.query.orderId
  if (orderId) {
    await loadOrder()
    // 支付宝同步返回后，异步回调可能尚未到达
    if (showResult.value && paySuccess.value && order.value && order.value.status === 1) {
      // 订单仍为待付款，说明异步回调未到，启动轮询等待状态更新
      polling.value = true
      startOrderPolling()
    }
  }
})

// 组件卸载时停止轮询
onUnmounted(() => {
  stopPolling()
  closeAlipayWin()
})
</script>

<style scoped>
.pay-page {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 顶部 */
.pay-header {
  background: #fff;
  border-bottom: 2px solid #ff6600;
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px 20px;
}
.logo-img {
  height: 44px;
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

/* 支付主体 */
.pay-body {
  max-width: 800px;
  margin: 30px auto;
  padding: 0 20px;
}
.pay-content {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* 订单信息 */
.order-info {
  padding: 20px;
  background: #fafafa;
  border-radius: 6px;
  margin-bottom: 30px;
}
.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
}
.info-row:last-child {
  margin-bottom: 0;
}
.info-row .label {
  color: #999;
  width: 90px;
  flex-shrink: 0;
}
.info-row .value {
  color: #333;
  flex: 1;
}
.order-no {
  font-weight: bold;
  color: #ff6600;
}
.price-row .price {
  font-size: 24px;
  font-weight: bold;
  color: #ff4e00;
}

/* 支付方式 */
.pay-methods {
  margin-bottom: 30px;
}
.methods-title {
  font-size: 16px;
  color: #333;
  margin: 0 0 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}
.method-list {
  display: flex;
  gap: 20px;
}
.method-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}
.method-item:hover {
  border-color: #ffd4b8;
}
.method-item.active {
  border-color: #ff6600;
  background: #fff5f0;
}
.method-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.method-info {
  flex: 1;
}
.method-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}
.method-desc {
  font-size: 12px;
  color: #999;
}
.method-check {
  width: 24px;
  height: 24px;
}

/* 支付按钮 */
.pay-action {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
.pay-btn {
  width: 200px;
  height: 48px;
  font-size: 16px;
  background: #ff6600;
  border-color: #ff6600;
}
.pay-btn:hover {
  background: #ff4e00;
  border-color: #ff4e00;
}
.back-btn {
  width: 160px;
  height: 48px;
}

/* 二维码弹窗 */
.qr-code-section {
  text-align: center;
  padding: 20px 0;
}
.qr-amount {
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
}
.qr-amount .amount {
  font-size: 28px;
  font-weight: bold;
  color: #ff4e00;
  margin-left: 10px;
}
.alipay-waiting {
  width: 200px;
  height: 200px;
  margin: 0 auto 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}
.alipay-waiting p {
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}
.alipay-waiting .wait-tip {
  font-size: 13px;
  color: #ff6600;
}
.alipay-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}
.qr-code-img {
  width: 200px;
  height: 200px;
  margin: 0 auto 16px;
  border: 1px solid #eee;
  padding: 10px;
  background: #fff;
}
.qr-code-img img {
  width: 100%;
  height: 100%;
}
.qr-loading {
  width: 200px;
  height: 200px;
  margin: 0 auto 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  border: 1px dashed #ddd;
}
.qr-loading p {
  margin-top: 10px;
  font-size: 13px;
}
.qr-tip {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}
.qr-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #ff6600;
  font-size: 14px;
}

/* 支付结果页 */
.pay-result {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.result-content {
  background: #fff;
  border-radius: 12px;
  padding: 50px 60px;
  text-align: center;
  max-width: 500px;
}
.result-icon {
  margin-bottom: 20px;
}
.result-icon.success {
  color: #67c23a;
}
.result-icon.fail {
  color: #f56c6c;
}
.result-title {
  font-size: 24px;
  color: #333;
  margin: 0 0 12px;
}
.result-desc {
  font-size: 14px;
  color: #999;
  margin-bottom: 30px;
}
.result-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}
</style>
