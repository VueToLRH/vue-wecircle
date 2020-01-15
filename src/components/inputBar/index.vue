<template>
  <div class="wrap scale-1px-top">
    <div class="input-content scale-1px">
      <div class="input-wrap">
        <input ref="input" class="weui-input input-inner" maxlength="40" @focus="onfocus" @blur="onblur" type="text" placeholder="请输入文本">
      </div>
      <div class="face-btn" v-show="false"></div>
      <div class="plus-btn" @click="showPanel" v-show="!option.noPlus"></div>
      <div class="create-btn weui-btn weui-btn_mini weui-btn_primary" @click="publish">发表</div>
    </div>
    <div class="opera-panel" v-show="!option.noPlus">
      <div class="opera-item">
        <div class="item-icon" @click="upload"></div>
        <p class="item-text">照片</p>
        <div style="display:none;" id="uploader">
          <input ref="uploader" id="uploaderInput" class="weui-uploader__input" type="file" accept="image/*" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 在移动 web 中使用 <input> 框时，与键盘相关的交互一直只一个比较头疼的问题，因为 javascript 并没有相关的接口可以操作或者获取到键盘相关的数据，
// 唯一可以用的就是借助 <input> 输入框当获取到焦点时，会弹出一个键盘，并抛出一个 onfocus 事件，而且弹出键盘的表现在 iOS 和 android 系统中都有不同的表现：
// >>> IOS
// >>> 1.假如输入框在屏幕的下半部分，当键盘弹出时，页面会被 “顶” 上去，这个是 webview 的默认行为，webview 会向上滚动至输入框可见的位置。
// >>> 2. 而顶上去的距离则取决于你的输入框距离屏幕底部的距离，越靠下则被顶上去越多，越靠上则越少。
// >>> 3.假如输入框在屏幕上半部分，则不会被 “顶” 上去。
// >>> Android: 不会发生页面被顶上去的情况，键盘弹出后，会覆盖挡住一定的页面元素，页面的可视区域会变小。

import {
  getCookie
} from '@/utils/cookie'
import service from '@/utils/service'

export default {
  name: 'inputBar',
  props: {
    data: Object,
    option: Object
  },
  data () {
    return {
      disabled: false,
      currentData: {},
      uploadCount: 0,
      panelShow: false
    }
  },
  mounted () {
    let self = this
    weui.uploader('#uploader', {
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
          return false // 阻止文件添加
        }
        if (this.size > 10 * 1024 * 1024) {
          weui.alert('请上传不超过10M的图片')
          return false
        }
        if (files.length > 1) { // 防止一下子选择过多文件
          weui.alert('最多只能上传1张图片，请重新选择')
          return false
        }
      },
      onBeforeSend: function (data, headers) {
        headers['wec-access-token'] = getCookie('token')
      },
      onSuccess: function (ret) {
        self.$emit('uploaded', ret) // 上传图片回调
      }
    })
  },
  methods: {
    // 触发图片上传的回调
    upload () {
      this.$refs.uploader.click()
    },
    // 发表内容的回调
    publish () {
      if (this.$refs.input.value) {
        this.$emit('publish', {
          value: this.$refs.input.value,
          data: this.currentData
        })
        this.$refs.input.values = ''
      }
    },
    // 打开图片操作面板
    showPanel () {
      this.panelShow = true
      this.$emit('showBottom')
    },
    // 关闭图片操作面板
    closePanel () {
      this.panelShow = false
    },
    // 暴露给外层组件的方法，目的是让外层组件可以将 inputBar 关闭
    blurInput () {
      this.$refs.input.blur()
    },
    // 暴露给外层组件的方法，目的是让外层组件可以将 inputBar 呼起
    // 在移动端尤其是 iOS，如果我们想用 javascript 代码（非人工手动交互）的方式呼起一个键盘，就是直接在代码中调用 <input> 的 focus() 方法，原则上 webview 是不允许的
    // 原因：为了避免代码无线循环会导致一直弹出键盘很不友好，但是通过对 webview 进行定制 KeyboardDisplayRequiresUserAction=true 可以解决这个问题，而达到效果，但是这需要修改 webview 的代码，所以目前至少在 Safari 上是不行的。
    // 解决方法：系统虽然不能直接让我们通过代码方式呼起键盘，但是可以把呼起键盘的 focus() 方法代码调用放在一个 click 的回调里面，或者是其他通过用户真实手指交互行为的方法回调里面，中间不能有任何异步操作例如 setTimeout，就可以呼起键盘。正如代码里将用户点击评论按钮的回调利用起来，在这里呼起键盘。
    focusInput (currentData) {
      this.currentData = currentData
      this.$refs.input.focus()
    },
    onblur () {
      // 在朋友圈时，失去焦点要关闭评论框
      setTimeout(() => {
        this.$bus.$emit('showInput', false, this.data)
      }, 90)
    },
    onfocus () {
      // 这段代码用来获取键盘高度，所以必须满足键盘在页面底部, noplus --- 代表没有底部的操作面板
      if (!this.option.noPlus) {
        setTimeout(() => {
          // 键盘在页面底部时在获取
          if (!this.panelShow) {
            // 键盘呼起前 减去 键盘呼起后
            let kh = window.windowHeightOrgin - window.innerHeight
            if (kh > 0) {
              // 由于一些webview上下底部有导航栏，所以我们需要剪去这部分高度
              window.keyboardHeight = kh - (window.screen.height - window.windowHeightOrgin)
            }
          }
          this.$emit('hideBottomOnPanel')
        }, 200)
      }
    }
  }
}

</script>

<style scoped>
  .wrap {
    background-color: #f6f6f6;
  }

  .input-content {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 56px;
  }

  .opera-panel {
    height: 230px;
    width: 100%;
    display: flex;
  }

  .opera-item {
    width: 66px;
    height: 90px;
    display: flex;
    justify-content: center;
    flex-direction: column;
    margin: 12px;
  }

  .item-text {
    color: rgb(133, 133, 133);
    font-size: 13px;
    margin-top: 7px;
  }

  .item-icon {
    width: 60px;
    height: 60px;
    background-color: #fff;
    background-image: url('./img/photo.png');
    background-size: 26px 26px;
    background-position: center;
    background-repeat: no-repeat;
    border-radius: 7px;
  }

  .face-btn {
    width: 28px;
    height: 28px;
    background-image: url('./img/face.png');
    background-size: cover;
    margin-left: 7px;
  }

  .plus-btn {
    width: 28px;
    height: 28px;
    background-image: url('./img/plus.png');
    background-size: cover;
    margin-left: 7px;
  }

  .create-btn {
    margin-left: 7px;
    padding: 0 9px;
    margin-right: 7px;
  }

  .input-wrap {
    flex: 1;
    background-color: #fff;
    border-radius: 4px;
    height: 40px;
    margin-left: 11px;
  }

  .input-inner {
    height: 100%;
    font-size: 18px;
    padding-left: 7px;
    padding-right: 7px;
  }

</style>
