/**
 * 图片资源
 */
const modules = import.meta.glob('@/assets/images/*', {
  eager: true,
  query: '?url',
  import: 'default'
})

/** 文件名 → 映射表 */
const imageMap = {}
for (const [path, url] of Object.entries(modules)) {
  // /src/assets/images/logo.png → logo.png
  const name = path.split('/').pop()
  imageMap[name] = url
}

export function useImage() {
  /**
   * 图片 URL
   * @param {string} name 文件名
   * @returns {string} URL
   */
  const img = (name) => imageMap[name] || ''

  return { img, imageMap }
}
