<template>
  <!-- 搜索栏：自动加载热门推荐生成热门搜索词（加载前空行占位，加载后一次渲染） -->
  <SearchBar :model-value="modelValue" :placeholder="placeholder" :hot-search="hotKeywords || []"
    @update:model-value="(val) => emit('update:modelValue', val)" @search="(kw) => emit('search', kw)" /> <!-- 转发给父组件 -->
</template>

<script setup>
import { onMounted } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import { useHotProducts } from '@/composables/useHotProducts'

defineProps({
  // v-model 支持
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '搜索商品'
  }
})

/* 
父 → 子：props / 子 → 父：emit
用户触发搜索
emit('search', kw) // kw 搜索词
中间层组件转发
@search="(kw) => emit('search', kw)" // kw 原封不动地再 emit 至父组件
父组件执行搜索
@search="handleSearch"

Home/ProductList/ProductDetail
*/

// 声明自定义事件
const emit = defineEmits(['update:modelValue', 'search']) // 子组件向父组件传递

// 热门搜索词（共享缓存：多页面只请求一次）
const { hotKeywords, load } = useHotProducts()

onMounted(() => {
  load()
})
</script>
