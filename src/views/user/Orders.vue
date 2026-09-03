<template>
  <div class="orders-page">
    <h2 class="page-title">我的订单</h2>

    <!-- 搜索区域 -->
    <div class="search-bar">
      <el-input v-model="queryParams.serialNumber" placeholder="请输入订单号" clearable style="width: 260px" @keyup.enter="handleSearch">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="queryParams.status" placeholder="订单状态" clearable style="width: 140px">
        <el-option label="待付款" :value="1" />
        <el-option label="已付款" :value="2" />
        <el-option label="已关闭" :value="3" />
        <el-option label="已退款" :value="4" />
      </el-select>
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
        start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD"
        style="width: 300px" />
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <!-- 暂无数据 -->
    <el-empty v-if="!loading && total === 0" description="暂无订单数据" />

    <!-- 订单列表 -->
    <div v-else class="order-list">
      <div v-for="order in tableData" :key="order.id" class="order-card">
        <!-- 订单头部 -->
        <div class="order-header">
          <div class="order-header-left">
            <span class="order-time">{{ order.createTime }}</span>
            <span class="order-no">订单号：{{ order.serialNumber }}</span>
          </div>
          <el-tag :type="statusTagType(order.status)" size="small" effect="light">
            {{ statusText(order.status) }}
          </el-tag>
        </div>

        <!-- 订单内容 -->
        <div class="order-body">
          <div class="order-info">
            <div class="info-item">
              <span class="label">收货地址：</span>
              <span class="value">{{ order.userAddress }}</span>
            </div>
            <div class="info-item">
              <span class="label">用户名：</span>
              <span class="value">{{ order.loginName }}</span>
            </div>
          </div>
          <div class="order-amount">
            <span class="amount-label">订单金额</span>
            <span class="amount-value">¥{{ Number(order.cost).toFixed(2) }}</span>
          </div>
        </div>

        <!-- 订单操作 -->
        <div class="order-footer">
          <el-button size="small" @click="viewDetail(order)">查看详情</el-button>
          <el-button v-if="order.status === 1" size="small" type="primary" @click="handlePay(order)">
            立即付款
          </el-button>
          <el-button v-if="order.status === 1" size="small" type="danger" plain @click="handleClose(order)">
            取消订单
          </el-button>
          <el-button v-if="order.status === 2" size="small" type="warning" plain @click="handleRefund(order)">
            申请退款
          </el-button>
          <el-button v-if="order.status === 3" size="small" type="danger" plain @click="handleDelete(order)">
            删除订单
          </el-button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="total > 0">
      <el-pagination v-model:current-page="queryParams.pageNum" v-model:page-size="queryParams.pageSize"
        :page-sizes="[5, 10, 20]" :total="total" layout="total, prev, pager, next, jumper"
        background @size-change="loadData" @current-change="loadData" />
    </div>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="680px">
      <div v-if="currentOrder" class="order-detail">
        <div class="detail-row">
          <span class="label">订单号：</span>
          <span class="order-no">{{ currentOrder.serialNumber }}</span>
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

        <div class="detail-title">商品明细</div>
        <el-table :data="currentOrder.orderDetailList || []" border size="small">
          <el-table-column type="index" label="#" width="50" align="center" />
          <el-table-column prop="productId" label="商品编号" width="120" align="center" />
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
        <el-button v-if="currentOrder && currentOrder.status === 1" type="primary" @click="handlePayFromDetail">
          立即付款
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import orderApi from '@/api/order'
import { useRouter } from 'vue-router'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const dateRange = ref([])
const detailVisible = ref(false)
const currentOrder = ref(null)
const router = useRouter()

const queryParams = reactive({
  pageNum: 1,
  pageSize: 5,
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
      serialNumber: queryParams.serialNumber || undefined,
      status: queryParams.status ?? undefined,
      startTime: dateRange.value?.[0] || undefined,
      endTime: dateRange.value?.[1] || undefined
    }
    const res = await orderApi.getMyPage(params)
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

// 支付订单 - 跳转到支付页面
const handlePay = (row) => {
  router.push(`/pay/${row.id}`)
}

// 详情弹窗支付
const handlePayFromDetail = async () => {
  if (!currentOrder.value) return
  detailVisible.value = false
  router.push(`/pay/${currentOrder.value.id}`)
}

// 关闭/取消订单
const handleClose = (row) => {
  ElMessageBox.confirm(`确定要取消订单「${row.serialNumber}」吗？`, '取消确认', {
    type: 'warning'
  }).then(async () => {
    try {
      await orderApi.close(row.id)
      ElMessage.success('订单已取消')
      loadData()
    } catch (e) {
    }
  }).catch(() => {})
}

// 退款
const handleRefund = (row) => {
  ElMessageBox.confirm(`确定要对订单「${row.serialNumber}」申请退款吗？`, '退款确认', {
    type: 'warning'
  }).then(async () => {
    try {
      await orderApi.refund(row.id)
      ElMessage.success('退款申请已提交')
      loadData()
    } catch (e) {
    }
  }).catch(() => {})
}

// 删除订单
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除订单「${row.serialNumber}」吗？删除后不可恢复。`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      await orderApi.remove(row.id)
      ElMessage.success('删除成功')
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
.orders-page {
  padding: 10px;
}

.page-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
  border-left: 4px solid #ff6600;
  padding-left: 10px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  border: 1px solid #eee;
  border-radius: 6px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.order-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #f5f5f5;
  border-bottom: 1px solid #eee;
}

.order-header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 13px;
  color: #666;
}

.order-time {
  color: #999;
}

.order-no {
  color: #333;
  font-weight: bold;
}

.order-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
}

.order-info {
  flex: 1;
}

.info-item {
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: #999;
}

.info-item .value {
  color: #333;
}

.order-amount {
  text-align: right;
  padding-left: 20px;
}

.amount-label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.amount-value {
  font-size: 22px;
  font-weight: bold;
  color: #ff4e00;
}

.order-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid #eee;
  background: #fafafa;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: center;
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

.cost {
  color: #ff4e00;
  font-weight: bold;
  font-size: 16px;
}
</style>
