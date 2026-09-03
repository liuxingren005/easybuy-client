<template>
  <div class="news-list-page">
    <!-- 顶部工具栏 -->
    <TopBar />

    <!-- 页头 -->
    <div class="header">
      <div class="header-inner">
        <img :src="img('logo.png')" class="logo-img" alt="易买网" @click="goHome" />
        <span class="page-title">新闻资讯</span>
      </div>
    </div>

    <!-- 主导航 -->
    <div class="nav-bar">
      <div class="nav-inner">
        <router-link to="/" class="nav-link">首页</router-link>
        <span class="nav-link active">新闻资讯</span>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input v-model="filterTitle" placeholder="搜索资讯标题" clearable style="width: 240px">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
          start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD"
          style="width: 320px" />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 资讯列表 -->
      <div class="news-container" v-loading="loading">
        <div v-for="news in pagedList" :key="news.id" class="news-card" @click="openDetail(news)">
          <div class="news-card-header">
            <h3 class="news-title">{{ news.title }}</h3>
            <span class="news-date">{{ news.createTime }}</span>
          </div>
          <p class="news-content">{{ news.content }}</p>
        </div>
        <el-empty v-if="!loading && pagedList.length === 0" description="暂无资讯" />
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="filteredList.length > 0">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20]" :total="filteredList.length"
          layout="total, sizes, prev, pager, next, jumper" background />
      </div>
    </div>

    <!-- 资讯详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="currentNews?.title" width="640px">
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { useImage } from '@/composables/useImage'
import newsApi from '@/api/news'
import Footer from '@/components/Footer.vue'
import TopBar from '@/components/TopBar.vue'

const router = useRouter()
const { img } = useImage()

const loading = ref(false)
const allNews = ref([])
const filterTitle = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const detailVisible = ref(false)
const currentNews = ref(null)

// 筛选资讯
const filteredList = computed(() => {
  let list = allNews.value
  // 标题
  if (filterTitle.value) {
    list = list.filter(n => n.title.includes(filterTitle.value))
  }
  // 日期范围
  if (dateRange.value?.length === 2) {
    const [start, end] = dateRange.value
    list = list.filter(n => {
      const time = n.createTime || ''
      return time >= start && time <= end
    })
  }
  return list
})

// 分页切片
const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

// 搜索
const handleSearch = () => {
  currentPage.value = 1
}
const handleReset = () => {
  filterTitle.value = ''
  dateRange.value = []
  currentPage.value = 1
}

// 详情
const openDetail = (news) => {
  currentNews.value = news
  detailVisible.value = true
}

// 导航
const goHome = () => { router.push('/') }

// 加载全部资讯
const loadData = async () => {
  loading.value = true
  try {
    // 获取全部资讯
    const res = await newsApi.getList(1000)
    allNews.value = res.list || []
  } catch (e) {
    // 接口未就绪时静默
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.news-list-page { background: #f5f5f5; min-height: 100vh; }

.header {
  background: #fff;
}
.header-inner {
  max-width: 1200px; margin: 0 auto; padding: 20px;
  display: flex; align-items: center; gap: 16px;
}
.logo-img { height: 50px; width: auto; cursor: pointer; }
.page-title { font-size: 24px; color: #333; border-left: 2px solid #ff6600; padding-left: 16px; }

.nav-bar {
  background: #fff;
  border-top: 2px solid #ff6600;
}
.nav-inner {
  max-width: 1200px; margin: 0 auto; padding: 0 20px;
  display: flex; gap: 30px; align-items: center;
}
.nav-link { font-size: 16px; color: #333; text-decoration: none; padding: 12px 0; }
.nav-link.active { color: #ff6600; border-bottom: 2px solid #ff6600; }

.content-area { max-width: 1200px; margin: 15px auto; padding: 0 20px; }

.search-bar {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  background: #fff; border-radius: 8px; padding: 16px; margin-bottom: 16px;
}

.news-container { background: #fff; border-radius: 8px; padding: 20px; }
.news-card {
  padding: 16px; border-bottom: 1px solid #f0f0f0; cursor: pointer; transition: background 0.2s;
}
.news-card:hover { background: #fff5f0; }
.news-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.news-title { font-size: 16px; color: #333; font-weight: 500; }
.news-card:hover .news-title { color: #ff6600; }
.news-date { font-size: 13px; color: #ccc; white-space: nowrap; }
.news-content { font-size: 14px; color: #666; line-height: 1.6; overflow: hidden; text-overflow: ellipsis; /* 模拟多行省略 */ max-height: 3.2rem; }

.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }

.detail-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.detail-date { font-size: 13px; color: #999; }
.detail-content { font-size: 14px; color: #333; line-height: 1.8; white-space: pre-wrap; }
</style>
