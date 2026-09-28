import axios from "axios";
import { ElMessage } from "element-plus";
import router from "@/router";

// 创建 Axios 实例
const request = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

// 401 整页跳转标记 → 401 路由跳转中标记（避免并发 401 触发多次 replace）
let redirectingToLogin = false;

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 携带 JWT 令牌（localStorage）
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = "Bearer " + token;
    }
    return config;
  },
  //  透传
  (error) => {
    return Promise.reject(error); // 继续向上传递，中断并抛出错误 reject、resolve
  },
);

// 合并
const activeMessages = new Set(); // 错误提示去重
const showError = (message) => {
  // 拦截与登记
  if (activeMessages.has(message)) return;
  activeMessages.add(message);
  ElMessage.error({
    message,
    onClose: () => {
      // 清理
      activeMessages.delete(message);
    },
  });
};

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 会话延期：后端换发新令牌时同步本地存储
    const renewed = response.headers["authorization"];
    if (renewed) {
      localStorage.setItem(
        "token",
        renewed.startsWith("Bearer ") ? renewed.substring(7) : renewed,
      );
    }
    const res = response.data;
    if (res.code && res.code !== 200) {
      showError(res.message || "操作失败");
      return Promise.reject(new Error(res.message || "操作失败"));
    }
    return res;
  },
  // 透传
  // 会话延期；401 被踢/过期
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        // 未登录或登录过期：清理本地会话并跳转登录
        /* showError(error.response.data?.message || "登录已过期，请重新登录"); */
        // 被迫下线/登录已过期
        const reason = error.response.data?.kicked ? "kicked" : "expired";
        // 清理本地会话
        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");
        // 整页重载 → SPA 路由跳转
        if (!redirectingToLogin) {
          redirectingToLogin = true;
          /* window.location.replace("/login"); */
          router
            .replace({ path: "/login", query: { reason } })
            .finally(() => {
              redirectingToLogin = false; // 刚好打开了一个数据看板页面，并发请求
            });
        }
      } else if (status === 403) {
        showError(error.response.data?.message || "无权限访问");
      } else if (status === 404) {
        showError("请求资源不存在");
      } else if (status === 500) {
        showError("服务器内部错误");
      } else {
        showError(`请求错误 (${status})`);
      }
    } else if (error.code === "ECONNABORTED") {
      // 请求超时
      showError("请求超时，请稍后重试");
    } else {
      // 网络异常
      showError("网络异常");
    }
    return Promise.reject(error);
  },
);

export default request;
