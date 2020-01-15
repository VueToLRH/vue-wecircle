import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import './assets/css/common.css'
import './assets/css/animate.css'
import './assets/css/weui.min.css'

Vue.config.productionTip = false

Vue.prototype.$bus = new Vue()

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
