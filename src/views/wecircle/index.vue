<template>
  <div class="container">
    <pullRefreshView @onRefresh="onRefresh">
      <headerbar></headerbar>
      <div class="top-img" :style="topImgStyle" @click="changeBg"></div>
      <div style="display:none;" id="uploaderBg">
        <input
          ref="uploaderBg"
          id="uploaderInput"
          class="weui-uploader__input"
          type="file"
          accept="image/*"
        >
      </div>
      <div class="name-info">
        <p class="nickname">{{nickname}}</p>
        <img @click="goMyPage" class="avatar" :src="myAvatar">
      </div>
      <list ref="list"></list>
      <!-- iOS 和 android 中，初始化状态输入框都是隐藏的，
        iOS 的隐藏是通过绝对定位和 z-index 来让其不可见，
        android 的隐藏是通过绝对定位到屏幕外面来让其不可见 -->
      <!-- IOS inputBar -->
      <div :style="{zIndex:showInput?'999':'-1',opacity:showInput?'1':'0'}" ref="inputBarWrap" class="input-wrap ios" v-if="iosInput">
        <inputBar ref="inputBar" :option="inputBarOption" @publish="publish"/>
      </div>
      <!-- Android inputBar -->
      <div :style="{opacity:showInput?'1':'0',bottom:showInput?'0':'-60px'}" ref="inputBarWrap" class="input-wrap android" v-if="androidInput">
        <inputBar ref="inputBar" :option="inputBarOption" @publish="publish"/>
      </div>
    </pullRefreshView>
    <div v-show="showPWA" @click="showPWA = false" class="add-screen"></div>
  </div>
</template>

<script>
import headerbar from './headerbar'
import list from './list'
import inputBar from '@/components/inputBar'
import pullRefreshView from '@/components/pullRefreshView'
import service from '@/utils/service'
import os from '@/utils/os'

export default {
  name: 'wecircle',
  components: {
    headerbar,
    list,
    inputBar,
    pullRefreshView
  },
  data () {
    return {
      inputBarOption: {
        noPlus: true // 代表没有底部的操作面板
      },
      showInput: false,
      showPWA: !(window.location.href.indexOf('manifest') > -1) && os.isIOS, // 在非pwa页面显示提示
      iosInput: os.isIOS,
      androidInput: os.isAndroid
    }
  },
  computed: {
    myAvatar () {
      return this.$store.state.currentUser.avatar || require('@/assets/img/missing_face.png')
    },
    nickname () {
      return this.$store.state.currentUser.nickname || '游客账号'
    },
    topImgStyle () {
      // 背景图片首先从store里面获取，获取不到就采用默认的背景图片
      let url = this.$store.state.currentUser.bgurl || require('@/assets/img/topbg.jpg')
      let obj = {
        backgroundImage: 'url(' + url + ')'
      }
      return obj
    }
  },
  mounted () {
    // 处理评论输入框的显示和隐藏
    this.$bus.$on('showInput', (flag, currentData) => {
      this.showInput = flag
      if (flag) {
        this.$refs.inputBar && this.$refs.inputBar.focusInput(currentData)
        // 在 android 上，由于页面不会被顶上来，所以我们将 input 放在最底部，紧贴着键盘即可
        // 在ios里，页面会被顶上来，要单独处理
        if (os.isIOS) {
          // 设置input在手指点击的那个位置出现10表示稍向下移动一些
          this.$refs.inputBarWrap.style.top = (currentData.pageY) + 'px'
          setTimeout(() => {
            // 通过调用 window.scroll() 可以让页面顶回去，但是具体顶多少距离需要通过输入框的位置以及键盘的高度通过计算得出，
            // 公式：（输入框的位置 - 键盘的高度 - 微调系数（其中 5 是表示对位置微调））
            // 输入框的位置剪去键盘的高度剪去位置微调系数 45 ： 5
            let y = currentData.pageY - window.keyboardHeight - (os.isIpP ? 45 : 5)
            window.scroll(0, y) // 通过调用window.scroll在将页面顶回去一定距离
          }, 300)
        }
      } else {
        try {
          this.$refs.inputBar.blurInput()
        } catch (e) {}
      }
    })
    var self = this
    weui.uploader('#uploaderBg', {
      url: service.baseURL + 'post/uploadimgaliyun',
      auto: true,
      type: 'file',
      fileVal: 'image',
      compress: {
        width: 1300,
        height: 1300,
        quality: 0.8
      },
      onBeforeQueued: function (files) {
        // `this` 是轮询到的文件, `files` 是所有文件
        let imgFormatArr = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif']
        if (imgFormatArr.indexOf(this.type) < 0) {
          weui.alert('请上传图片')
          return false
        }
        if (this.size > 10 * 1024 * 1024) {
          weui.alert('请上传不超过10M的图片')
          return false
        }
        if (files.length > 1) {
          weui.alert('最多只能上传1张图片，请重新选择')
          return false
        }
      },
      onBeforeSend: function (data, headers) {
        headers['wec-access-token'] = service.token
      },
      onSuccess: function (ret) {
        self.submitBg(ret)
      }
    })
  },
  methods: {
    // 修改背景图片
    changeBg () {
      // 弹出式菜单：https://github.com/Tencent/weui.js/blob/master/docs/component/actionSheet.md
      weui.actionSheet(
        [
          {
            label: '更换图片',
            onClick: () => {
              this.$refs.uploaderBg.click()
            }
          }
        ],
        [
          {
            label: '取消',
            onClick: () => {}
          }
        ]
      )
    },
    goMyPage () {
      // 判断是否登录
      if (this.$store.state.currentUser._id) {
        this.$router.push({
          path: 'login',
          name: 'login'
        })
        return
      }
      // 打开我的页面
      this.$router.push({
        path: 'mypage',
        name: 'mypage',
        params: {}
      })
    },
    // 提交背景图片
    async submitBg (obj) {
      let resp = await service.post('users/update', {
        userId: this.$store.state.currentUser._id,
        bgurl: obj.data.url
      })
      if (resp.code === 0) {
        this.$store.dispatch('setUser', {
          ...this.$store.state.currentUser,
          bgurl: obj.data.url
        })
        weui.toast('修改成功', 3000)
      }
    }
  }
}
</script>
