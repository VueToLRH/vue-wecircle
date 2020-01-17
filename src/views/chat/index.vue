<template>
  <div class="container">
    <navHeader :title="topName"/>
    <div ref="chatView" class="chat-view" @touchstart="touchstart">
      <chatItem v-for="(item) in dataList" :data="item" :key="item._id"/>
    </div>
    <div :class="bottomClass" :style="bottomStyle">
      <inputBar
        ref="inputBar"
        :option="{}"
        @publish="publish"
        @uploaded="uploaded"
        @showBottom="showBottom"
        @hideBottom="hideBottom"
        @hideBottomOnPanel="hideBottomOnPanel"
      />
    </div>
  </div>
</template>

<script>
import inputBar from '@/components/inputBar'
import navHeader from '@/components/navHeader'
import chatItem from '@/components/chatItem'
import service from '@/utils/service'
import os from '@/utils/os'

export default {
  name: 'chat',
  components: {
    navHeader,
    chatItem,
    inputBar
  },
  data () {
    return {
      bottomClass: 'bottom-view',
      bottomStyle: '',
      topName: this.$route.query.name || '',
      toUserId: this.$route.query.id,
      dataList: []
    }
  },
  created () {
    if (this.$store.state.currentUser && this.$store.state.currentUser._id) {
      this.$socket.emit('login', this.$store.state.currentUser)
      this.fetchData()
    }
  },
  beforeDestroy () {
    if (this.$store.state.currentUser && this.$store.state.currentUser._id) {
      this.$socket.emit('loginout', this.$store.state.currentUser)
    }
  },
  sockets: {
    // 接收信息
    // recieveMsg就代表socket.on('recieveMsg',function(){...})，
    // 在和对方聊天时，自己发的消息直接在本地push到dataList里面，而通过recieveMsg将接收到的对方发的消息，也不断的push进去。
    recieveMsg: function (obj) {
      if (obj.formUser._id === this.toUserId) {
        this.afterCommit({
          content: obj.content,
          formUser: obj.formUser
        })
      }
    },
    // 服务端掉线之后客户端会自动重连，此事件在重连成功时触发
    // reconnect表示socket.io的一个内置事件，如果服务器因为发版或者上线需要重启，这里有一个事件来进行重连登录。
    // 客户端其他内置事件：
    // >>> connect：连接成功
    // >>> connecting：正在连接
    // >>> disconnect：断开连接
    // >>> connect_failed：连接失败
    // >>> error：错误发生，并且无法被其他事件类型所处理
    // >>> message：同服务器端message事件
    // >>> anything：同服务器端anything事件
    // >>> reconnect_failed：重连失败
    // >>> reconnect：成功重连
    // >>> reconnecting：正在重连
    reconnect: function (obj) {
      // 后端重启之后需要重新登录一次
      if (this.$store.state.currentUser && this.$store.state.currentUser._id) {
        this.$socket.emit('login', this.$store.state.currentUser)
      }
    }
  },
  methods: {
    async fetchData () {
      let resp = await service.get('message/getchathistory', {
        toUserId: this.toUserId
      })
      this.dataList = resp.data
    },
    scrollToEnd (immediate) {
      let ele = this.$refs.chatView
      if (immediate) {
        ele.scrollTop = ele.scrollHeight
        return
      }
      setTimeout(() => {
        ele.scrollTop = ele.scrollHeight
      }, 200)
    },
    // 关闭面板
    closePanel () {
      this.bottomStyle = ''
      this.bottomClass = this.bottomClass.replace(' show', '')
      this.$refs.inputBar.closePanel()
    },
    touchstart () {
      this.closePanel()
      this.$refs.inputBar.blurInput()
    },
    pxtovw (px) {
      return (px / 375 * 100) + 'vw'
    },
    // 显示/隐藏底部图片操作面板
    showBottom () {
      if (this.bottomClass.indexOf('show') > -1) {
        this.bottomStyle = ''
        // this.bottomClass = this.bottomClass.replace(' show','');
      } else {
        this.bottomClass += ' show'
      }
    },
    // 正常情况下，直接隐藏输入框即可
    hideBottom () {
      this.closePanel()
    },
    // 在图片操作面板处于展开状态时的处理逻辑
    // 问题：从图片面板状态直接进入输入时，会发现当键盘呼起时输入框被移动到了页面的最底部
    // 相关知识点：
    // >>> 如果一个元素使用了【display:fixed; bottom:0;】并且在页面底部时，如果此时键盘呼起，这个元素会被顶上来
    // >>> 如果这个元素时【input】，则无论是否使用了【fixed】都会被顶上来，在Android和iOS上都会出现，只不过iOS上会把webview也顶上来
    // >>> 可以通过在键盘呼起时将【fixed】元素隐藏，键盘收回时在显示来解决。如果把输入框input放在底部，可以正好利用这个特性来实现输入框紧贴键盘的页面布局
    // IOS出现问题的原因：
    // >>> 当图片操作面板展开时，我们的输入框其实并没有在底部，而是位于页面下半部分。
    // >>> 此时输入框获得焦点，键盘被呼起，页面被顶起来，我们这时把高度减少，就会造成页面高度减少，输入框被挤下来。
    // >>> 这个问题在android上并没有出现，原因是android并没有把页面顶起来，所以输入框始终时紧贴着键盘，无论我们怎么修改高度
    hideBottomOnPanel (h) {
      this.scrollToEnd(true) // 将聊天界面滚动到底部，看到最新的聊天内容
      // 此时图片操作面板处于展开状态时
      if (this.bottomClass.indexOf('show') > -1) {
        if (os.isIOS) {
          window.scroll(0, 70) // 将页面在顶回去  键盘高度-图片操作面板高度+输入框高度
        } else {
          this.closePanel() // Android无需修改，直接将图片操作面板隐藏即可
        }
      }
    },
    afterCommit (obj) {
      this.dataList.push(obj)
      this.$nextTick(() => {
        this.scrollToEnd()
      })
    },
    async publish (obj) {
      if (!obj.value) return
      let o = {
        toUser: this.toUserId,
        content: { type: 'str', value: obj.value }
      }
      let resp = await service.post('message/addmsg', o)
      this.afterCommit({
        content: { type: 'str', value: obj.value },
        formUser: this.$store.state.currentUser,
        mine: true
      })
      if (resp.code !== 0) {
        weui.topTips('发送失败!')
      }
    },
    async uploaded (obj) {
      let o = {
        toUser: this.toUserId,
        content: { type: 'pic', value: obj.data }
      }
      let resp = await service.post('message/addmsg', o)
      this.afterCommit({
        content: { type: 'pic', value: obj.data },
        formUser: this.$store.state.currentUser,
        mine: true
      })
      if (resp.code !== 0) {
        weui.topTips('发送失败！')
      }
    }
  }
}
</script>

<style scoped>
  .container {
    display: flex;
    position: absolute;
    right: 0;
    left: 0;
    top: 0;
    bottom: 0;
    flex-direction: column;
  }
  .bottom-view {
    width: 100%;
    height: 56px;

    overflow: hidden;
    transition: height 200ms;
  }
  .bottom-view.show {
    width: 100%;
    height: 285px;
  }
  .chat-view {
    padding-top: 64px;
    flex: 1;
    background-color: rgb(237, 237, 237);

    overflow: auto;
    -webkit-overflow-scrolling: touch; /* 表示在iOS上，使用顺滑滚动，有弹性 */
    padding-bottom: 30px;
  }
</style>
