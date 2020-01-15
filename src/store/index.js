import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    currentUser: window.localStorage.getItem('cuser') ? JSON.parse(window.localStorage.getItem('cuser')) : {}, // 当前用户的信息
    wecircleDataList: [], // 朋友圈首页的数据
    closeCLPanelFlag: true, // 关闭评论和点赞面板标志位
    keyword: '' // 私信列表搜索
  },
  mutations: {
    // 设置用户信息
    currentUser (state, user) {
      state.currentUser = user
      window.localStorage.setItem('cuser', JSON.stringify(user)) // 缓存用户信息
    },
    // 朋友圈数据列表
    wecircleDataList (state, list) {
      if (list.first) {
        state.wecircleDataList = []
      } else {
        state.wecircleDataList = state.wecircleDataList.concat(list)
      }
    },
    // 添加评论
    addComment (state, obj) {
      var list = state.wecircleDataList
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === obj.pid) {
          list[i].comments.push({
            content: obj.content,
            user: obj.user
          })
        }
      }
    },
    // 点赞
    addLike (state, obj) {
      var list = state.wecircleDataList
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === obj.pid) {
          list[i].isLike = true
          list[i].likes.push({
            user: obj.user
          })
        }
      }
    },
    // 取消点赞
    removeLike (state, obj) {
      var list = state.wecircleDataList
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === obj.pid) {
          list[i].isLike = false
          var array = []
          for (var j = 0; j < list[i].likes.length; j++) {
            if (list[i].likes[j].user._id !== obj.user._id) {
              array.push(list[i].likes[j])
            }
          }
          list[i].likes = array
        }
      }
    },
    // 关闭评论点赞面板
    closeCLPanel (state, obj) {
      state.closeCLPanelFlag = obj
    },
    // 设置搜索关键字
    setKeyword (state, str) {
      state.keyword = str
    }
  },
  actions: {
    // 设置用户信息
    setUser (context, user) {
      context.commit('currentUser', user)
    },
    setWecircleDataList (context, list) {
      context.commit('wecircleDataList', list)
    },
    addComment (context, obj) {
      context.commit('addComment', obj)
    },
    addLike (context, obj) {
      context.commit('addLike', obj)
    },
    removeLike (context, obj) {
      context.commit('removeLike', obj)
    },
    setKeyword (context, str) {
      context.commit('setKeyword', str)
    },
    closeCLPanel (context, obj) {
      context.commit('closeCLPanel', obj)
    }
  },
  modules: {
  }
})
