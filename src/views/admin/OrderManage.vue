<template>
  <div class="order-manage">
    <!-- 搜索区域 -->
    <div class="search-bar">
      <el-input v-model="queryParams.loginName" placeholder="用户名" clearable style="width: 180px"
        @keyup.enter="handleSearch" />
      <el-input v-model="queryParams.serialNumber" placeholder="订单号" clearable style="width: 220px"
        @keyup.enter="handleSearch" />
      <el-select v-model="queryParams.status" placeholder="订单状态" clearable style="width: 140px">
        <el-option label="待付款" :value="1" />
        <el-option label="已付款" :value="2" />
        <el-option label="已关闭" :value="3" />
        <el-option label="已退款" :value="4" />
        <el-option label="部分退款" :value="5" />
      </el-select>
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
        end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 320px" />
      <el-button type="primary" @click="handleSearch">
        <el-icon>
          <Search />
        </el-icon>查询
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
      <el-table-column prop="cost" label="订单金额" width="110" align="right">
        <template #default="{ row }">
          <span class="cost">¥{{ Number(row.cost).toFixed(2) }}</span>
          <div v-if="Number(row.refundedAmount) > 0" class="refund-text">
            已退 ¥{{ Number(row.refundedAmount).toFixed(2) }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="订单状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="payType" label="支付方式" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="payTypeTagType(row.payType)" size="small">
            {{ payTypeLabel(row.payType, row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="下单时间" width="160" align="center" />
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="viewDetail(row)">详情</el-button>
          <el-button v-if="row.status === 1" size="small" type="warning" link @click="handleClose(row)">关闭订单</el-button>
          <el-button v-if="row.status === 2 || row.status === 5" size="small" type="danger" link
            @click="handleRefund(row)">
            {{ row.status === 5 ? '继续退款' : '退款' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination" v-if="total > 0">
      <el-pagination v-model:current-page="queryParams.pageNum" v-model:page-size="queryParams.pageSize"
        :page-sizes="[5, 10, 20, 50]" :total="total" layout="total, sizes, prev, pager, next, jumper" background
        @size-change="loadData" @current-change="loadData" />
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
        <div class="detail-row" v-if="Number(currentOrder.refundedAmount) > 0">
          <span class="label">累计退款：</span>
          <span class="refund-text">¥{{ Number(currentOrder.refundedAmount).toFixed(2) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">订单状态：</span>
          <el-tag :type="statusTagType(currentOrder.status)" size="small">
            {{ statusText(currentOrder.status) }}
          </el-tag>
        </div>
        <div class="detail-row">
          <span class="label">支付方式：</span>
          <el-tag :type="payTypeTagType(currentOrder.payType)" size="small">
            {{ payTypeLabel(currentOrder.payType, currentOrder.status) }}
          </el-tag>
        </div>
        <div class="detail-row">
          <span class="label">下单时间：</span>
          <span>{{ currentOrder.createTime }}</span>
        </div>

        <div class="detail-title">订单明细</div>
        <el-table :data="currentOrder.orderDetailList || []" border size="small">
          <el-table-column type="index" label="#" width="50" align="center" />
          <el-table-column label="商品" min-width="220">
            <template #default="{ row }">
              {{ row.productName || `商品#${row.productId}` }}
            </template>
          </el-table-column>
          <el-table-column label="数量" width="120" align="center">
            <template #default="{ row }">
              {{ row.quantity }}
              <div v-if="row.refundedQuantity > 0" class="refund-qty">已退 {{ row.refundedQuantity }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="cost" label="小计" width="140" align="right">
            <template #default="{ row }">
              ¥{{ Number(row.cost).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>

        <!-- 退款记录（部分退款/已退款） -->
        <template v-if="refundRecords.length">
          <div class="detail-title">退款记录</div>
          <el-table :data="refundRecords" border size="small">
            <el-table-column type="index" label="#" width="50" align="center" />
            <el-table-column prop="createTime" label="退款时间" width="170" align="center" />
            <el-table-column prop="amount" label="退款金额" width="120" align="right">
              <template #default="{ row }">
                <span class="refund-text">¥{{ Number(row.amount).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="退款原因" min-width="160">
              <template #default="{ row }">{{ row.reason || '-' }}</template>
            </el-table-column>
            <el-table-column prop="refundNo" label="退款单号" min-width="180" />
          </el-table>
        </template>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 退款弹窗（支持按商品数量部分退款） -->
    <el-dialog v-model="refundVisible" title="订单退款" width="680px">
      <div v-if="refundOrder" class="refund-dialog">
        <div class="refund-summary">
          订单号：<b>{{ refundOrder.serialNumber }}</b>
          ｜ 订单金额 <b>¥{{ Number(refundOrder.cost).toFixed(2) }}</b>
          <span v-if="Number(refundOrder.refundedAmount) > 0">
            ｜ 已退 <b class="refund-text">¥{{ Number(refundOrder.refundedAmount).toFixed(2) }}</b>
          </span>
        </div>
        <el-table :data="refundItems" border size="small" class="refund-table">
          <el-table-column label="商品" min-width="200">
            <template #default="{ row }">
              {{ row.productName || `商品#${row.productId}` }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="购买数量" width="90" align="center" />
          <el-table-column label="已退数量" width="90" align="center">
            <template #default="{ row }">{{ row.refundedQuantity || 0 }}</template>
          </el-table-column>
          <el-table-column label="退款数量" width="150" align="center">
            <template #default="{ row }">
              <el-input-number v-model="row.refundQty" :min="0" :max="remainingQty(row)" :step="1" size="small"
                style="width: 130px" />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="110" align="right">
            <template #default="{ row }">¥{{ Number(row.cost).toFixed(2) }}</template>
          </el-table-column>
        </el-table>
        <el-form label-width="80px" style="margin-top: 16px">
          <el-form-item label="退款原因">
            <el-input v-model="refundReason" placeholder="请输入退款原因（可选）" maxlength="100" />
          </el-form-item>
          <el-form-item label="退款金额">
            <span class="refund-total">¥{{ estimatedRefundAmount.toFixed(2) }}</span>
            <span class="refund-hint" v-if="finalRefundIncludesFreight">
              （最后一次退款将订单剩余金额含运费一并退回）
            </span>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="refundVisible = false">取消</el-button>
        <el-button type="danger" :loading="refundSubmitting" @click="submitRefund">确认退款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import orderApi from '@/api/order'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const dateRange = ref([])
const detailVisible = ref(false)
const currentOrder = ref(null)
// 退款记录（详情弹窗）
const refundRecords = ref([])
// 退款弹窗
const refundVisible = ref(false)
const refundOrder = ref(null)
const refundItems = ref([])
const refundReason = ref('')
const refundSubmitting = ref(false)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  loginName: '',
  serialNumber: '',
  status: null
})

// 状态文本
const statusText = (status) => {
  const map = { 1: '待付款', 2: '已付款', 3: '已关闭', 4: '已退款', 5: '部分退款' }
  return map[status] || '未知'
}

// 状态标签类型
const statusTagType = (status) => {
  const map = { 1: 'warning', 2: 'success', 3: 'info', 4: 'danger', 5: 'warning' }
  return map[status] || 'info'
}

// 支付方式文本
const payTypeText = (payType) => {
  const map = { 1: '支付宝', 2: '微信支付' }
  return map[payType] || '未知'
}

// 支付方式标签类型
const payTypeTagType = (payType) => {
  const map = { 1: 'primary', 2: 'success' }
  return map[payType] || 'info'
}

// 支付方式显示文案
const payTypeLabel = (payType, status) => {
  if (payType) return payTypeText(payType)
  if (status === 2 || status === 4 || status === 5) return '未知'
  return '未支付'
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
    refundRecords.value = []
    detailVisible.value = true
    // 部分退款/已退款订单加载退款记录
    if (res.data.status === 4 || res.data.status === 5) {
      try {
        const r = await orderApi.getRefunds(row.id)
        refundRecords.value = r.list || []
      } catch (e) {
      }
    }
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
  }).catch(() => { })
}

// 明细剩余可退数量
const remainingQty = (row) => row.quantity - (row.refundedQuantity || 0)

// 本次商品退款金额（单价×退款数量）
const goodsRefundAmount = computed(() =>
  refundItems.value.reduce((sum, it) =>
    sum + (Number(it.cost) / it.quantity) * (it.refundQty || 0), 0)
)

// 本次退款后是否所有商品均退
const allItemsFullyRefunded = computed(() => {
  const list = refundOrder.value?.orderDetailList || []
  return list.length > 0 && list.every(d =>
    (d.refundedQuantity || 0) + (refundItems.value.find(i => i.id === d.id)?.refundQty || 0) >= d.quantity)
})

// 预计退款金额：最后一次退款退订单剩余全部金额（运费），否则按商品金额
const estimatedRefundAmount = computed(() => {
  if (!refundOrder.value) return 0
  if (allItemsFullyRefunded.value) {
    return Number(refundOrder.value.cost) - Number(refundOrder.value.refundedAmount || 0)
  }
  return goodsRefundAmount.value
})

// 是否最后一次退款（用于提示）
const finalRefundIncludesFreight = computed(() =>
  allItemsFullyRefunded.value &&
  estimatedRefundAmount.value - goodsRefundAmount.value > 0.01
)

// 打开退款弹窗
const handleRefund = async (row) => {
  try {
    const res = await orderApi.getById(row.id)
    const order = res.data
    refundOrder.value = order
    // 默认全部退款
    refundItems.value = (order.orderDetailList || [])
      .filter(d => remainingQty(d) > 0)
      .map(d => ({ ...d, refundQty: remainingQty(d) }))
    refundReason.value = ''
    refundVisible.value = true
  } catch (e) {
  }
}

// 提交退款
const submitRefund = () => {
  if (!refundOrder.value) return
  const items = refundItems.value.filter(it => it.refundQty > 0)
  if (items.length === 0) {
    ElMessage.warning('请选择至少一件退款商品')
    return
  }
  ElMessageBox.confirm(
    `确认退款 ¥${estimatedRefundAmount.value.toFixed(2)} 吗？退款将原路退回。`,
    '退款确认', { type: 'warning' }
  ).then(async () => {
    refundSubmitting.value = true
    try {
      await orderApi.refund(refundOrder.value.id, {
        items: items.map(it => ({ orderDetailId: it.id, quantity: it.refundQty })),
        reason: refundReason.value || undefined
      })
      ElMessage.success('退款成功')
      refundVisible.value = false
      loadData()
    } catch (e) {
    } finally {
      refundSubmitting.value = false
    }
  }).catch(() => { })
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

/* 退款 */
.refund-text {
  color: #f56c6c;
  font-weight: bold;
  font-size: 12px;
}

.refund-qty {
  font-size: 12px;
  color: #f56c6c;
}

.refund-dialog .refund-summary {
  margin-bottom: 14px;
  padding: 10px 14px;
  background: #fafafa;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
}

.refund-total {
  color: #f56c6c;
  font-weight: bold;
  font-size: 18px;
}

.refund-hint {
  margin-left: 10px;
  font-size: 12px;
  color: #999;
}
</style>
