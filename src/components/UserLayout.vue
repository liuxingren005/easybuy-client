<template>
  <div class="user-layout">
    <!-- 顶部导航 -->
    <div class="top-bar">
      <div class="top-inner">
        <img :src="img('logo.png')" class="logo-img" alt="易买网" @click="goHome" />
        <span class="page-label">会员中心</span>
        <div class="top-right">
          <span>你好，{{ userStore.userName }}</span>
          <span class="divider">|</span>
          <span class="link" @click="goHome">返回首页</span>
          <span class="divider">|</span>
          <span class="link" @click="handleLogout">退出</span>
        </div>
      </div>
    </div>

    <div class="user-body">
      <!-- 左侧菜单 -->
      <div class="side-menu">
        <div class="menu-title">会员中心</div>
        <el-menu :default-active="activeMenu" router class="user-menu">
          <el-menu-item index="/user/orders">
            <el-icon><List /></el-icon>
            <span>我的订单</span>
          </el-menu-item>
          <el-menu-item index="/user/addresses">
            <el-icon><Location /></el-icon>
            <span>收货地址</span>
          </el-menu-item>
          <el-menu-item index="/user/favorites">
            <el-icon><Star /></el-icon>
            <span>我的收藏</span>
          </el-menu-item>
          <el-menu-item index="/user/profile">
            <el-icon><User /></el-icon>
            <span>个人信息</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 右侧内容 -->
      <div class="user-content">
        <router-view />
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { List, Location, Star, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useImage } from '@/composables/useImage'
import Footer from '@/components/Footer.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 图片资源
const { img } = useImage()

const activeMenu = computed(() => route.path)

const goHome = () => {
  router.push('/')
}

const handleLogout = async () => {
  await userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.user-layout {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.top-bar {
  background: #fff;
  border-bottom: 2px solid #ff6600;
}

.top-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
}

.logo-img {
  height: 44px;
  width: auto;
  cursor: pointer;
}

.page-label {
  font-size: 18px;
  color: #ff6600;
  border-left: 1px solid #ddd;
  padding-left: 16px;
}

.top-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #999;
}

.top-right .divider { color: #ddd; }
.top-right .link { color: #ff6600; cursor: pointer; }

.user-body {
  flex: 1;
  width: 1200px;
  max-width: 100%;
  margin: 16px auto;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.side-menu {
  width: 180px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.menu-title {
  background: #ff6600;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  padding: 12px 20px;
}

.user-menu {
  border-right: none;
}

.user-menu :deep(.el-menu-item.is-active) {
  color: #ff6600;
  background: #fff5f0;
}

.user-content {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  min-height: 480px;
}
</style>
