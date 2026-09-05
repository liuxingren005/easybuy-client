import { defineStore } from "pinia";
import { ElMessage } from "element-plus";
import router from "@/router";
import cartApi from "@/api/cart";
import { useUserStore } from "@/stores/user";

/**
 * 购物车 Store（Redis 存储）
 */
export const useCartStore = defineStore("cart", {
  state: () => ({
    // 购物车商品列表
    /* cartList: JSON.parse(localStorage.getItem('cartList') || '[]') */
    cartList: [],
  }),

  getters: {
    // 购物车商品统计（失效商品不计入）
    totalCount: (state) => {
      return state.cartList.reduce(
        (sum, item) => sum + (item.invalid ? 0 : item.quantity),
        0,
      );
    },
    // 购物车商品总金额（失效商品不计入）
    totalAmount: (state) => {
      return state.cartList.reduce((sum, item) => {
        if (item.invalid) return sum;
        return sum + Number(item.price) * item.quantity;
      }, 0);
    },
    // 购物车返还总积分（价格）（失效商品不计入）
    totalPoints: (state) => {
      return state.cartList.reduce((sum, item) => {
        if (item.invalid) return sum;
        return sum + Math.floor(Number(item.price)) * item.quantity;
      }, 0);
    },
  },

  actions: {
    /**
     * 加载购物车列表（仅登录用户调用）
     */
    async load() {
      const userStore = useUserStore();
      if (!userStore.isLoggedIn) {
        // 未登录不发请求（避免 401 被拦截器跳转登录页）
        this.cartList = [];
        return;
      }
      try {
        const res = await cartApi.getList();
        if (res.code === 200) {
          this.cartList = res.list || [];
        }
      } catch (e) {}
    },

    /**
     * 添加商品（未登录提示并跳转登录页）
     * @returns {boolean} 是否成功
     */
    async addToCart(product, quantity = 1) {
      const userStore = useUserStore();
      if (!userStore.isLoggedIn) {
        ElMessage.warning("请先登录");
        router.push("/login");
        return false;
      }
      try {
        const res = await cartApi.add({ productId: product.id, quantity });
        if (res.code === 200) {
          this.cartList = res.list || [];
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    },

    /**
     * 修改商品数量
     * @returns {boolean} 是否成功
     */
    async updateQuantity(productId, quantity) {
      try {
        const res = await cartApi.updateQuantity(productId, quantity);
        if (res.code === 200) {
          this.cartList = res.list || [];
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    },

    /**
     * 移除商品
     */
    async removeFromCart(productId) {
      try {
        const res = await cartApi.remove(productId);
        if (res.code === 200) {
          this.cartList = res.list || [];
        }
      } catch (e) {
        // 失败静默
      }
    },

    /**
     * 清空购物车
     */
    async clearCart() {
      try {
        const res = await cartApi.clear();
        if (res.code === 200) {
          this.cartList = res.list || [];
        }
      } catch (e) {
        // 失败静默
      }
    },

    /**
     * 退出登录时清空本地状态
     */
    resetLocal() {
      this.cartList = [];
    },

    /**
     * localStorage 存储
     */
    /* _save() {
      localStorage.setItem('cartList', JSON.stringify(this.cartList))
    } */
  },
});
