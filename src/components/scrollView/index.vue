<template>
  <div class="scrollview">
    <slot></slot>
    <div class="weui-loadmore" v-show="!isend">
      <i class="weui-loading"></i>
      <span class="weui-loadmore__tips">正在加载</span>
    </div>
    <div class="weui-loadmore weui-loadmore_line weui-loadmore_dot" v-show="isend">
      <span class="weui-loadmore__tips"></span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'scrollView',
  props: {
    readyToLoad: Boolean, // 是否可以发起下一次滚动加载请求
    isend: Boolean // 用来控制是否还可以在继续滚动加载 (当数据没有时，就无法滚动加载了)，同时控制 loading 的显示和隐藏。
  },
  data () {
    return {
      showOpera: false
    }
  },
  mounted () {
    window.addEventListener('scroll', this.onLoadPage.bind(this))
  },
  beforeDestroy () {
    window.removeEventListener('scroll', this.onLoadPage.bind(this))
  },
  methods: {
    onLoadPage () {
      let clientHeight = document.documentElement.clientHeight // 获取 clientHeight --- 可见区域的高度
      let scrollHeight = document.body.scrollHeight // 获取 scrollHeight --- 获取一个元素的所含内容的高度
      // 获取scrollTop --- 获取或设置元素的内容向上滚动的像素值,注意需要兼容一下，某些机型的document.documentElement.scrollTop可能为0
      let scrollTop = document.documentElement.scrollTop || document.body.scrollTop
      this.$emit('scroll', scrollTop) // 通知父组件触发滚动事件
      let proLoadDis = 30 // 通知距离底部还有多少px的阈值
      // 判断是否页面滚动到底部
      if ((scrollTop + clientHeight) >= (scrollHeight - proLoadDis)) {
        if (!this.isend) { // 是否已经滚动到最后一页
          if (!this.readyToLoad) { return } // 判断在一个api请求未完成时不能触发第二次滚动到底部的回调
          this.$emit('loadCallback') // 通知父组件触发滚动到底部事件
        }
      }
    }
  }
}
</script>

<style scoped></style>
