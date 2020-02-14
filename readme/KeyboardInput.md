# 移动端键盘高度问题

[《慕课网专栏 - 从0到1 实战朋友圈移动Web App开发》](https://www.imooc.com/read/42)笔记

在移动 web 中使用 `<input>` 框时，与键盘相关的交互一直只一个比较头疼的问题，因为 javascript 并没有相关的接口可以操作或者获取到键盘相关的数据，唯一可以用的就是借助 `<input>` 输入框当获取到焦点时，会弹出一个键盘，并抛出一个 onfocus 事件，而且弹出键盘的表现在 iOS 和 android 系统中都有不同的表现：

+ 在 iOS 中：

假如输入框在屏幕的下半部分，当键盘弹出时，页面会被 “顶” 上去，这个是 webview 的默认行为，webview 会向上滚动至输入框可见的位置。

而顶上去的距离则取决于你的输入框距离屏幕底部的距离，越靠下则被顶上去越多，越靠上则越少。
假如输入框在屏幕上半部分，则不会被 “顶” 上去。

+ 在 android 中：

则不会发生页面被顶上去的情况，键盘弹出后，会覆盖挡住一定的页面元素，页面的可视区域会变小。

## 获取键盘高度

页面会被顶上去，但是却可以借助于这种特性，判断可视区域的变化，我们可以利用 window.innerHeight 在键盘弹出前后的差值来获取到键盘的高度。

``` javascript
created () {
  //在获取焦点前获取到`window.innerHeight`即`this.windowHeightOrgin`
  this.windowHeightOrgin = window.innerHeight
},
...
onfocus () {
  //input的onfocus则代表键盘弹出了
  setTimeout(() => {
    //在键盘弹出后利用延时，再次获取`window.innerHeight`，差值则表示键盘高度
    window.keyboardHeight = this.windowHeightOrgin - window.innerHeight
  }, 200)
},
```

## 兼容没有获取键盘高度的情况

由于必须在键盘呼起一次才能得到键盘的高度，所以在用户还没有这个操作前我们还得不到键盘高度，所以可以设置一些默认高度

常见的 iOS 机型设置一些默认的键盘高度默认值：

``` javascript
const u = navigator.userAgent
const isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1
const isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)
const isIpP = window.screen.height == 736 && window.screen.width == 414
export default {
  isIOS: isIOS,
  isAndroid: isAndroid,
  isIpP: isIpP,
  // 兼容没有获取键盘高度的情况 --- 常见的 iOS 机型的一些默认的键盘高度默认值
  getKeyBoardHeightDefault: function () {
    if (isIOS) {
      let screen = window.screen
      if (screen.height == 812 && screen.width == 375) { // iphone x
        return 377
      } else if (screen.height == 736 && screen.width == 414) { // iphone plus
        return 315
      } else if (screen.height == 667 && screen.width == 375) { // iphone 678
        return 304
      } else if (screen.height == 568 && screen.width == 320) { // iphone 5 se
        return 220
      } else {
        return 304
      }
    } else {
      return 304
    }
  }
}
```
