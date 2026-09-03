<template>
  <div class="auth-page">
    <!-- 顶部导航 -->
    <div class="top-bar">
      <router-link to="/login" class="link-muted">你好，请登录</router-link>
      <span class="divider">|</span>
      <span class="link">免费注册</span>
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

      <!-- 右侧注册表单 -->
      <div class="form-card">
        <div class="form-header">
          <h2>注册</h2>
          <span>已有商城账号，<router-link to="/login">我要登录</router-link></span>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-width="0" size="large">
          <el-form-item prop="loginName">
            <el-input v-model="form.loginName" placeholder="用户名（登录名）*" :prefix-icon="User" />
          </el-form-item>

          <el-form-item prop="userName">
            <el-input v-model="form.userName" placeholder="昵称 *" :prefix-icon="UserFilled" />
          </el-form-item>

          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="密码 *" :prefix-icon="Lock" show-password />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" placeholder="确认密码 *" :prefix-icon="Lock"
              show-password />
          </el-form-item>

          <el-form-item prop="email">
            <el-input v-model="form.email" placeholder="邮箱 *" :prefix-icon="Message" />
          </el-form-item>

          <!-- 邮箱验证码 -->
          <el-form-item prop="emailCode">
            <div class="captcha-row">
              <el-input v-model="form.emailCode" placeholder="邮箱验证码 *" maxlength="6" />
              <el-button type="primary" plain class="send-code-btn"
                :disabled="sendingCode || codeCountdown > 0 || !form.email"
                @click="handleSendEmailCode">
                <span v-if="codeCountdown > 0">{{ codeCountdown }}s 后重发</span>
                <span v-else-if="sendingCode">发送中...</span>
                <span v-else>获取验证码</span>
              </el-button>
            </div>
            <!-- 验证码（开发展示，生产隐藏） -->
            <!-- <div v-if="receivedEmailCode" class="form-tip code-tip">
              验证码：<span class="code-val">{{ receivedEmailCode }}</span>
              <span class="code-copy" @click="form.emailCode = receivedEmailCode">点击填入</span>
            </div> -->
          </el-form-item>

          <el-form-item prop="mobile">
            <el-input v-model="form.mobile" placeholder="手机 *" :prefix-icon="Iphone" />
          </el-form-item>

          <el-form-item prop="captcha">
            <div class="captcha-row">
              <el-input v-model="form.captcha" placeholder="图形验证码 *" />
              <div class="captcha-box" @click="refreshCaptcha">{{ captchaText }}</div>
            </div>
          </el-form-item>

          <el-checkbox v-model="form.agreed" class="agreement">
            我已阅读并接受 <a href="javascript:void(0)" class="link">《用户协议》</a>
          </el-checkbox>

          <el-button type="primary" class="submit-btn" :loading="loading" @click="handleRegister">
            立即注册
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, UserFilled, Lock, Message, Iphone } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useImage } from '@/composables/useImage'
import userApi from '@/api/user'

const router = useRouter()
const userStore = useUserStore()

// 图片资源
const { img } = useImage()

const formRef = ref()
const loading = ref(false)
const sendingCode = ref(false)
const codeCountdown = ref(0)
const receivedEmailCode = ref('')
let countdownTimer = null

// 生成随机验证码
const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

const captchaText = ref(generateCaptcha())
const refreshCaptcha = () => { captchaText.value = generateCaptcha() }

const form = reactive({
  loginName: '',
  userName: '',
  password: '',
  confirmPassword: '',
  email: '',
  emailCode: '',
  mobile: '',
  captcha: '',
  agreed: false
})

// 邮箱验证码倒计时
const startCountdown = () => {
  codeCountdown.value = 60
  countdownTimer = setInterval(() => {
    codeCountdown.value--
    if (codeCountdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

// 发送邮箱验证码
const handleSendEmailCode = async () => {
  // 先校验邮箱格式
  if (!form.email) {
    ElMessage.warning('请先输入邮箱')
    return
  }
  const emailRule = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  if (!emailRule.test(form.email)) {
    ElMessage.warning('邮箱格式不正确')
    return
  }
  sendingCode.value = true
  try {
    const res = await userApi.sendEmailCode({ email: form.email, scene: 'register' })
    if (res.code === 200) {

      // 验证码
      // receivedEmailCode.value = res.captchaCode || '' // 开发期联调
      ElMessage.success(res.message || '验证码已发送，请注意查收')
      startCountdown()
    }
  } catch (e) {
    // 错误由全局拦截器提示
  } finally {
    sendingCode.value = false
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validateCaptcha = (rule, value, callback) => {
  if (value.toUpperCase() !== captchaText.value) {
    callback(new Error('图形验证码错误'))
  } else {
    callback()
  }
}

const validateEmailCode = (rule, value, callback) => {
  if (!value || value.trim().length < 6) {
    callback(new Error('请输入 6 位邮箱验证码'))
  } else {
    callback()
  }
}

const rules = {
  loginName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度 3-20 个字符', trigger: 'blur' }
  ],
  userName: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  emailCode: [
    { required: true, message: '请输入邮箱验证码', trigger: 'blur' },
    { validator: validateEmailCode, trigger: 'blur' }
  ],
  mobile: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入图形验证码', trigger: 'blur' },
    { validator: validateCaptcha, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    if (!form.agreed) {
      ElMessage.warning('请先阅读并接受用户协议')
      return
    }

    loading.value = true
    try {
      const res = await userStore.register({
        loginName: form.loginName,
        userName: form.userName,
        password: form.password,
        email: form.email,
        emailCode: form.emailCode,
        mobile: form.mobile
      })
      if (res.code === 200) {
        ElMessage.success('注册成功，请登录')
        router.push('/login')
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
.link-muted { color: #999; }
.link { color: #ff6600; font-weight: bold; }

.auth-body {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 60px;
  min-height: calc(100vh - 42px);
  padding: 30px;
}

.brand-side {
  flex: 1;
  max-width: 450px;
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
  width: 420px;
  background: #fff;
  border-radius: 12px;
  padding: 36px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.form-header h2 { font-size: 26px; color: #333; }
.form-header span { font-size: 13px; color: #999; }

.captcha-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.captcha-box {
  width: 120px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff6600, #ff9966);
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 4px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  font-style: italic;
}

/* 邮箱验证码发送按钮 */
.send-code-btn {
  width: 140px;
  height: 40px;
  white-space: nowrap;
  flex-shrink: 0;
  border-color: #ff6600;
  color: #ff6600;
}
.send-code-btn:hover:not(:disabled) {
  background: #ff6600;
  color: #fff;
  border-color: #ff6600;
}
.send-code-btn:disabled {
  opacity: 0.6;
}

.agreement { margin-bottom: 20px; font-size: 13px; }

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

/* 验证码 */
.form-tip {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}
.code-tip {
  margin-top: 6px;
  padding: 6px 10px;
  background: #fff5f0;
  border-radius: 4px;
  color: #ff6600;
}
.code-val {
  font-family: 'Courier New', Courier, monospace;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 2px;
  color: #ff6600;
  margin: 0 6px;
}
.code-copy {
  display: inline-block;
  margin-left: 8px;
  padding: 1px 8px;
  font-size: 12px;
  color: #fff;
  background: #ff6600;
  border-radius: 3px;
  cursor: pointer;
  transition: background .2s;
}
.code-copy:hover {
  background: #ff8533;
}
</style>
