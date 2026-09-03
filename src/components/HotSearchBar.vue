<template>
  <!-- 搜索栏：自动加载热门推荐生成热门搜索词（加载前空行占位，加载后一次渲染） -->
  <SearchBar :model-value="modelValue" :placeholder="placeholder" :hot-search="hotKeywords || []"
    @update:model-value="(val) => emit('update:modelValue', val)" @search="(kw) => emit('search', kw)" />
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

const emit = defineEmits(['update:modelValue', 'search'])

// 热门搜索词（共享缓存：多页面只请求一次）
const { hotKeywords, load } = useHotProducts()

onMounted(() => {
  load()
})
</script>
