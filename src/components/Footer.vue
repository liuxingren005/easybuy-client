<template>
  <div class="app-footer">
    <!-- 服务保障栏 -->
    <div class="service-bar">
      <div class="service-inner">
        <div v-for="item in serviceItems" :key="item.title" class="service-item">
          <div class="service-icon">
            <el-icon :size="28">
              <component :is="item.icon" />
            </el-icon>
          </div>
          <div class="service-text">
            <p class="service-title">{{ item.title }}</p>
            <p class="service-sub">{{ item.sub }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 主体导航 -->
    <div class="footer-main">
      <div class="footer-inner">
        <!-- 导航链接 -->
        <div class="footer-cols">
          <div v-for="col in navColumns" :key="col.title" class="footer-col">
            <h4>{{ col.title }}</h4>
            <a v-for="link in col.links" :key="link" href="javascript:void(0)" class="footer-link">{{ link }}</a>
          </div>

          <!-- 二维码 + 社交 + 热线 -->
          <div class="footer-contact">
            <div class="qr-section">
              <div class="qr-box">
                <el-icon :size="48" color="#ff6600">
                  <Shop />
                </el-icon>
              </div>
              <p class="qr-label">扫一扫<br />关注我们</p>
            </div>
            <div class="social-section">
              <a href="javascript:void(0)" class="social-link">新浪微博</a>
              <a href="javascript:void(0)" class="social-link">腾讯微博</a>
            </div>
            <div class="hotline-section">
              <p class="hotline-label">服务热线</p>
              <p class="hotline-number">400-123-4567</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 备案 -->
    <div class="footer-bottom">
      <div class="footer-inner">
        <p class="icp-text">
          备案/许可证编号：蜀ICP备12009302号-1-www.dingguagua.com
          Copyright © 2015-2018 尤洪商城网 All Rights Reserved. 复制必究 , Technical Support: Dgg Group
        </p>
        <div class="footer-badges">
          <img v-for="i in 5" :key="i" :src="img(`b_${i}.png`)" width="98" height="33" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useImageResolver } from '@/composables/useImage'
import { Medal, Van, Discount, Timer, Shop } from '@element-plus/icons-vue'

const { img } = useImageResolver()

const serviceItems = [
  { title: '正品保障', sub: '正品保障 放心购买', icon: Medal },
  { title: '满38包邮', sub: '满38元 免邮费', icon: Van },
  { title: '天天低价', sub: '天天低价 优选好货', icon: Discount },
  { title: '准时送达', sub: '准时送达 准时发货', icon: Timer }
]

const navColumns = [
  { title: '新手上路', links: ['新手指南', '支付方式', '配送方式'] },
  { title: '配送与支付', links: ['银行汇款', '在线支付', '货到付款'] },
  { title: '会员中心', links: ['会员介绍', '会员等级', '常见问题'] },
  { title: '服务保障', links: ['售后服务', '退款说明', '取消订单'] },
  { title: '联系我们', links: ['关于我们', '联系我们', '投诉建议'] }
]
</script>

<style scoped>
.app-footer {
  background: #f5f5f5;
  border-top: 1px solid #ddd;
}

/* 服务保障栏 */
.service-bar {
  background: #fff;
  border-top: 3px solid #ff6600;
  border-bottom: 1px solid #eee;
  padding: 30px 0;
}

.service-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.service-icon {
  width: 56px;
  height: 56px;
  border: 2px solid #ff6600;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff6600;
  flex-shrink: 0;
}

.service-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.service-sub {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

/* 主体导航 */
.footer-main {
  background: #fff;
  padding: 30px 0;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-cols {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-col h4 {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 6px;
}

.footer-link {
  font-size: 12px;
  color: #999;
}

.footer-link:hover {
  color: #ff6600;
}

/* 二维码 + 社交 + 热线 */
.footer-contact {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-left: 20px;
}

.qr-section {
  text-align: center;
}

.qr-box {
  width: 90px;
  height: 90px;
  border: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.qr-label {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
  line-height: 1.4;
}

.social-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.social-link {
  font-size: 12px;
  color: #999;
}

.social-link:hover {
  color: #ff6600;
}

.hotline-section {
  text-align: right;
}

.hotline-label {
  font-size: 12px;
  color: #999;
}

.hotline-number {
  font-size: 16px;
  font-weight: bold;
  color: #ff6600;
  margin-top: 4px;
}

/* 备案 */
.footer-bottom {
  background: #f5f5f5;
  border-top: 1px solid #eee;
  padding: 20px 0;
  text-align: center;
}

.icp-text {
  font-size: 12px;
  color: #999;
  line-height: 1.8;
  margin-bottom: 10px;
}

.footer-badges {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
