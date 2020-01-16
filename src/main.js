import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueSocketio from 'vue-socket.io'
import socketio from 'socket.io-client'

import service from '@/utils/service'
import './assets/css/common.css'
import './assets/css/animate.css'
import './assets/css/weui.min.css'

Vue.config.productionTip = false

Vue.prototype.$bus = new Vue()

Vue.use(VueSocketio, socketio(service.baseURL)) // 与服务端链接

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
