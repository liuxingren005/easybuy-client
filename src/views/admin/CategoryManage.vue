<template>
  <div class="category-manage">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-input v-model="filterText" placeholder="输入分类名称筛选" clearable style="width: 240px">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button @click="handleExpandAll">
        <el-icon><ArrowDown /></el-icon>展开全部
      </el-button>
      <el-button @click="handleCollapseAll">
        <el-icon><ArrowUp /></el-icon>收起全部
      </el-button>
      <el-button type="primary" @click="loadTree" :loading="loading">
        <el-icon><Refresh /></el-icon>刷新
      </el-button>
      <el-button type="success" @click="openDialog(null)">
        <el-icon><Plus /></el-icon>新增一级分类
      </el-button>
    </div>

    <!-- 分类树：树形结构 -->
    <div class="tree-card" v-loading="loading">
      <el-tree ref="treeRef" :data="treeData" :props="treeProps" node-key="id"
        :filter-node-method="filterNode" default-expand-all :expand-on-click-node="false"
        :indent="28" class="category-tree">
        <template #default="{ node, data }">
          <div class="tree-node">
            <span class="node-label">
              <el-tag :type="levelTagType(data.type)" size="small" effect="plain" class="level-tag">
                {{ data.type === 1 ? '一级' : data.type === 2 ? '二级' : '三级' }}
              </el-tag>
              {{ data.name }}
            </span>
            <span class="node-actions">
              <!-- 三级分类下不能再建子分类 -->
              <el-button v-if="data.type < 3" size="small" type="success" link
                @click.stop="openDialog(null, data)">新增子分类</el-button>
              <el-button size="small" type="primary" link @click.stop="openDialog(data)">编辑</el-button>
              <el-button size="small" type="danger" link @click.stop="handleDelete(data)">删除</el-button>
            </span>
          </div>
        </template>
      </el-tree>
      <el-empty v-if="!loading && treeData.length === 0" description="暂无分类，请点击「新增一级分类」" />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form ref="categoryFormRef" :model="editingCategory" :rules="formRules" label-width="100px">
        <el-form-item label="上级分类">
          <!-- 编辑时可修改上级分类，不选则为一级分类（提交时 null 转 parent_id = 0） -->
          <el-tree-select v-model="editingCategory.parentId" :data="parentOptions"
            :props="{ label: 'name', value: 'id', children: 'childCategory' }"
            node-key="id" check-strictly clearable :render-after-expand="false"
            placeholder="不选则为一级分类" style="width: 100%" />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="editingCategory.name" placeholder="请输入分类名称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="分类级别">
          <el-tag :type="levelTagType(computedType)">{{ computedTypeLabel }}</el-tag>
          <span class="form-hint">级别由所选上级分类自动选择</span>
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Search, Plus, Refresh, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import categoryApi from '@/api/category'

const loading = ref(false)
const submitLoading = ref(false)
const treeData = ref([])
const treeRef = ref()
const filterText = ref('')
const dialogVisible = ref(false)
const categoryFormRef = ref()

// el-tree 字段映射（子分类 - childCategory）
const treeProps = {
  label: 'name',
  children: 'childCategory'
}

const editingCategory = reactive({
  id: null,
  name: '',
  parentId: null
})

// 上级分类候选树
const parentOptions = ref([])

const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '分类名称长度为 2-20 个字符', trigger: 'blur' }
  ]
}

// 级别由上级分类推导（顶级分类 parent_id = 0）
const computedType = computed(() => {
  if (!editingCategory.parentId) return 1
  const parent = findNode(treeData.value, editingCategory.parentId)
  return parent ? parent.type + 1 : 1
})
const computedTypeLabel = computed(() =>
  computedType.value === 1 ? '一级分类' : computedType.value === 2 ? '二级分类' : '三级分类')

// 级别标签颜色
const levelTagType = (type) => type === 1 ? '' : type === 2 ? 'warning' : 'info'

const dialogTitle = computed(() => editingCategory.id
  ? '编辑分类'
  : editingCategory.parentId ? '新增子分类' : '新增一级分类')

// 名称筛选
watch(filterText, (val) => {
  treeRef.value?.filter(val)
})
const filterNode = (value, data) => {
  if (!value) return true
  return data.name.includes(value)
}

// 递归查找节点
const findNode = (nodes, id) => {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.childCategory?.length) {
      const found = findNode(node.childCategory, id)
      if (found) return found
    }
  }
  return null
}

// 深拷贝并剔除指定节点及其子孙（构造上级分类候选）
const excludeNode = (nodes, excludeId) => {
  const result = []
  for (const node of nodes) {
    if (node.id === excludeId) continue
    const copy = { ...node }
    if (node.childCategory?.length) {
      copy.childCategory = excludeNode(node.childCategory, excludeId)
    }
    result.push(copy)
  }
  return result
}

// 加载分类树
const loadTree = async () => {
  loading.value = true
  try {
    const res = await categoryApi.getTree()
    treeData.value = res.list || []
  } catch (e) {

  } finally {
    loading.value = false
  }
}

// 展开/收起全部
const handleExpandAll = () => setAllExpanded(true)
const handleCollapseAll = () => setAllExpanded(false)
const setAllExpanded = (expanded) => {
  const store = treeRef.value?.store
  if (!store) return
  Object.values(store.nodesMap).forEach(node => { node.expanded = expanded })
}

// 打开弹窗：row 为空表示新增，parent 表示挂载
const openDialog = (row, parent) => {
  if (row) {
    // 编辑：修改名称与上级分类（顶级分类 parentId=0 展示为空）
    // 批量更新：修改上级分类时，子分类的 parentId 会一并更新
    Object.assign(editingCategory, { id: row.id, name: row.name, parentId: row.parentId || null })
    parentOptions.value = excludeNode(treeData.value, row.id)
  } else {
    Object.assign(editingCategory, { id: null, name: '', parentId: parent ? parent.id : null })
    parentOptions.value = treeData.value
  }
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  await categoryFormRef.value.validate(async (valid) => {
    if (!valid) return

    submitLoading.value = true
    try {
      // 顶级分类 parent_id 统一，同时回填 type
      const payload = {
        ...editingCategory,
        parentId: editingCategory.parentId || 0,
        type: computedType.value
      }
      if (editingCategory.id) {
        // 后端校验：同级名称唯一、上级不能选择自身
        await categoryApi.update(payload)
        ElMessage.success('修改成功')
      } else {
        // 后端校验：同级分类下名称保持唯一
        await categoryApi.add(payload)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      loadTree()
    } catch (e) {

    } finally {
      submitLoading.value = false
    }
  })
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除分类「${row.name}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      await categoryApi.remove(row.id)
      ElMessage.success('删除成功')
      loadTree()
    } catch (e) {

    }
  }).catch(() => {})
}

onMounted(() => {
  loadTree()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.tree-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  min-height: 300px;
}

/* 树节点 */
.category-tree {
  --el-tree-node-hover-bg-color: #fff5f0;
}

.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 12px;
  font-size: 14px;
}

.node-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
}

.level-tag {
  flex-shrink: 0;
}

.node-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

.form-hint {
  margin-left: 10px;
  font-size: 12px;
  color: #999;
}
</style>
