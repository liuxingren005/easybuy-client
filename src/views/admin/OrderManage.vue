<template>
  <div class="order-manage">
    <!-- 搜索区域 -->
    <div class="search-bar">
      <el-input v-model="queryParams.loginName" placeholder="用户名" clearable style="width: 180px" @keyup.enter="handleSearch"/>
      <el-input v-model="queryParams.serialNumber" placeholder="订单号" clearable style="width: 220px" @keyup.enter="handleSearch"/>
      <el-select v-model="queryParams.status" placeholder="订单状态" clearable style="width: 140px">
        <el-option label="待付款" :value="1" />
        <el-option label="已付款" :value="2" />
        <el-option label="已关闭" :value="3" />
        <el-option label="已退款" :value="4" />
      </el-select>
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
        start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD"
        style="width: 320px" />
      <el-button type="primary" @click="handleSearch">
        <el-icon><Search /></el-icon>查询
      </el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <!-- 数据表格 -->
    <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
      <el-table-column type="index" label="#" width="50" align="center" />
      <el-table-column prop="serialNumber" label="订单号" min-width="140">
        <template #default="{ row }">
          <span class="order-no">{{ row.serialNumber }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="loginName" label="用户名" width="120" />
      <el-table-column prop="userAddress" label="收货地址" min-width="120" show-overflow-tooltip />
      <el-table-column prop="cost" label="订单金额" width="100" align="right">
        <template #default="{ row }">
          <span class="cost">¥{{ Number(row.cost).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="订单状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="下单时间" width="160" align="center" />
      <el-table-column label="操作" width="180" align="center" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="viewDetail(row)">详情</el-button>
          <el-button v-if="row.status === 1" size="small" type="warning" link @click="handleClose(row)">关闭订单</el-button>
          <el-button v-if="row.status === 2" size="small" type="danger" link @click="handleRefund(row)">退款</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination" v-if="total > 0">
      <el-pagination v-model:current-page="queryParams.pageNum" v-model:page-size="queryParams.pageSize"
        :page-sizes="[5, 10, 20, 50]" :total="total" layout="total, sizes, prev, pager, next, jumper"
        background @size-change="loadData" @current-change="loadData" />
    </div>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="720px">
      <div v-if="currentOrder" class="order-detail">
        <div class="detail-row">
          <span class="label">订单号：</span>
          <span class="order-no">{{ currentOrder.serialNumber }}</span>
        </div>
        <div class="detail-row">
          <span class="label">用户名：</span>
          <span>{{ currentOrder.loginName }}</span>
        </div>
        <div class="detail-row">
          <span class="label">收货地址：</span>
          <span>{{ currentOrder.userAddress }}</span>
        </div>
        <div class="detail-row">
          <span class="label">订单金额：</span>
          <span class="cost">¥{{ Number(currentOrder.cost).toFixed(2) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">订单状态：</span>
          <el-tag :type="statusTagType(currentOrder.status)" size="small">
            {{ statusText(currentOrder.status) }}
          </el-tag>
        </div>
        <div class="detail-row">
          <span class="label">下单时间：</span>
          <span>{{ currentOrder.createTime }}</span>
        </div>

        <div class="detail-title">订单明细</div>
        <el-table :data="currentOrder.orderDetailList || []" border size="small">
          <el-table-column type="index" label="#" width="50" align="center" />
          <el-table-column prop="productId" label="商品ID" width="220" align="center" />
          <el-table-column prop="quantity" label="数量" width="160" align="center" />
          <el-table-column prop="cost" label="小计" min-width="160" align="right">
            <template #default="{ row }">
              ¥{{ Number(row.cost).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import orderApi from '@/api/order'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const dateRange = ref([])
const detailVisible = ref(false)
const currentOrder = ref(null)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  loginName: '',
  serialNumber: '',
  status: null
})

// 状态文本
const statusText = (status) => {
  const map = { 1: '待付款', 2: '已付款', 3: '已关闭', 4: '已退款' }
  return map[status] || '未知'
}

// 状态标签类型
const statusTagType = (status) => {
  const map = { 1: 'warning', 2: 'success', 3: 'info', 4: 'danger' }
  return map[status] || 'info'
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
      loginName: queryParams.loginName || undefined,
      serialNumber: queryParams.serialNumber || undefined,
      status: queryParams.status ?? undefined,
      startTime: dateRange.value?.[0] || undefined,
      endTime: dateRange.value?.[1] || undefined
    }
    const res = await orderApi.getPage(params)
    tableData.value = res.page.list || []
    total.value = res.page.total || 0
  } catch (e) {
  } finally {
    loading.value = false
  }
}

// 查询
const handleSearch = () => {
  queryParams.pageNum = 1
  loadData()
}

// 重置
const handleReset = () => {
  queryParams.loginName = ''
  queryParams.serialNumber = ''
  queryParams.status = null
  dateRange.value = []
  queryParams.pageNum = 1
  loadData()
}

// 查看详情
const viewDetail = async (row) => {
  try {
    const res = await orderApi.getById(row.id)
    currentOrder.value = res.data
    detailVisible.value = true
  } catch (e) {
  }
}

// 关闭订单
const handleClose = (row) => {
  ElMessageBox.confirm(`确定要关闭订单「${row.serialNumber}」吗？`, '关闭确认', {
    type: 'warning'
  }).then(async () => {
    try {
      await orderApi.close(row.id)
      ElMessage.success('订单已关闭')
      loadData()
    } catch (e) {
    }
  }).catch(() => {})
}

// 退款
const handleRefund = (row) => {
  ElMessageBox.confirm(`确定要对订单「${row.serialNumber}」进行退款吗？`, '退款确认', {
    type: 'warning'
  }).then(async () => {
    try {
      await orderApi.refund(row.id)
      ElMessage.success('退款成功')
      loadData()
    } catch (e) {
    }
  }).catch(() => {})
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.order-no {
  color: #ff6600;
  font-weight: bold;
}

.cost {
  color: #ff4e00;
  font-weight: bold;
}

.order-detail {
  padding: 10px 0;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
}

.detail-row .label {
  color: #666;
  width: 90px;
  flex-shrink: 0;
}

.detail-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin: 20px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}
</style>
