import { ref, computed } from "vue";
import productApi from "@/api/product";
import { stripHtml } from "@/utils/stripHtml";

// 模块级共享状态：多个页面复用 - 同一个作用域
const hotProducts = ref([]);
const loading = ref(false);
const loaded = ref(false);
let pending = null;

// 文字动态处理
const plainText = (val) => stripHtml(val).replace(/\s+/g, " ").trim();

/**
 * 热门推荐（随机抽取已有商品）与热门搜索词
 */
export function useHotProducts() {
  /**
   * 加载热门推荐
   * @param {boolean} force 是否强制重新随机（换一批）
   */
  const load = (force = false) => {
    // 合并并发请求（首页顶部推荐、中部猜你喜欢...）
    if (pending) return pending; // 单飞（single-flight）/ 去重
    if (loaded.value && !force) return Promise.resolve(hotProducts.value);
    loading.value = true; // 已经加载过且不强制刷新，返回缓存
    pending = productApi
      .getHot(8)
      .then((res) => {
        hotProducts.value = res.list || [];
      })
      .catch(() => {
        // 接口未就绪时空列表
        hotProducts.value = [];
      })
      .finally(() => {
        loaded.value = true;
        loading.value = false;
        pending = null; // 请求结束，清空占位，下次重新发起
      });
    return pending; // 同一个 Promise
  };

  // 热门搜索词（取推荐商品名称，无数据时回退组件默认词）
  const hotKeywords = computed(() => {
    const words = hotProducts.value
      .slice(0, 5)
      .map((p) => plainText(p.name).slice(0, 6))
      .filter(Boolean);
    return words.length > 0 ? words : undefined;
  });

  return { hotProducts, hotKeywords, loading, load, plainText };
}
