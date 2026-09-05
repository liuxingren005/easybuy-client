<template>
  <div class="addresses-page">
    <h2 class="page-title">收货地址</h2>

    <!-- 地址统计 -->
    <div class="limit-tip">
      <span>已添加 {{ addressList.length }} / 16 个地址</span>
      <el-button v-if="addressList.length < 16" type="primary" size="small" @click="openDialog()">
        <el-icon>
          <Plus />
        </el-icon>新增地址
      </el-button>
    </div>

    <!-- 暂无数据 -->
    <el-empty v-if="!loading && addressList.length === 0" description="暂无收货地址">
      <el-button type="primary" @click="openDialog()">新增收货地址</el-button>
    </el-empty>

    <!-- 地址列表 -->
    <div v-else class="address-grid">
      <div v-for="addr in addressList" :key="addr.id" class="address-card" :class="{ default: addr.isDefault === 1 }">
        <div class="card-header">
          <div class="address-text">
            <el-tag v-if="addr.isDefault === 1" size="small" type="warning" effect="plain" class="default-tag">
              默认
            </el-tag>
            <span class="address-detail">{{ addr.address }}</span>
          </div>
        </div>
        <div class="card-remark" v-if="addr.remark">
          <span class="label">备注：</span>{{ addr.remark }}
        </div>
        <div class="card-footer">
          <span class="create-time">{{ addr.createTime }}</span>
          <div class="actions">
            <el-button v-if="addr.isDefault !== 1" link type="primary" size="small"
              @click="handleSetDefault(addr)">设为默认</el-button>
            <el-button link type="primary" size="small" @click="openDialog(addr)">修改</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(addr)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/修改地址弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '修改地址' : '新增地址'" width="520px" @close="resetForm">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="所在地区" prop="region">
          <el-cascader v-model="form.region" :options="cascaderOptions" :props="cascaderProps" placeholder="请选择省/市/区"
            style="width: 100%" />
        </el-form-item>
        <el-form-item label="详细地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入详细地址（街道、门牌号...）" type="textarea" :rows="2" maxlength="200"
            show-word-limit />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" placeholder="备注（可选，如公司、家...）" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="默认地址">
          <el-switch v-model="form.isDefault" :active-value="1" :inactive-value="0" />
          <span class="switch-tip">{{ form.isDefault === 1 ? '保存后将设为默认地址' : '' }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import userAddressApi from '@/api/userAddress'
import { useUserStore } from '@/stores/user'
import { useAddress } from '@/composables/useAddress'

const route = useRoute()
const userStore = useUserStore()
const { cascaderOptions } = useAddress()

const loading = ref(false)
const addressList = ref([])
const dialogVisible = ref(false)
const isEdit = computed(() => !!form.id)
const formRef = ref(null)

// 表单数据
const form = reactive({
  id: null,
  region: [], // [省, 市, 区] 编码
  address: '', // 地址（省市区 + 详细地址）
  remark: '',
  isDefault: 0
})

// 级联选择器
const cascaderProps = {
  expandTrigger: 'hover',
  value: 'value',
  label: 'label',
  children: 'children'
}

// 表单校验
const rules = {
  region: [
    { type: 'array', required: true, message: '请选择省/市/区', trigger: 'change' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, max: 200, message: '地址长度在 5-200 个字符', trigger: 'blur' }
  ]
}

// 根据地区编码数组获取名称路径
function getRegionLabels(codes) {
  if (!codes || codes.length === 0) return ''
  let labels = []
  let level = cascaderOptions.value
  for (const code of codes) {
    const found = level.find(n => n.value === code)
    if (!found) break
    labels.push(found.label)
    level = found.children || []
  }
  return labels.join(' ')
}

// 加载地址列表
async function loadData() {
  if (!userStore.userInfo) return
  loading.value = true
  try {
    const res = await userAddressApi.findByUserId(userStore.userInfo.id)
    addressList.value = res.list || []
  } catch (e) {
  } finally {
    loading.value = false
  }
}

// 打开弹窗（新增/修改）
function openDialog(row) {
  if (row) {
    // 修改模式
    form.id = row.id
    form.region = []
    form.address = row.address
    form.remark = row.remark || ''
    form.isDefault = row.isDefault || 0
    isEdit.value = true
  } else {
    // 新增模式
    if (addressList.value.length >= 16) {
      ElMessage.warning('地址数量已达上限（最多16个）')
      return
    }
    resetForm()
    form.isDefault = addressList.value.length === 0 ? 1 : 0
  }
  dialogVisible.value = true
}

// 重置表单
function resetForm() {
  form.id = null
  form.region = []
  form.address = ''
  form.remark = ''
  form.isDefault = 0
  formRef.value?.resetFields()
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      // 组装地址（省市区 + 详细地址）
      const regionPart = getRegionLabels(form.region)
      const fullAddress = regionPart ? `${regionPart} ${form.address.trim()}` : form.address.trim()

      const data = {
        userId: userStore.userInfo.id,
        address: fullAddress,
        remark: form.remark,
        isDefault: form.isDefault
      }

      if (isEdit.value) {
        data.id = form.id
        await userAddressApi.update(data)
        ElMessage.success('地址修改成功')
      } else {
        await userAddressApi.add(data)
        ElMessage.success('地址添加成功')
      }
      dialogVisible.value = false
      loadData()
    } catch (e) {
    }
  })
}

// 设为默认地址
async function handleSetDefault(row) {
  try {
    await userAddressApi.setDefault(row.id, userStore.userInfo.id)
    ElMessage.success('已设为默认地址')
    loadData()
  } catch (e) {
  }
}

// 删除地址
function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除该地址吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      await userAddressApi.remove(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {
    }
  }).catch(() => { })
}

onMounted(() => {
  loadData()
  // 如果从首页"新增地址"跳转，自动打开弹窗并预填
  const { provCode, cityCode, distCode } = route.query
  if (provCode) {
    const region = [provCode]
    if (cityCode) region.push(cityCode)
    if (distCode) region.push(distCode)
    // 列表加载完再开弹窗
    setTimeout(() => {
      if (addressList.value.length >= 16) {
        ElMessage.warning('地址数量已达上限（最多16个）')
        return
      }
      resetForm()
      form.region = region
      form.isDefault = addressList.value.length === 0 ? 1 : 0
      dialogVisible.value = true
    }, 100)
  }
})
</script>

<style scoped>
.addresses-page {
  padding: 10px;
}

.page-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 16px;
  border-left: 4px solid #ff6600;
  padding-left: 10px;
}

.limit-tip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #fafafa;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #666;
}

.address-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.address-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
  position: relative;
}

.address-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-color: #ffd4b8;
}

.address-card.default {
  border-color: #ff6600;
  background: #fff5f0;
}

.card-header {
  margin-bottom: 8px;
}

.address-text {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.default-tag {
  flex-shrink: 0;
  margin-top: 2px;
}

.address-detail {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  word-break: break-all;
}

.card-remark {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.card-remark .label {
  color: #bbb;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px dashed #eee;
}

.create-time {
  font-size: 12px;
  color: #bbb;
}

.actions {
  display: flex;
  gap: 4px;
}

.switch-tip {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}
</style>
