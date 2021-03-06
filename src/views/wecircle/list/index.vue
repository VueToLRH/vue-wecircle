<template>
  <div class="list-content" @touchstart="touchstart($event)">
    <scrollView
      @loadCallback="loadCallback"
      :isend="isend"
      :readyToLoad="readyToLoad"
      @scroll="scroll"
    >
      <ul>
        <li v-for="(item,index) in dataList" :key="index">
          <postItem :data="item"></postItem>
        </li>
      </ul>
    </scrollView>
  </div>
</template>

<script>
import postItem from '@/components/postItem'
import scrollView from '@/components/scrollView'
import service from '@/utils/service'
import formatTime from '@/utils/formatTime'

export default {
  name: 'list',
  components: {
    postItem,
    scrollView
  },
  data () {
    return {
      isend: false,
      readyToLoad: true, // 是否可以发起下一次滚动加载请求
      pageStart: 0,
      scrollTop: 0,
      lessDataFlag: false // 数据较少标识
    }
  },
  computed: {
    dataList () {
      return this.$store.state.wecircleDataList
    }
  },
  async created () {
    // 第一次进入，要发起请求
    if (!this.dataList.length) {
      this.refresh()
    }
    // 刚发表完成，立刻刷新一下列表
    if (this.$router.justPub) {
      this.refresh()
      this.$router.justPub = false
    }
  },
  methods: {
    scroll (top) {
      if (top <= 100) {
        this.$bus.$emit('hideHeader')
      } else {
        this.$bus.$emit('showHeader')
      }
    },
    refresh () {
      this.pageStart = 0
      this.$store.dispatch('setWecircleDataList', { first: true })
      this.fetchData()
    },
    touchstart (evt) {
      if (evt.target.classList.contains('opera-box')) {
        return
      }
      if (evt.target.classList.contains('comment-icon') || evt.target.classList.contains('comment-text')) {
        return
      }
      if (evt.target.classList.contains('like-icon') || evt.target.classList.contains('like-text')) {
        return
      }
      // 在开始滚动时 要把 评论输入框和 点赞评论面板 隐藏
      this.$store.dispatch('closeCLPanel', true)
      this.$bus.$emit('showInput', false, this.data)
    },
    async fetchData () {
      this.readyToLoad = false // 是否可以发起下一次滚动加载请求的标志位
      let resp = await service.get('post/getcirclepost', {
        pageStart: this.pageStart
      })
      this.formatData(resp.data)
    },
    formatData (result) {
      let array = []
      result.forEach(item => {
        array.push({
          id: item._id, // post的id
          avatar: item.user.avatar, // 头像url
          nickname: item.user.nickname, // 昵称
          content: item.content, // 内容
          piclist: item.picList, // 图片内容
          comments: item.comments, // 评论数据
          time: formatTime(new Date(item.create).getTime() / 1000), // 将后台返回的GMT时间转变成本地时间
          isLike: item.isLike, // 是否本人已经点赞
          likes: item.likes, // 点赞的数据
          user: item.user // 发表者的数据
        })
      })
      this.$store.dispatch('setWecircleDataList', array) // 通过vuex改变列表的数据
      // 如果返回的数据为空，证明没有数据了，就把停止滚动加载标志位只为true
      if (result.length === 0) {
        this.isend = true
      }
      // 如果第一页并且第一屏的数据太少，就自动再发一次请求，避免内容高度不够，无法触发滚动加载
      if (this.pageStart === 0 && result.length < 4 && !this.lessDataFlag) {
        this.loadCallback()
        this.lessDataFlag = true
      }
      this.readyToLoad = true // 重制是否可以发起下一次滚动加载请求的标志位
    },
    loadCallback () {
      this.pageStart++
      this.fetchData()
    }
  }
}
</script>
