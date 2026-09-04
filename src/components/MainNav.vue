<template>
  <!-- 主导航（各页面复用） -->
  <div class="nav-bar">
    <div class="nav-inner">
      <div class="nav-categories"><span class="all-categories">全部商品分类</span></div>
      <div class="nav-links">
        <router-link to="/" class="nav-link" :class="{ active: isHome }">首页</router-link>
        <router-link v-for="item in navLevel1Cats" :key="item.id" :to="`/products?category1Id=${item.id}`"
          class="nav-link">{{ text(item.name) }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import categoryApi from '@/api/category'
import { stripHtml } from '@/utils/stripHtml'

const route = useRoute()

// 首页时高亮“首页”链接
const isHome = computed(() => route.path === '/')

// 主导航（一级分类）
const catTree = ref([])
const navLevel1Cats = computed(() => {
  return catTree.value.slice(0, 7)
})

// 文字动态处理
const text = (val) => stripHtml(val).replace(/\s+/g, ' ').trim()

// 加载分类树（一级→二级→三级）
const loadCategoryTree = async () => {
  try {
    const res = await categoryApi.getTree()
    catTree.value = res.list || []
  } catch (e) {
    // 接口未就绪时静默（导航仅显示首页）
  }
}

onMounted(() => {
  loadCategoryTree()
})
</script>

<style scoped>
/* 主导航（通栏铺开） */
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

.nav-link:hover {
  color: #ff6600;
}

.nav-link.active {
  color: #ff6600;
  border-bottom: 2px solid #ff6600;
}
</style>
