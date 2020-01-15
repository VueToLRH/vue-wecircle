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
