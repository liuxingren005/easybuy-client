<template>
  <div class="auth-page">
    <!-- 顶部导航 -->
    <div class="top-bar">
      <span class="link">你好，请登录</span>
      <span class="divider">|</span>
      <router-link to="/register" class="link-muted">免费注册</router-link>
      <span class="divider">|</span>
      <span>关注我们：</span>
      <span>微博</span>
      <span>微信</span>
      <span class="divider">|</span>
      <span>手机版</span>
      <span class="divider">|</span>
      <router-link to="/" class="link-muted">返回首页</router-link>
    </div>

    <div class="auth-body">
      <!-- 左侧品牌区 -->
      <div class="brand-side">
        <img :src="img('l_img.png')" class="logo-img" alt="易买网" />
        <p class="slogan">轻松购物 精彩无限！</p>
      </div>

      <!-- 右侧表单卡片 -->
      <div class="form-card">
        <div class="form-header">
          <h2>登录</h2>
          <span>还没有商城账号，<router-link to="/register">立即注册</router-link></span>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-width="0" size="large">
          <el-form-item prop="loginName">
            <el-input v-model="form.loginName" placeholder="用户名 / 邮箱" :prefix-icon="User" />
          </el-form-item>

          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock"
              show-password @keyup.enter="handleLogin" />
          </el-form-item>

          <div class="form-options">
            <el-checkbox v-model="form.remember">记住我</el-checkbox>
            <router-link to="/register" class="link">忘记密码？点击注册</router-link>
          </div>

          <el-button type="primary" class="submit-btn" :loading="loading" @click="handleLogin">
            登录
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useImage } from '@/composables/useImage'

const router = useRouter()
const userStore = useUserStore()

// 图片资源
const { img } = useImage()

const formRef = ref()
const loading = ref(false)

const form = reactive({
  loginName: '',
  password: '',
  remember: false
})

const rules = {
  loginName: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const res = await userStore.login({ loginName: form.loginName, password: form.password })
      ElMessage.success('登录成功')
      // 管理员进入后台，普通用户进入首页
      if (res.data.type === 1) {
        router.push('/admin/news')
      } else {
        router.push('/')
      }
    } catch (e) {

    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #fff5f0 0%, #fff 100%);
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 30px;
  font-size: 13px;
  color: #999;
  background: #f7f7f7;
  border-bottom: 1px solid #eee;
}

.top-bar .divider { color: #ddd; }
.top-bar .link { color: #ff6600; font-weight: bold; }
.top-bar .link-muted { color: #999; text-decoration: none; }
.top-bar .link-muted:hover { color: #ff6600; }

.auth-body {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 80px;
  min-height: calc(100vh - 42px);
  padding: 40px;
}

.brand-side {
  flex: 1;
  max-width: 500px;
  text-align: center;
}

.logo-img {
  max-width: 280px;
  height: auto;
  margin-bottom: 20px;
}

.slogan {
  font-size: 24px;
  color: #666;
  letter-spacing: 4px;
}

.form-card {
  width: 400px;
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 30px;
}

.form-header h2 { font-size: 26px; color: #333; }
.form-header span { font-size: 13px; color: #999; }

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 13px;
}

.submit-btn {
  width: 100%;
  background: #ff6600;
  border-color: #ff6600;
  font-size: 16px;
  letter-spacing: 4px;
}

.submit-btn:hover {
  background: #ff8533;
  border-color: #ff8533;
}
</style>
