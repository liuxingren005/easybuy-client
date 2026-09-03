<template>
  <div class="profile-page">
    <el-tabs v-model="activeTab">
      <!-- 基础信息 -->
      <el-tab-pane label="基础信息" name="info">
        <el-form ref="infoFormRef" :model="infoForm" :rules="infoRules" label-width="100px"
          style="max-width: 480px" v-loading="loading">
          <el-form-item label="登录名">
            <el-input :model-value="userStore.loginName" disabled />
          </el-form-item>
          <el-form-item label="昵称" prop="userName">
            <el-input v-model="infoForm.userName" placeholder="请输入昵称" maxlength="20" />
          </el-form-item>
          <el-form-item label="性别">
            <el-radio-group v-model="infoForm.sex">
              <el-radio :value="1">男</el-radio>
              <el-radio :value="0">女</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input :model-value="infoForm.email" disabled>
              <template #append>不可更改</template>
            </el-input>
            <div class="form-tip">邮箱作为账号凭证，注册后不可修改</div>
          </el-form-item>
          <el-form-item label="手机号" prop="mobile">
            <el-input v-model="infoForm.mobile" placeholder="请输入手机号" maxlength="11" />
          </el-form-item>
          <el-form-item label="身份证号" prop="identityCode">
            <el-input v-model="infoForm.identityCode" placeholder="请输入身份证号" maxlength="18" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="infoLoading" @click="handleSaveInfo">保存</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 修改密码 -->
      <el-tab-pane label="修改密码" name="password">
        <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="120px"
          style="max-width: 560px">
          <el-form-item label="当前邮箱">
            <el-input :model-value="infoForm.email" disabled />
          </el-form-item>
          <el-form-item label="邮箱验证码" prop="emailCode">
            <div class="captcha-row">
              <el-input v-model="pwdForm.emailCode" placeholder="请输入邮箱验证码" maxlength="6" />
              <el-button type="primary" plain class="send-code-btn"
                :disabled="pwdSendingCode || pwdCodeCountdown > 0 || !infoForm.email"
                @click="handleSendPwdEmailCode">
                <span v-if="pwdCodeCountdown > 0">{{ pwdCodeCountdown }}s 后重发</span>
                <span v-else-if="pwdSendingCode">发送中...</span>
                <span v-else>获取验证码</span>
              </el-button>
            </div>
            <!-- 验证码（开发期） -->
            <!-- <div v-if="receivedPwdEmailCode" class="form-tip code-tip">
              验证码：<span class="code-val">{{ receivedPwdEmailCode }}</span>
              <span class="code-copy" @click="pwdForm.emailCode = receivedPwdEmailCode">点击填入</span>
            </div> -->
            <div class="form-tip">修改密码需要邮箱二次验证，验证码发送至上述邮箱</div>
          </el-form-item>
          <el-form-item label="原密码" prop="oldPassword">
            <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="至少 6 位" />
          </el-form-item>
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="pwdLoading" @click="handleChangePassword">确认修改</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import userApi from '@/api/user'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const activeTab = ref('info')
const loading = ref(false)
const infoLoading = ref(false)
const pwdLoading = ref(false)
const infoFormRef = ref()
const pwdFormRef = ref()

// 修改密码：邮箱验证码发送状态 & 倒计时
const pwdSendingCode = ref(false)
const pwdCodeCountdown = ref(0)
// const receivedPwdEmailCode = ref('')    // 验证码（开发期）
let pwdCountdownTimer = null

const startPwdCountdown = () => {
  pwdCodeCountdown.value = 60
  pwdCountdownTimer = setInterval(() => {
    pwdCodeCountdown.value--
    if (pwdCodeCountdown.value <= 0) {
      clearInterval(pwdCountdownTimer)
      pwdCountdownTimer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (pwdCountdownTimer) clearInterval(pwdCountdownTimer)
})

const infoForm = reactive({
  userName: '',
  sex: 1,
  email: '',
  mobile: '',
  identityCode: ''
})

const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  emailCode: ''
})

// 确认密码自定义校验
const validateConfirm = (rule, value, callback) => {
  if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 邮箱验证码自定义校验
const validateEmailCode = (rule, value, callback) => {
  if (!value || value.trim().length < 6) {
    callback(new Error('请输入 6 位邮箱验证码'))
  } else {
    callback()
  }
}

const infoRules = {
  userName: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  mobile: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }]
}

const pwdRules = {
  emailCode: [
    { required: true, message: '请输入邮箱验证码', trigger: 'blur' },
    { validator: validateEmailCode, trigger: 'blur' }
  ],
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

// 拉取当前用户信息
const loadProfile = async () => {
  loading.value = true
  try {
    const res = await userApi.getCurrent()
    const user = res.data || {}
    Object.assign(infoForm, {
      userName: user.userName || '',
      sex: user.sex ?? 1,
      email: user.email || '',
      mobile: user.mobile || '',
      identityCode: user.identityCode || ''
    })
  } catch (e) {

  } finally {
    loading.value = false
  }
}

// 保存基础信息
const handleSaveInfo = async () => {
  await infoFormRef.value.validate(async (valid) => {
    if (!valid) return

    infoLoading.value = true
    try {
      await userApi.updateProfile({ ...infoForm })
      ElMessage.success('保存成功')
      // 刷新本地用户信息
      const res = await userApi.getCurrent()
      userStore.setUserInfo(res.data)
    } catch (e) {

    } finally {
      infoLoading.value = false
    }
  })
}

// 发送修改密码邮箱验证码
const handleSendPwdEmailCode = async () => {
  if (!infoForm.email) {
    ElMessage.warning('当前用户未绑定邮箱，无法发送验证码')
    return
  }
  pwdSendingCode.value = true
  try {
    const res = await userApi.sendEmailCode({ email: infoForm.email, scene: 'changePassword' })
    if (res.code === 200) {
      // 验证码
      // receivedPwdEmailCode.value = res.captchaCode || '' // 开发期联调
      ElMessage.success(res.message || '验证码已发送至邮箱，请注意查收')
      startPwdCountdown()
    }
  } catch (e) {
    // 全局拦截器提示
  } finally {
    pwdSendingCode.value = false
  }
}

// 修改密码
const handleChangePassword = async () => {
  await pwdFormRef.value.validate(async (valid) => {
    if (!valid) return

    pwdLoading.value = true
    try {
      await userApi.changePassword({
        oldPassword: pwdForm.oldPassword,
        newPassword: pwdForm.newPassword,
        emailCode: pwdForm.emailCode
      })
      ElMessage.success('密码修改成功，请重新登录')
      // 修改密码后原会话作废，退出重新登录
      await userStore.logout()
      window.location.href = '/login'
    } catch (e) {

    } finally {
      pwdLoading.value = false
    }
  })
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-page {
  padding: 10px;
}

.profile-page :deep(.el-tabs__item.is-active) {
  color: #ff6600;
}

.profile-page :deep(.el-tabs__active-bar) {
  background-color: #ff6600;
}

/* 表单辅助提示文字 */
.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  line-height: 1.5;
}

/* 验证码行布局 */
.captcha-row {
  display: flex;
  gap: 12px;
  width: 100%;
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

/* 验证码（开发期） */
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
