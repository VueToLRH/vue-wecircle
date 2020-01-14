import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    // 当前用户的信息
    currentUser: window.localStorage.getItem('cuser') ? JSON.parse(window.localStorage.getItem('cuser')) : {}
  },
  mutations: {
    // 设置用户信息
    currentUser (state, user) {
      state.currentUser = user
      window.localStorage.setItem('cuser', JSON.stringify(user)) // 缓存用户信息
    }
  },
  actions: {
    // 设置用户信息
    setUser (context, user) {
      context.commit('currentUser', user)
    }
  },
  modules: {
  }
})
