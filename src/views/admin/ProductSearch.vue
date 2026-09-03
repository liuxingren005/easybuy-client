<template>
  <div class="product-search">
    <!-- 搜索区域 -->
    <div class="search-bar">
      <el-input v-model="queryParams.keyword" placeholder="输入商品关键字" clearable
        style="width: 260px" @keyup.enter="handleSearch">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="queryParams.categoryLevel1Id" placeholder="全部分类" clearable
        style="width: 160px">
        <el-option v-for="c in categoryTree" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-input-number v-model="queryParams.minPrice" :min="0" :precision="2"
        placeholder="最低价" controls-position="right" style="width: 130px"
        @keyup.enter="handleSearch"/>
      <span class="price-sep">—</span>
      <el-input-number v-model="queryParams.maxPrice" :min="0" :precision="2"
        placeholder="最高价" controls-position="right" style="width: 130px"
        @keyup.enter="handleSearch"/>
      <el-button type="primary" @click="handleSearch" @keyup.enter="handleSearch">
        <el-icon><Search /></el-icon>搜索
      </el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <!-- 搜索结果（ES 高亮） -->
    <div v-loading="loading">
      <div v-if="searched" class="result-tip">
        共找到 <b>{{ total }}</b> 条相关商品
        <template v-if="queryParams.keyword">，关键字「<span class="kw">{{ queryParams.keyword }}</span>」</template>
      </div>

      <el-empty v-if="searched && list.length === 0" description="未找到相关商品" />

      <div v-else class="product-grid">
        <div v-for="item in list" :key="item.id" class="product-card">
          <div class="product-image">
            <img v-if="item.fileName" :src="productApi.imageUrl(item.fileName)" class="product-img" />
            <el-icon v-else size="60" color="#ddd"><Picture /></el-icon>
          </div>
          <!-- name/description 含 ES 高亮标签，用 v-html 渲染 -->
          <p class="product-name" v-html="item.name"></p>
          <p class="product-desc" v-html="item.description || '暂无描述'"></p>
          <p class="product-price">￥{{ Number(item.price || 0).toFixed(2) }}</p>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="searched && total > 0">
        <el-pagination v-model:current-page="queryParams.pageNum" v-model:page-size="queryParams.pageSize"
          :page-sizes="[12, 24, 48]" :total="total" layout="total, sizes, prev, pager, next"
          background @size-change="loadData" @current-change="loadData" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Picture } from '@element-plus/icons-vue'
import productApi from '@/api/product'
import categoryApi from '@/api/category'

const loading = ref(false)
const searched = ref(false)
const list = ref([])
const total = ref(0)
const categoryTree = ref([])

const queryParams = reactive({
  pageNum: 1,
  pageSize: 12,
  keyword: '',
  categoryLevel1Id: null,
  minPrice: null,
  maxPrice: null
})

// 加载一级分类（筛选条件）
const loadCategories = async () => {
  try {
    const res = await categoryApi.getTree()
    categoryTree.value = res.list || []
  } catch (e) {
    // 静默
  }
}

// 调用 ES 搜索接口
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
      keyword: queryParams.keyword || undefined,
      categoryLevel1Id: queryParams.categoryLevel1Id || undefined,
      minPrice: queryParams.minPrice ?? undefined,
      maxPrice: queryParams.maxPrice ?? undefined
    }
    const res = await productApi.search(params)
    list.value = res.page.list || []
    total.value = res.page.total || 0
    searched.value = true
  } catch (e) {

  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  queryParams.pageNum = 1
  loadData()
}

// 重置
const handleReset = () => {
  Object.assign(queryParams, {
    pageNum: 1, pageSize: 12, keyword: '',
    categoryLevel1Id: null, minPrice: null, maxPrice: null
  })
  loadData()
}

onMounted(() => {
  loadCategories()
  loadData()
})
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.price-sep {
  color: #999;
}

.result-tip {
  margin-bottom: 14px;
  font-size: 13px;
  color: #666;
}

.result-tip .kw {
  color: #ff6600;
  font-weight: bold;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.product-card {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 14px;
  text-align: center;
  background: #fff;
  transition: box-shadow 0.3s, transform 0.3s;
}

.product-card:hover {
  box-shadow: 0 4px 16px rgba(255, 102, 0, 0.15);
  transform: translateY(-2px);
}

.product-image {
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 4px;
  margin-bottom: 10px;
}

.product-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.product-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ES 高亮 */
.product-name :deep(span),
.product-desc :deep(span) {
  color: #ff6600 !important;
  font-weight: bold;
}

.product-price {
  color: #ff6600;
  font-weight: bold;
  font-size: 16px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
