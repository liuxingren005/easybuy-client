<template>
  <div class="search-area">
    <div class="search-box">
      <el-input v-model="keyword" :placeholder="placeholder" size="large" class="search-field"
        @keyup.enter="handleSearch" />
      <el-button type="primary" size="large" class="search-btn" @click="handleSearch">
        <el-icon>
          <Search />
        </el-icon>搜索
      </el-button>
    </div>
    <!-- 常驻占位：固定高度，热词加载前后都不引起布局抖动 -->
    <div class="hot-search">
      <span>热门搜索：</span>
      <!-- 索引 key：换一批时原地复用标签更新文本 -->
      <el-tag v-for="(tag, idx) in hotSearch" :key="idx" size="small" effect="plain" class="hot-tag"
        @click="handleTag(tag)">{{ tag }}</el-tag>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'

const props = defineProps({
  // v-model 支持
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '搜索商品'
  },
  // 热门搜索词列表
  hotSearch: {
    type: Array,
    default: () => ['咖啡', 'iphone 6S', '新鲜美食', '蛋糕', '日用品', '连衣裙']
  }
})

const emit = defineEmits(['update:modelValue', 'search'])

const keyword = ref(props.modelValue)

// 同步
watch(() => props.modelValue, (val) => {
  keyword.value = val || ''
})

// 点击搜索按钮 / 回车
const handleSearch = () => {
  const kw = keyword.value.trim()
  if (!kw) return
  emit('update:modelValue', kw)
  emit('search', kw)
}

// 点击热门搜索词
const handleTag = (tag) => {
  keyword.value = tag
  emit('update:modelValue', tag)
  emit('search', tag)
}
</script>

<style scoped>
/* min-width:0：flex 子项宽度由 flex 分配 */
.search-area {
  width: 100%;
  min-width: 0;
}

.search-box {
  display: flex;
  align-items: stretch;
  border: 2px solid #ff6600;
  border-radius: 24px;
  overflow: hidden;
  background: #fff;
  transition: box-shadow 0.2s;
}

.search-box:focus-within {
  box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.15);
}

.search-field {
  flex: 1;
}

.search-field :deep(.el-input__wrapper) {
  box-shadow: none !important;
  border-radius: 22px 0 0 22px;
  background: transparent;
  padding: 0 16px;
}

.search-field :deep(.el-input__inner) {
  font-size: 15px;
}

.search-btn {
  border-radius: 0 22px 22px 0;
  border: none;
  background: #ff6600;
  padding: 0 28px;
  font-size: 15px;
  font-weight: 500;
}

.search-btn:hover {
  background: #e55a00 !important;
}

.search-btn .el-icon {
  margin-right: 4px;
}

/* 固定单行高度：热词加载前后不引起布局抖动 */
.hot-search {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  flex-wrap: nowrap;
  overflow: hidden;
}

.hot-search>* {
  flex-shrink: 0;
}

.hot-tag {
  cursor: pointer;
}
</style>
