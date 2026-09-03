<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <div class="sidebar">
      <div class="sidebar-logo">
        <img :src="img('logo.png')" class="logo-img" alt="易买网" />
        <span>管理后台</span>
      </div>
      <el-menu :default-active="activeMenu" router class="sidebar-menu">
        <el-menu-item index="/admin/news">
          <el-icon><Document /></el-icon>
          <span>资讯管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/categories">
          <el-icon><Menu /></el-icon>
          <span>分类管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/products">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/search">
          <el-icon><Search /></el-icon>
          <span>商品搜索</span>
        </el-menu-item>
        <el-menu-item index="/admin/orders">
          <el-icon><List /></el-icon>
          <span>全部订单</span>
        </el-menu-item>
      </el-menu>
      <div class="sidebar-footer">
        <el-button text @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
      </div>
    </div>

    <!-- 右侧主区域 -->
    <div class="main">
      <!-- 顶部导航 -->
      <div class="topbar">
        <span class="page-title">{{ currentTitle }}</span>
        <div class="user-info">
          <el-icon><UserFilled /></el-icon>
          <span>{{ userStore.loginName }}</span>
          <span class="role-badge">{{ userStore.isAdmin ? '管理员' : '普通用户' }}</span>
          <el-button text type="danger" @click="handleLogout">退出登录</el-button>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Document, User, UserFilled, HomeFilled, Menu, Goods, List, Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useImage } from '@/composables/useImage'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 图片资源
const { img } = useImage()

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '管理后台')

const goHome = () => {
  router.push('/')
}

const handleLogout = async () => {
  await userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 220px;
  background: #001529;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-logo {
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-bottom: 1px solid #1f2937;
}

.sidebar-logo .logo-img {
  height: 36px;
  width: auto;
  margin-bottom: 4px;
  border-radius: 4px;
}

.sidebar-logo span {
  font-size: 13px;
  color: #888;
  margin-top: 4px;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  background: #001529;
}

.sidebar-menu :deep(.el-menu-item) {
  color: #aaa;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: #00203d;
  color: #fff;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: #ff6600;
  color: #fff;
}

.sidebar-footer {
  padding: 10px;
  border-top: 1px solid #1f2937;
}

.sidebar-footer .el-button {
  color: #aaa;
  width: 100%;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topbar {
  height: 60px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid #eee;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.role-badge {
  background: #ff6600;
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f5f5;
}
</style>
