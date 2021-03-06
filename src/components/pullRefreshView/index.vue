<template>
  <div class="pullRefreshView" @touchmove="touchmove" @touchstart="touchstart" @touchend="touchend">
    <div ref="circleIcon" class="circle-icon">
      <div ref="circleIconInner" class="circle-icon-inner"></div>
    </div>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'pullRefreshView',
  data () {
    return {
      pullRefresh: {
        dragStart: null, // 开始抓取标志位
        percentage: 0, // 拖动量的百分比
        dragThreshold: 0.3, // 临界值，
        moveCount: 200, // 位移系数，可以调节圆形图片icon运动的速率
        joinRefreshFlag: null // 进入刷新状态标志位，为了在touchend时有标示可以判断
      }
    }
  },
  methods: {
    touchstart (evt) {
      this.pullRefresh.dragStart = event.targetTouches[0].clientY // 手指接触屏幕起始时，记录一下位置
      this.$refs.circleIcon.style.webkitTransition = 'none' // 将圆形icon的动画效果先隐藏
    },
    // touchmove - 主要根据手指移动的量来实时将圆形 icon 移动并旋转
    // 1. 我们的下拉刷新触发的时机是在页面处于屏幕顶部并且手指向下拖动，这两个条件，缺一不可，在代码中，我们利用 scrollTop == 0 和 this.pullRefresh.percentage < 0 来判断。
    // 2. 在进入下拉刷新状态时，此时手指不断向下拖动，首先圆形 icon.circleIcon 会向下滚动并旋转，当滚动到临界值时就只原地旋转。
    // 3. 如果手指在向上拖动，圆形 icon.circleIcon 就会向上滚动并旋转。
    // 4. 直到手指离开屏幕前，都不会触发下拉刷新，只是圆形 icon.circleIcon 在不停的上下移动。
    touchmove (evt) {
      // 如果没有 touchstart设置的值，说明没进入下拉状态，不影响正常的滚动
      if (this.pullRefresh.dragStart === null) return
      let target = evt.targetTouches[0] // 获取手指的一个target
      // 根据起始位置和屏幕高度计算一个相对位移量，正值为向上拖动，负值为向下拖动
      this.pullRefresh.percentage = (this.pullRefresh.dragStart - target.clientY) / window.screen.height
      // 获取scrollTop，为了判断是否在页面顶部
      let scrollTop = document.documentElement.scrollTop || document.body.scrollTop
      if (scrollTop === 0) {
        // 当页面处于顶部时，才能进入下拉刷新的逻辑
        if (this.pullRefresh.percentage < 0 && evt.cancelable) {
          // 当向下拖动时，才能进入下拉刷新的逻辑
          // cancelable 事件返回一个布尔值。如果用 preventDefault() 方法可以取消与事件关联的默认动作，则为 true，否则为 fasle。
          // 在许多事件的监听回调中调用preventDefault()前，都需要检查 cancelable 属性的值。
          evt.preventDefault()
          this.pullRefresh.joinRefreshFlag = true // 将进入 下拉刷新 刷新标志位置为true
          let translateY = -this.pullRefresh.percentage * this.pullRefresh.moveCount // 根据moveCount速率系数计算位移的量
          // 当位移到一定程度，还没达到临界值时，不断去位移和旋转圆形icon
          if (Math.abs(this.pullRefresh.percentage) <= this.pullRefresh.dragThreshold) {
            let rotate = translateY / 30 * 360 // 计算圆形icon旋转的角度
            // 位移和旋转圆形icon，利用translate3d和rotate属性
            this.$refs.circleIcon.style.webkitTransform = `translate3d(0, ${translateY}px, 0) rotate(${rotate}deg)`
          }
        } else {
          // 向上拖动就没有进入下拉，要清除下拉刷新刷新标志位true
          if (this.pullRefresh.joinRefreshFlag == null) {
            this.pullRefresh.joinRefreshFlag = false
          }
        }
      } else {
        // 清除下拉刷新刷新标志位true
        if (this.pullRefresh.joinRefreshFlag == null) {
          this.pullRefresh.joinRefreshFlag = false
        }
      }
    },
    // touchend --- 主要是做一些动画执行的操作
    // 1. 此时手指离开屏幕，位移量达到临界值时，并且也有进入下拉刷新的标志位，就表明要触发正在刷新。此时圆形 icon 原地旋转，并触发下拉刷新回调方法，延迟 700ms 后向上收起。
    // 2. 我们在实现圆形 icon 时的旋转和位移动画时，用了两个 div，在 touchmove 时，我们主要对外层的 div 也就是 ref=circleIcon，来实现位移和旋转。
    // 3. 在 touchend 时，我们主要给内层的 div 也就是 ref=circleIconInner 来加 animation 动画，因为无法给一个 div 同时使用位移旋转和 animation 动画，所以这里一个技巧就是给父元素设置位移和旋转，它的子元素在不设置任何 CSS 动画样式时，是会随着父元素而生效的。
    touchend (evt) {
      // 如果没有 touchstart设置的值，说明没进入下拉状态，不影响正常的滚动
      if (this.pullRefresh.percentage === 0) return
      // 在手指离开时，位移量达到临界值时，并且也有进入下拉刷新的标志位，就表明要触发正在刷新
      if (Math.abs(this.pullRefresh.percentage) > this.pullRefresh.dragThreshold && this.pullRefresh.joinRefreshFlag) {
        this.$emit('onRefresh') // 触发刷新
        this.$refs.circleIconInner.classList.add('circle-rotate') // 给circleIconInner一个正在旋转的动画，利用css的animation实现
        // 700ms之后，动画结束，收起
        setTimeout(() => {
          this.$refs.circleIconInner.classList.remove('circle-rotate')
          this.$refs.circleIcon.style.webkitTransition = '330ms'
          this.$refs.circleIcon.style.webkitTransform = 'translate3d(0,0,0) rotate(0deg)'
        }, 700)
      } else {
        // 在手指离开时，位移量没有达到临界值，就自动收回，通过transition，设定一个终止值即可。
        if (this.pullRefresh.joinRefreshFlag) {
          this.$refs.circleIcon.style.webkitTransition = '330ms'
          this.$refs.circleIcon.style.webkitTransform = 'translate3d(0,0,0) rotate(0deg)'
        }
      }
      this.pullRefresh.joinRefreshFlag = null // 重置joinRefreshFlag
      this.pullRefresh.dragStart = null // 重置percentage
      this.pullRefresh.percentage = 0 // 重置percentage
    }
  }
}

</script>

<style scoped>
  .circle-icon {
    position: absolute;
    left: 10px;
    top: -30px;
  }

  .circle-icon-inner {
    width: 25px;
    height: 25px;
    background-image: url('./img/circle.png');
    background-size: cover;
  }

  .circle-rotate {
    animation: xuzhuan .8s linear infinite;
  }

  @keyframes xuzhuan {

    0% {
      transform: rotate(0deg);
    }

    25% {
      transform: rotate(90deg);
    }

    50% {
      transform: rotate(180deg);
    }

    75% {
      transform: rotate(270deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }

</style>
