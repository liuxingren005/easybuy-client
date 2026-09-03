<template>
  <!-- 顶部工具栏 -->
  <div class="top-bar">
    <div class="top-inner">
      <el-popover placement="bottom" :width="460" trigger="click" v-model:visible="cityPickerVisible">
        <template #reference>
          <span class="city-trigger">送货至：{{ displayAddress || '请选择' }} <span class="caret">▾</span></span>
        </template>
        <!-- 已登录：显示用户地址列表 + 手动选择 -->
        <div v-if="userStore.isLoggedIn" class="city-picker">
          <div class="city-picker-header">
            <span class="picker-title">选择收货地址</span>
            <div class="header-actions">
              <el-button size="small" type="primary" link @click="handleAddAddress">+ 新增地址</el-button>
              <router-link to="/user/addresses" class="manage-link" @click="cityPickerVisible = false">管理地址 ›</router-link>
            </div>
          </div>
          <!-- 用户地址列表 -->
          <div class="user-address-section">
            <div v-for="addr in userAddresses" :key="addr.id"
              :class="['user-address-item', { active: selectedAddressId === addr.id }]"
              @click="selectUserAddress(addr)">
              <div class="addr-info">
                <div class="addr-top">
                  <span class="addr-name">{{ addr.address }}</span>
                  <el-tag v-if="addr.isDefault === 1" size="small" type="warning" effect="plain">默认</el-tag>
                </div>
                <div v-if="addr.remark" class="addr-remark">{{ addr.remark }}</div>
              </div>
              <el-icon v-if="selectedAddressId === addr.id" class="addr-check"><CircleCheck /></el-icon>
            </div>
            <div v-if="userAddresses.length === 0" class="user-address-empty">
              <p>暂无收货地址，点击右上角"+ 新增地址"添加</p>
            </div>
          </div>
          <div class="city-divider">或者手动选择</div>
          <!-- 三级联动：面包屑导航 -->
          <div class="city-breadcrumb">
            <span :class="{ active: currentLevel === 0 }" @click="currentLevel = 0">省份</span>
            <template v-if="selectedProvince">
              <span class="sep">&gt;</span>
              <span :class="{ active: currentLevel === 1 }" @click="currentLevel = 1">{{ selectedProvince.n }}</span>
            </template>
            <template v-if="selectedCityObj">
              <span class="sep">&gt;</span>
              <span :class="{ active: currentLevel === 2 }" @click="currentLevel = 2">{{ selectedCityObj.n }}</span>
            </template>
            <span class="city-clear" @click="clearCity">清空</span>
          </div>
          <!-- 省份列表 -->
          <div v-if="currentLevel === 0" class="city-list">
            <div v-for="group in provinceGroups" :key="group.initial" class="city-group">
              <span class="city-initial">{{ group.initial }}</span>
              <span v-for="prov in group.provinces" :key="prov" class="city-name"
                :class="{ active: selectedProvince?.n === prov }"
                @click="selectProvince(prov)">{{ prov }}</span>
            </div>
          </div>
          <!-- 城市列表 -->
          <div v-else-if="currentLevel === 1" class="city-list">
            <span v-for="city in cityList" :key="city.code" class="city-name"
              :class="{ active: selectedCityObj?.n === city.n }"
              @click="selectCity(city)">{{ city.n }}</span>
          </div>
          <!-- 区县列表 -->
          <div v-else-if="currentLevel === 2" class="city-list">
            <span v-for="dist in districtList" :key="dist.code" class="city-name"
              :class="{ active: selectedDistrict?.n === dist.n }"
              @click="selectDistrict(dist)">{{ dist.n }}</span>
            <span v-if="districtList.length === 0" class="city-empty">暂无区县数据</span>
          </div>
        </div>
        <!-- 未登录：保持手动选择 -->
        <!-- 三级联动：面包屑导航 -->
        <div v-else class="city-picker">
          <div class="city-breadcrumb">
            <span :class="{ active: currentLevel === 0 }" @click="currentLevel = 0">省份</span>
            <template v-if="selectedProvince">
              <span class="sep">&gt;</span>
              <span :class="{ active: currentLevel === 1 }" @click="currentLevel = 1">{{ selectedProvince.n }}</span>
            </template>
            <template v-if="selectedCityObj">
              <span class="sep">&gt;</span>
              <span :class="{ active: currentLevel === 2 }" @click="currentLevel = 2">{{ selectedCityObj.n }}</span>
            </template>
            <span class="city-clear" @click="clearCity">清空</span>
          </div>
          <!-- 省份列表 -->
          <div v-if="currentLevel === 0" class="city-list">
            <div v-for="group in provinceGroups" :key="group.initial" class="city-group">
              <span class="city-initial">{{ group.initial }}</span>
              <span v-for="prov in group.provinces" :key="prov" class="city-name"
                :class="{ active: selectedProvince?.n === prov }"
                @click="selectProvince(prov)">{{ prov }}</span>
            </div>
          </div>
          <!-- 城市列表 -->
          <div v-else-if="currentLevel === 1" class="city-list">
            <span v-for="city in cityList" :key="city.code" class="city-name"
              :class="{ active: selectedCityObj?.n === city.n }"
              @click="selectCity(city)">{{ city.n }}</span>
          </div>
          <!-- 区县列表 -->
          <div v-else-if="currentLevel === 2" class="city-list">
            <span v-for="dist in districtList" :key="dist.code" class="city-name"
              :class="{ active: selectedDistrict?.n === dist.n }"
              @click="selectDistrict(dist)">{{ dist.n }}</span>
            <span v-if="districtList.length === 0" class="city-empty">暂无区县数据</span>
          </div>
        </div>
      </el-popover>
      <div class="right">
        <template v-if="userStore.isLoggedIn">
          <router-link to="/user/profile" class="link">你好，{{ userStore.userName }}</router-link>
          <span class="divider">|</span>
          <span v-if="userStore.isAdmin" class="link" @click="goAdmin">管理后台</span>
          <span class="divider" v-if="userStore.isAdmin">|</span>
          <span class="link" @click="handleLogout">退出</span>
        </template>
        <template v-else>
          <router-link to="/login" class="link">你好，请登录</router-link>
          <span class="divider">|</span>
          <router-link to="/register" class="link">免费注册</router-link>
        </template>
        <span class="divider">|</span>
        <router-link to="/user/orders" class="link-muted">我的订单</router-link>
        <span class="divider">|</span>
        <span>收藏夹</span>
        <span class="divider">|</span>
        <span>客户服务</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { CircleCheck } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAddress } from '@/composables/useAddress'
import userAddressApi from '@/api/userAddress'

const router = useRouter()
const userStore = useUserStore()
const { provinceGroups, areaData, parseAddress } = useAddress()

// 地址（城市选择器）
const cityPickerVisible = ref(false)
const currentLevel = ref(0)
const selectedProvince = ref(null)
const selectedCityObj = ref(null)
const selectedDistrict = ref(null)

// 用户收货地址列表（登录加载）
const userAddresses = ref([])
const selectedAddressId = ref(null)

// 加载用户收货地址
const loadUserAddresses = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await userAddressApi.findByUserId(userStore.userInfo.id)
    userAddresses.value = res.list || []
    // 默认选中默认地址，否则选中第一个
    const defaultAddr = userAddresses.value.find(a => a.isDefault === 1)
    if (defaultAddr) {
      selectedAddressId.value = defaultAddr.id
    } else if (userAddresses.value.length > 0) {
      selectedAddressId.value = userAddresses.value[0].id
    }
  } catch (e) {
    // 地址接口未就绪时静默
  }
}

// 选择用户收货地址
const selectUserAddress = (addr) => {
  selectedAddressId.value = addr.id
  // 选中用户地址 → 从地址文本解析省市区，同步到手动选择面包屑
  const parsed = parseAddress(addr.address)
  selectedProvince.value = parsed.province
  selectedCityObj.value = parsed.city
  selectedDistrict.value = parsed.district
  currentLevel.value = 0
}

// 新增收货地址
const handleAddAddress = () => {
  cityPickerVisible.value = false
  const query = {}
  if (selectedProvince.value) query.provCode = selectedProvince.value.code
  if (selectedCityObj.value) query.cityCode = selectedCityObj.value.code
  if (selectedDistrict.value) query.distCode = selectedDistrict.value.code
  router.push({ path: '/user/addresses', query })
}

const savedCity = localStorage.getItem('city')
if (savedCity) {
  const data = JSON.parse(savedCity)
  selectedProvince.value = data.province
  selectedCityObj.value = data.city
  selectedDistrict.value = data.district
}

// 城市列表
const cityList = computed(() => {
  if (!selectedProvince.value) return []
  const provData = areaData[selectedProvince.value.code]
  if (!provData?.c) return []
  return Object.entries(provData.c).map(([code, city]) => ({ code, ...city }))
})

// 区县列表
const districtList = computed(() => {
  if (!selectedProvince.value || !selectedCityObj.value) return []
  const provData = areaData[selectedProvince.value.code]
  if (!provData?.c) return []
  const cityData = provData.c[selectedCityObj.value.code]
  if (!cityData?.c) return []
  return Object.entries(cityData.c).map(([code, dist]) => ({ code, ...dist }))
})

// 显示文本
const displayAddress = computed(() => {
  if (userStore.isLoggedIn && selectedAddressId.value) {
    const addr = userAddresses.value.find(a => a.id === selectedAddressId.value)
    if (addr) return addr.address
  }
  // 选择省市区
  const parts = []
  if (selectedProvince.value) parts.push(selectedProvince.value.n)
  if (selectedCityObj.value) parts.push(selectedCityObj.value.n)
  if (selectedDistrict.value) parts.push(selectedDistrict.value.n)
  if (parts.length > 0) return parts.join(' ')
  return ''
})

// 选择省份
const selectProvince = (provName) => {
  const entry = Object.entries(areaData).find(([, p]) => p.n === provName)
  if (entry) {
    selectedProvince.value = { code: entry[0], n: provName }
    selectedCityObj.value = null
    selectedDistrict.value = null
    currentLevel.value = 1
    // 选择省市区 → 取消选中
    selectedAddressId.value = null
  }
}

// 选择城市
const selectCity = (city) => {
  selectedCityObj.value = city
  selectedDistrict.value = null
  currentLevel.value = 2
}

// 选择区县
const selectDistrict = (dist) => {
  selectedDistrict.value = dist
  cityPickerVisible.value = false

  localStorage.setItem('city', JSON.stringify({
    province: selectedProvince.value,
    city: selectedCityObj.value,
    district: dist
  }))
}

// 清空
const clearCity = () => {
  selectedProvince.value = null
  selectedCityObj.value = null
  selectedDistrict.value = null
  currentLevel.value = 0

  localStorage.removeItem('city')
}

// 导航
const goAdmin = () => { router.push('/admin/news') }
const handleLogout = () => { userStore.logout(); router.push('/') }

onMounted(() => {
  // 加载用户收货地址
  loadUserAddresses()
})

// 登录状态变化时重新加载地址
watch(() => userStore.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    loadUserAddresses()
  } else {
    userAddresses.value = []
    selectedAddressId.value = null
  }
})
</script>

<style scoped>
.top-bar {
  background: #f7f7f7; border-bottom: 1px solid #eee;
  font-size: 13px; color: #999;
}
.top-inner {
  max-width: 1200px; margin: 0 auto; padding: 8px 20px;
  display: flex; justify-content: space-between; align-items: center;
}
.top-bar .right { display: flex; align-items: center; gap: 8px; }
.top-bar .divider { color: #ddd; }
.top-bar .link { color: #ff6600; cursor: pointer; }
.city-trigger { cursor: pointer; }

/* 地址选择器 */
/* .city-picker { max-height: 420px; overflow-y: auto; } */
.city-picker-header {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid #f0f0f0;
}
.picker-title { font-size: 14px; color: #333; font-weight: 500; }
.header-actions { display: flex; align-items: center; gap: 8px; }
.manage-link { font-size: 12px; color: #ff6600; text-decoration: none; }
.manage-link:hover { text-decoration: underline; }

/* 用户地址列表 */
.user-address-section {
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;     /* 滚动条 */
  margin-bottom: 4px;
}
/* 卡片 */
.user-address-item {
  position: relative;
  padding: 8px 12px;
  border: 2px solid #eee;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 6px;
  transition: all 0.2s;
  min-height: 48px;
  box-sizing: border-box;
}
.user-address-item:hover { border-color: #ffd4b8; }
.user-address-item.active { border-color: #ff6600; background: #fff5f0; }
.addr-info { padding-right: 20px; }
.addr-top { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
.addr-name { font-size: 13px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.addr-remark { font-size: 12px; color: #999; }
.addr-check { position: absolute; top: 10px; right: 10px; color: #ff6600; font-size: 16px; }
.user-address-empty { text-align: center; padding: 16px 0; color: #999; }
.user-address-empty p { font-size: 13px; margin-bottom: 10px; }

.city-divider {
  text-align: center; font-size: 12px; color: #ccc; padding: 8px 0 4px;
  position: relative; margin-bottom: 8px;
}
.city-divider::before {
  content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: #eee;
}
.city-divider span { background: #fff; position: relative; padding: 0 10px; }

.city-breadcrumb { display: flex; align-items: center; gap: 4px; padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid #f0f0f0; }
.city-breadcrumb span { font-size: 12px; color: #999; cursor: pointer; }
.city-breadcrumb span.active { color: #ff6600; font-weight: bold; }
.city-breadcrumb .sep { color: #ddd; cursor: default; }
.city-breadcrumb .city-clear { margin-left: auto; color: #ff6600; }
.city-list { max-height: 200px; overflow-y: auto; }
.city-group { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
.city-initial { color: #ff6600; font-weight: bold; width: 16px; flex-shrink: 0; }
.city-name { font-size: 12px; color: #666; cursor: pointer; padding: 2px 6px; border-radius: 3px; display: inline-block; margin-bottom: 4px; }
.city-name:hover { background: #fff5f0; color: #ff6600; }
.city-name.active { background: #ff6600; color: #fff; }
.city-empty { font-size: 12px; color: #ccc; }
</style>
