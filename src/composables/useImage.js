import { ref } from "vue";

/**
 * 图片资源
 */
const modules = import.meta.glob("@/assets/images/*", {
  eager: true,
  query: "?url",
  import: "default",
});

/** 文件名 → 映射表 */
const imageMap = {};
for (const [path, url] of Object.entries(modules)) {
  // /src/assets/images/logo.png → logo.png
  const name = path.split("/").pop();
  imageMap[name] = url;
}

// 图片加载失败登记
const failedImages = ref(new Set());

export function useImageResolver() {
  /**
   * 图片 URL
   * @param {string} name 文件名
   * @returns {string} URL
   */
  const img = (name) => imageMap[name] || "";

  return { img, imageMap };
}
/**
 * 图片异常
 */
export function useImageFallback() {
  const handleImageError = (fileName) => {
    failedImages.value.add(fileName);
  };
  const showImage = (fileName) =>
    !!fileName && !failedImages.value.has(fileName);

  return { showImage, handleImageError };
}
