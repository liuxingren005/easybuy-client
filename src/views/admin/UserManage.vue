<template>
  <div class="user-manage">
    <!-- 搜索区域 -->
    <div class="search-bar">
      <el-input v-model="queryParams.loginName" placeholder="登录名" clearable style="width: 200px"
        @keyup.enter="handleSearch" />
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
      <el-table-column prop="loginName" label="登录名" width="120" />
      <el-table-column prop="userName" label="昵称" width="90" />
      <el-table-column prop="sex" label="性别" width="80" align="center">
        <template #default="{ row }">
          {{ row.sex === 1 ? '男' : '女' }}
        </template>
      </el-table-column>
      <el-table-column prop="email" label="邮箱" min-width="100" show-overflow-tooltip />
      <el-table-column prop="mobile" label="手机号" width="120" />
      <el-table-column prop="type" label="类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.type === 1 ? 'danger' : 'primary'" size="small">
            {{ row.type === 1 ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="140" align="center" />
      <el-table-column label="操作" width="160" align="center" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" link @click="handleDelete(row)"
            :disabled="row.type === 1">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination" v-if="total > 0">
      <el-pagination v-model:current-page="queryParams.pageNum" v-model:page-size="queryParams.pageSize"
        :page-sizes="[5, 10, 20, 50]" :total="total" layout="total, sizes, prev, pager, next, jumper" background
        @size-change="loadData" @current-change="loadData" />
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" title="编辑用户" width="520px">
      <el-form ref="userFormRef" :model="editingUser" :rules="formRules" label-width="100px">
        <el-form-item label="登录名">
          <el-input :model-value="editingUser.loginName" disabled>
            <template #append>
              <span class="hint">登录名不可修改</span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="昵称" prop="userName">
          <el-input v-model="editingUser.userName" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input v-model="editingUser.password" type="password" show-password placeholder="留空则不修改密码" />
        </el-form-item>
        <el-form-item label="性别" prop="sex">
          <el-radio-group v-model="editingUser.sex">
            <el-radio :label="1">男</el-radio>
            <el-radio :label="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="身份证号" prop="identityCode">
          <el-input v-model="editingUser.identityCode" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editingUser.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="editingUser.mobile" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="editingUser.type" style="width: 100%">
            <el-option label="普通用户" :value="0" />
            <el-option label="管理员" :value="1" />
          </el-select>
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
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import userApi from '@/api/user'

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const dateRange = ref([])
const dialogVisible = ref(false)
const userFormRef = ref()

const queryParams = reactive({
  pageNum: 1,
  pageSize: 5,
  loginName: ''
})

const editingUser = reactive({
  id: null,
  loginName: '',
  userName: '',
  password: '',
  sex: 1,
  identityCode: '',
  email: '',
  mobile: '',
  type: 0
})

const formRules = {
  userName: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  mobile: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

// 加载
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
      loginName: queryParams.loginName || undefined,
      startTime: dateRange.value?.[0] || undefined,
      endTime: dateRange.value?.[1] || undefined
    }
    const res = await userApi.getPage(params)
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
  dateRange.value = []
  queryParams.pageNum = 1
  loadData()
}

// 打开编辑弹窗
const openDialog = (row) => {
  Object.assign(editingUser, {
    id: row.id,
    loginName: row.loginName,
    userName: row.userName,
    password: '',
    sex: row.sex,
    identityCode: row.identityCode || '',
    email: row.email || '',
    mobile: row.mobile || '',
    type: row.type
  })
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  await userFormRef.value.validate(async (valid) => {
    if (!valid) return

    submitLoading.value = true
    try {
      const updateData = {
        id: editingUser.id,
        userName: editingUser.userName,
        sex: editingUser.sex,
        identityCode: editingUser.identityCode,
        email: editingUser.email,
        mobile: editingUser.mobile,
        type: editingUser.type
      }
      // 密码一并更新
      if (editingUser.password) {
        updateData.password = editingUser.password
      }
      await userApi.update(updateData)
      ElMessage.success('修改成功')
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
  ElMessageBox.confirm(`确定要删除用户「${row.loginName}」吗？`, '删除确认', {
    type: 'warning'
  }).then(async () => {
    try {
      await userApi.remove(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {

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

.hint {
  font-size: 12px;
  color: #999;
}
</style>
