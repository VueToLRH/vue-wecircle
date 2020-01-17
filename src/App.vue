<template>
  <div id="app">
    <transition
      :enter-active-class="transitionNameIn"
      :leave-active-class="transitionNameOut"
      :duration="duration"
      @beforeEnter="beforeEnter"
      @afterEnter="afterEnter">
      <router-view></router-view>
    </transition>
  </div>
</template>

<script>
import os from '@/utils/os'

export default {
  name: 'App',
  data () {
    return {
      transitionNameOut: '',
      transitionNameIn: '',
      duration: ''
    }
  },
  watch: {
    // 使用watch 监听$router的变化
    $route (to, from) {
      this.duration = 500 // 持续时间
      if (to.name === 'publish' || to.name === 'login') { // 从下往上切换
        this.transitionNameIn = 'animated faster slideInUp'
        this.transitionNameOut = 'slideOutIng'
        // 由于页面切换动画大部分是基于 css3 的 transform 位移属性，所以当页面比较长时可能会出现页面跳动的情况，
        // 尤其在从下往上的动画中，所以可以在transitionNameOut上一个页面即将离开时，
        // 将页面设置成绝对定位，切换完成后在复原，来 hack 解决一下
      } else if (from.name === 'publish' || from.name === 'login') {
        this.transitionNameIn = ''
        this.transitionNameOut = 'animated faster slideOutDown'
      } else { // 从左往右切换
        if (this.$router.backFlag) { // 后退
          this.transitionNameOut = 'animated faster slideOutRight'
          this.transitionNameIn = 'animated faster slideInLeft'
        } else { // 前进
          this.transitionNameIn = 'animated faster slideInRight'
          this.transitionNameOut = 'animated faster slideOutLeft'
        }
      }
      this.$router.backFlag = false // 重置返回的标志位
    }
  },
  created () {
    window.windowHeightOrgin = window.innerHeight
    window.keyboardHeight = os.getKeyBoardHeightDefault() - (window.screen.height - window.windowHeightOrgin)
  },
  methods: {
    beforeEnter () {},
    afterEnter () {}
  }
}
</script>

<style lang="less">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.slideOutIng {
  position: absolute;
  left: 0;
  right: 0;
}
</style>
