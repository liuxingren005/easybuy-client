<template>
  <div class="product-manage">
    <!-- 搜索区域 -->
    <div class="search-bar">
      <el-input v-model="queryParams.name" placeholder="商品名称" clearable style="width: 200px" @keyup.enter="handleSearch"/>
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
        start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD"
        style="width: 320px" />
      <el-button type="primary" @click="handleSearch">
        <el-icon><Search /></el-icon>查询
      </el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="success" @click="openDialog(null)">
        <el-icon><Plus /></el-icon>添加商品
      </el-button>
      <el-button type="warning" plain @click="handleRebuildIndex">
        <el-icon><Refresh /></el-icon>同步ES索引
      </el-button>
    </div>

    <!-- 数据表格：按创建时间倒序 -->
    <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
      <el-table-column type="index" label="#" width="50" align="center" />
      <el-table-column label="图片" width="90" align="center">
        <template #default="{ row }">
          <img v-if="row.fileName" :src="productApi.imageUrl(row.fileName)" class="product-thumb" />
          <el-icon v-else size="32" color="#ddd"><Picture /></el-icon>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="商品名称" min-width="140" show-overflow-tooltip />
      <el-table-column prop="price" label="价格" width="100" align="right">
        <template #default="{ row }">
          <span class="price">￥{{ Number(row.price || 0).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="80" align="center" />
      <el-table-column label="分类" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">{{ categoryName(row) }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="140" align="center">
        <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
      </el-table-column>
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

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingProduct.id ? '编辑商品' : '添加商品'" width="680px">
      <el-form ref="productFormRef" :model="editingProduct" :rules="formRules" label-width="100px">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="editingProduct.name" placeholder="请输入商品名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="商品分类" prop="categoryLevel1Id">
          <div class="category-select">
            <el-select v-model="editingProduct.categoryLevel1Id" placeholder="一级分类"
              style="width: 150px" @change="onLevel1Change">
              <el-option v-for="c in categoryTree" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
            <el-select v-model="editingProduct.categoryLevel2Id" placeholder="二级分类"
              style="width: 150px" :disabled="!editingProduct.categoryLevel1Id" @change="onLevel2Change">
              <el-option v-for="c in level2Options" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
            <el-select v-model="editingProduct.categoryLevel3Id" placeholder="三级分类（可选）"
              style="width: 150px" :disabled="!editingProduct.categoryLevel2Id">
              <el-option v-for="c in level3Options" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="editingProduct.price" :min="0" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="editingProduct.stock" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="商品图片">
          <!-- 图片上传到 SFTP 文件服务器 -->
          <el-upload class="image-uploader" :show-file-list="false" accept="image/*"
            :before-upload="beforeUpload" :http-request="customUpload">
            <img v-if="editingProduct.fileName" :src="productApi.imageUrl(editingProduct.fileName)"
              class="uploaded-image" />
            <div v-else class="upload-placeholder">
              <el-icon size="24"><Plus /></el-icon>
              <span>上传图片</span>
            </div>
          </el-upload>
          <span class="upload-hint">支持 jpg/png/gif，大小不超过 5MB</span>
        </el-form-item>
        <el-form-item label="商品描述">
          <el-input v-model="editingProduct.description" type="textarea" :rows="3"
            placeholder="请输入商品描述" maxlength="500" show-word-limit />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, Plus, Refresh, Picture } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import productApi from '@/api/product'
import categoryApi from '@/api/category'

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const dateRange = ref([])
const dialogVisible = ref(false)
const productFormRef = ref()
const categoryTree = ref([])

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: ''
})

const editingProduct = reactive({
  id: null,
  name: '',
  description: '',
  price: 0,
  stock: 0,
  categoryLevel1Id: null,
  categoryLevel2Id: null,
  categoryLevel3Id: null,
  fileName: ''
})

const formRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryLevel1Id: [{ required: true, message: '请选择一级分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
}

// 二/三级分类联动
const level2Options = computed(() => {
  const level1 = categoryTree.value.find(c => c.id === editingProduct.categoryLevel1Id)
  return level1?.childCategory || []
})
const level3Options = computed(() => {
  const level2 = level2Options.value.find(c => c.id === editingProduct.categoryLevel2Id)
  return level2?.childCategory || []
})

// 分类名称
const categoryName = (row) => {
  const names = []
  const l1 = categoryTree.value.find(c => c.id === row.categoryLevel1Id)
  if (l1) {
    names.push(l1.name)
    const l2 = l1.childCategory?.find(c => c.id === row.categoryLevel2Id)
    if (l2) {
      names.push(l2.name)
      const l3 = l2.childCategory?.find(c => c.id === row.categoryLevel3Id)
      if (l3) names.push(l3.name)
    }
  }
  return names.join(' / ') || '-'
}

// 时间格式化
const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  if (isNaN(d.getTime())) return t
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 加载商品分页
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize,
      name: queryParams.name || undefined,
      startTime: dateRange.value?.[0] || undefined,
      endTime: dateRange.value?.[1] || undefined
    }
    const res = await productApi.getPage(params)
    tableData.value = res.page.list || []
    total.value = res.page.total || 0
  } catch (e) {

  } finally {
    loading.value = false
  }
}

// 加载分类树
const loadCategories = async () => {
  try {
    const res = await categoryApi.getTree()
    categoryTree.value = res.list || []
  } catch (e) {
    // 静默
  }
}

// 查询 / 重置
const handleSearch = () => {
  queryParams.pageNum = 1
  loadData()
}
const handleReset = () => {
  queryParams.name = ''
  dateRange.value = []
  queryParams.pageNum = 1
  loadData()
}

// 分类切换时清空下级
const onLevel1Change = () => {
  editingProduct.categoryLevel2Id = null
  editingProduct.categoryLevel3Id = null
}
const onLevel2Change = () => {
  editingProduct.categoryLevel3Id = null
}

// 上传前校验
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const under5M = file.size / 1024 / 1024 < 5
  if (!isImage) ElMessage.error('仅支持上传图片文件')
  if (!under5M) ElMessage.error('图片大小不能超过 5MB')
  return isImage && under5M
}

// 自定义上传：调用后端接口写入 SFTP 文件服务器
const customUpload = async ({ file }) => {
  try {
    const res = await productApi.upload(file)
    editingProduct.fileName = res.fileName
    ElMessage.success('图片上传成功')
  } catch (e) {

  }
}

// 打开弹窗
const openDialog = (row) => {
  if (row) {
    Object.assign(editingProduct, row)
  } else {
    Object.assign(editingProduct, {
      id: null, name: '', description: '', price: 0, stock: 0,
      categoryLevel1Id: null, categoryLevel2Id: null, categoryLevel3Id: null, fileName: ''
    })
  }
  dialogVisible.value = true
}

// 提交表单（自动同步 Elasticsearch）
const handleSubmit = async () => {
  await productFormRef.value.validate(async (valid) => {
    if (!valid) return

    submitLoading.value = true
    try {
      if (editingProduct.id) {
        await productApi.update({ ...editingProduct })
        ElMessage.success('修改成功，已同步搜索索引')
      } else {
        await productApi.add({ ...editingProduct })
        ElMessage.success('添加成功，已同步搜索索引')
      }
      dialogVisible.value = false
      loadData()
    } catch (e) {

    } finally {
      submitLoading.value = false
    }
  })
}

// 逻辑删除（同步移除 ES 文档）
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除商品「${row.name}」吗？`, '删除确认', {
    type: 'warning'
  }).then(async () => {
    try {
      await productApi.remove(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {

    }
  }).catch(() => {})
}

// 重建 ES 索引
const handleRebuildIndex = () => {
  ElMessageBox.confirm('将把数据库中全部商品同步到 Elasticsearch，是否继续？', '重建索引', {
    type: 'info'
  }).then(async () => {
    try {
      const res = await productApi.rebuildIndex()
      ElMessage.success(`索引重建完成，共同步 ${res.count} 条商品`)
    } catch (e) {

    }
  }).catch(() => {})
}

onMounted(() => {
  loadData()
  loadCategories()
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

.product-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.price {
  color: #ff6600;
  font-weight: bold;
}

.category-select {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* 图片上传 */
.image-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.3s;
}

.image-uploader :deep(.el-upload:hover) {
  border-color: #ff6600;
}

.uploaded-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  display: block;
}

.upload-placeholder {
  width: 120px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #999;
  font-size: 12px;
}

.upload-hint {
  margin-left: 12px;
  font-size: 12px;
  color: #999;
}
</style>
