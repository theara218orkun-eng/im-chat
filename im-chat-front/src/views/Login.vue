<template>
  <div class="login-wrapper" :style="'background-image:url('+ Background +')'">
    <div class="form-box">
      <div v-if="qrLogin" >
        <div  @click="qrLogin=false" class="qr-close f-18 c-666"><i class="el-icon el-icon-back"></i> 返回</div>
          <div class="mt-20 mb-20" style="text-align: center; margin-bottom: 15px;">
            <vue-qr ref="qrCode" :text="qrLoginUrl" width="250" height="250"></vue-qr>
            <div class="m-20 f-18">使用手机 {{globalConfig.sysInfo.name}} 扫码登录</div>
          </div>
      </div>
      
      <template v-else>
        <div class="qr-open" @click="openQr()" title="扫码登录">
          <svg t="1763222030406" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2792" width="50" height="50"><path d="M92.16 92.16h276.48v275.626667h-0.853333L460.8 460.8V0H0l92.16 92.16z" p-id="2793" fill="#707070"></path><path d="M294.4 166.4H166.4l128 128zM1024 0H563.2v460.8h460.8V0z m-92.16 367.786667h-276.48V92.16h276.48v275.626667z" p-id="2794" fill="#707070"></path><path d="M729.6 166.4h128v128h-128zM1024 1024v-88.746667h-88.746667L1024 1024zM834.986667 756.053333v-100.266666H942.933333V563.2h-183.893333v96.853333h-98.986667l96 96zM655.36 563.2H563.2l92.16 92.16z" p-id="2795" fill="#707070"></path><path d="M1024 834.133333v-178.346666h-81.066667v100.266666h-107.946666v78.933334l79.786666 79.786666v-80.64z" p-id="2796" fill="#707070"></path></svg>
        </div>
        <div class="form-title" v-if="globalConfig.sysInfo">
          <img :src="globalConfig.sysInfo.logo ? globalConfig.sysInfo.logo : $packageData.logo" width="88" alt="icon">
          <p class="mt-10 f-20">{{globalConfig.sysInfo.name}}</p>
        </div>
              
        <el-form ref="loginForm" :model="loginForm" :rules="loginRules" label-width="0px" class="login-form pd-10">
          <el-form-item prop="account">
            <el-input ref="account" v-model="loginForm.account" type="text" auto-complete="off" placeholder="请输入账号" prefix-icon="el-icon-user" />
          </el-form-item>
          <el-form-item prop="password" v-show="!forget">
            <el-input v-model="loginForm.password" type="password" auto-complete="off" placeholder="请输入密码" prefix-icon="el-icon-lock" @keyup.enter.native="handleLogin" />
          </el-form-item>
          <el-form-item prop="code" v-show="forget">
            <el-input
                placeholder="请输入验证码"
                maxlength="6"
                v-model="loginForm.code">
                <el-button slot="append" @click="sendCode()" :loading="coding">发送验证码</el-button>
              </el-input>
          </el-form-item>
          <el-form-item>
            <div class="remenber">
              <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
              <el-button type="text" @click="forget=!forget">{{forget ? '密码登陆'  : '忘记密码'}}</el-button>
            </div>
            
          </el-form-item>
          <el-form-item>
            <el-button :loading="loading" size="small" type="primary" style="width:100%;" @click.native.prevent="handleLogin">
              <span v-if="!loading">登 录</span>
              <span v-else>登 录 中...</span>
            </el-button>
            
          </el-form-item>
          <div class="lz-flex lz-align-items-center lz-justify-content-end mb-10 c-666" align="right" v-if="globalConfig.sysInfo.regtype==1">
          还没有账号，去
          <el-link type="primary" size="large"  @click="$router.push('/register')"> 注册</el-link>
        </div>
        <div class="lz-flex lz-align-items-start lz-justify-content-center ">
          <div class="c-999">{{globalConfig.sysInfo.name}} for {{$packageData.version}}</div>&nbsp;
          <el-link class="mb-5" type="primary" size="large"  @click="downapp()"> 下载客户端</el-link>
        </div>
          
        </el-form>
      </template>
      
    </div>
      <Socket ref="socket" :isQrLogin="true"></Socket>
  </div>
</template>

<script>
import Background from '../assets/img/login-background.jpg'
import Socket from "@/components/message/socket.vue";
import { mapState } from 'vuex';
import Lockr from 'lockr';
import VueQr from 'vue-qr';
export default {
  name: 'Login',
  data() {
    return {
      Background,
      forget:false,
      qrLogin:false,
      loginForm: {
        account: '',
        password: '',
        code:'',
        rememberMe: true
      },
      loginRules: {
        account: [{ required: true, trigger: 'blur', message: '用户名不能为空' }],
        password: [{ required: true, trigger: 'blur', message: '密码不能为空' }]
      },
      loading: false,
      coding: false,
      redirect: undefined
    }
  },
  components: {
    VueQr,
    Socket
  },
  computed: {
    ...mapState({
      globalConfig: state => state.globalConfig,
      qrLoginUrl: state => state.qrLoginUrl
    })
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect
      },
      immediate: true
    },
    forget(val){
      if(val){
        this.loginForm.password='123456';
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      // 获取url的参数
      let token=this.$route.query.token;
      if(token){
        return this.dologin({token:token});
      }
      // 如果是演示模式、获取1-20的随机数填充账号密码
      if(this.globalConfig.demon_mode){
        const random = Math.floor(Math.random() * 19 + 2)
        this.loginForm.account=13800000000+random;
        this.loginForm.password='123456';
        this.$refs.account.focus()
      };

      // 如果有记住密码、则填充
      const LoginAccount = Lockr.get('LoginAccount');
      if(LoginAccount){
        this.loginForm.account=LoginAccount.account;
        this.loginForm.password=LoginAccount.password;
        this.loginForm.rememberMe=true;
        this.$refs.account.focus()
      };
      
    })
  },
  methods: {
    openQr(){
      this.qrLogin=true;
      this.$refs.socket.websocket.send(JSON.stringify({type:"pong",isQrLogin:true}));
    },
    handleLogin() {
      if(this.forget){
        if(!this.loginForm.code){
          this.$message.error('请输入验证码');
          return;
        }
      }
      this.$refs.loginForm.validate(valid => {
        const data = {
          account: this.loginForm.account,
          password: this.loginForm.password,
          code:this.loginForm.code
        }
        if(this.loginForm.rememberMe){
          Lockr.set('LoginAccount',data);
        }else{
          Lockr.rm('LoginAccount');
        }
        if (valid) {
          this.dologin(data);
        }
      })
    },
    dologin(data){
      this.loading = true
          this.$store
          .dispatch('Login', data)
          .then(res => {
            window.location.reload();
          })
        .catch(() => {
          this.loading = false
        })
    },
    sendCode(){
      if(!this.loginForm.account){
        this.$message.error('请输入账号');
        return;
      }
      this.coding=true;
      let data={
        account:this.loginForm.account,
        type:1
      }
      this.$store.dispatch('sendCode',data).then(res=>{
        this.$message.success('发送成功');
        this.coding=false;
      }).catch(()=>{
        this.coding=false;
      })
    },
    downapp(){
      window.open(window.BASE_URL+'downapp')
    }
  }
}
</script>

<style lang="scss">
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  background-size: cover;
  .form-box {
    position:absolute;
    width: 320px;
    padding: 20px;
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 15px 30px 0 rgba(0, 0, 1, .3);
    .form-title {
      margin: 30px auto 20px;
      text-align: center;
      color: #707070;
      font-size: 18px;
      letter-spacing: 2px;
    }
  }
  .remenber{
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
.qr-open{
  cursor: pointer;
  position:absolute;
  right:5px;
  top:5px;
}
.qr-close{
  cursor: pointer;

}
</style>