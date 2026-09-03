<template>
  <div class="news-manage">
    <!-- 搜索区域 -->
    <div class="search-bar">
      <el-input v-model="queryParams.title" placeholder="标题" clearable style="width: 200px" @keyup.enter="handleSearch"/>
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
        start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD"
        style="width: 320px" />
      <el-button type="primary" @click="handleSearch">
        <el-icon><Search /></el-icon>查询
      </el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="success" @click="openDialog(null)">
        <el-icon><Plus /></el-icon>新增资讯
      </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
      <el-table-column type="index" label="#" width="50" align="center" />
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip />
      <el-table-column prop="createTime" label="创建时间" width="140" align="center" />
      <el-table-column label="操作" width="160" align="center" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination" v-if="total > 0">
      <el-pagination v-model:current-page="queryParams.pageNum" v-model:page-size="queryParams.pageSize"
        :page-sizes="[5, 10, 20, 50]" :total="total" layout="total, sizes, prev, pager, next, jumper"
        background @size-change="loadData" @current-change="loadData" />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingNews.id ? '编辑资讯' : '新增资讯'" width="640px">
      <el-form ref="newsFormRef" :model="editingNews" :rules="formRules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="editingNews.title" placeholder="请输入资讯标题" />
        </el-form-item>
        <el-form-item label="创建时间" prop="createTime">
          <el-date-picker v-model="editingNews.createTime" type="date" placeholder="选择日期"
            value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="editingNews.content" type="textarea" :rows="6" placeholder="请输入资讯内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import newsApi from '@/api/news'

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const dateRange = ref([])
const dialogVisible = ref(false)
const newsFormRef = ref()

const queryParams = reactive({
  pageNum: 1,
  pageSize: 5,
  title: ''
})

const editingNews = reactive({
  id: null,
  title: '',
  content: '',
  createTime: ''
})

const formRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

// 加载
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
      title: queryParams.title || undefined,
      startTime: dateRange.value?.[0] || undefined,
      endTime: dateRange.value?.[1] || undefined
    }
    const res = await newsApi.getPage(params)
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
  queryParams.title = ''
  dateRange.value = []
  queryParams.pageNum = 1
  loadData()
}

// 打开弹窗
const openDialog = (row) => {
  if (row) {
    Object.assign(editingNews, row)
  } else {
    Object.assign(editingNews, {
      id: null,
      title: '',
      content: '',
      createTime: ''
    })
  }
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  await newsFormRef.value.validate(async (valid) => {
    if (!valid) return

    submitLoading.value = true
    try {
      if (editingNews.id) {
        await newsApi.update({ ...editingNews })
        ElMessage.success('修改成功')
      } else {
        await newsApi.add({ ...editingNews })
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      loadData()
    } catch (e) {

    } finally {
      submitLoading.value = false
    }
  })
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除资讯「${row.title}」吗？`, '删除确认', {
    type: 'warning'
  }).then(async () => {
    try {
      await newsApi.remove(row.id)
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
</style>
