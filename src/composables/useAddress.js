import { ref } from 'vue'
import areaData from '@/assets/area.json'

/**
 * 地址
 *
 * area.json 格式：
 * { "11": { "n": "北京", "y": "b", "c": { "1101": { "n": "北京", "y": "b", "c": { "110101": { "n": "东城", "y": "d" } } } } } }
 *
 * y = 拼音首字母，c = 子级
 */
const cascaderOptions = ref([])
const provinceGroups = ref([])

function buildCascader() {
  const result = []
  for (const [provCode, prov] of Object.entries(areaData)) {
    const provNode = { value: provCode, label: prov.n, children: [] }
    if (prov.c) {
      for (const [cityCode, city] of Object.entries(prov.c)) {
        const cityNode = { value: cityCode, label: city.n, children: [] }
        if (city.c) {
          for (const [distCode, dist] of Object.entries(city.c)) {
            cityNode.children.push({ value: distCode, label: dist.n })
          }
        }
        // 叶子节点
        if (cityNode.children.length === 0) delete cityNode.children
        provNode.children.push(cityNode)
      }
    }
    if (provNode.children.length === 0) delete provNode.children
    result.push(provNode)
  }
  return result
}

function buildProvinceGroups() {
  const groups = {}
  for (const [, prov] of Object.entries(areaData)) {
    const initial = (prov.y || '#').toUpperCase()
    if (!groups[initial]) groups[initial] = []
    groups[initial].push(prov.n)
  }
  return Object.keys(groups)
    .sort()
    .map(key => ({ initial: key, provinces: groups[key] }))
}

/**
 * 解析省 / 市 / 区
 * @param {string} addressStr - 地址文本
 * @returns {{ province: {code,n} | null, city: {code,n,...} | null, district: {code,n,...} | null }}
 */
function parseAddress(addressStr) {
  const result = { province: null, city: null, district: null }
  if (!addressStr) return result

  // 省份匹配
  for (const [provCode, provData] of Object.entries(areaData)) {
    if (addressStr.includes(provData.n)) {
      result.province = { code: provCode, n: provData.n }
      // 城市匹配
      if (provData.c) {
        for (const [cityCode, cityData] of Object.entries(provData.c)) {
          if (addressStr.includes(cityData.n)) {
            result.city = { code: cityCode, ...cityData }
            // 区县匹配
            if (cityData.c) {
              for (const [distCode, distData] of Object.entries(cityData.c)) {
                if (addressStr.includes(distData.n)) {
                  result.district = { code: distCode, ...distData }
                  break
                }
              }
            }
            break
          }
        }
      }
      break
    }
  }
  return result
}

cascaderOptions.value = buildCascader()
provinceGroups.value = buildProvinceGroups()

export function useAddress() {
  return {
    cascaderOptions,
    provinceGroups,
    areaData,
    parseAddress
  }
}
