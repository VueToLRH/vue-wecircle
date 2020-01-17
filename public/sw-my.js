// service worker 用了offline-plugin之后，这个文件就不使用了
// Service Worker 是一个 基于HTML5 API，也是PWA技术栈中最重要的特性。
// >>> 它在 Web Worker 的基础上加上了持久离线缓存和网络代理能力，
// >>> 结合Cache API面向提供了JavaScript来操作浏览器缓存的能力，这使得Service Worker和PWA密不可分。

// Service Worker概述：
// >>> 1. 一个独立的执行线程，单独的作用域范围，单独的运行环境，有自己独立的context上下文。
// >>> 2. 一旦被 install，就永远存在，除非被手动 unregister。即使Chrome（浏览器）关闭也会在后台运行。利用这个特性可以实现离线消息推送功能。
// >>> 3. 处于安全性考虑，必须在 HTTPS 环境下才能工作。当然在本地调试时，使用localhost则不受HTTPS限制。
// >>> 4. 提供拦截浏览器请求的接口，可以控制打开的作用域范围下所有的页面请求。需要注意的是：
// >>>   ***【一旦请求被Service Worker接管，意味着任何请求都由你来控制，一定要做好容错机制，保证页面的正常运行。】***
// >>> 5. 由于是独立线程，Service Worker不能直接操作页面 DOM。但可以通过事件机制来处理。例如使用postMessage

// Service Worker生命周期：
// >>> 注册 (register)：这里一般指在浏览器解析到JavaScript有注册Service Worker时的逻辑，即调用navigator.serviceWorker.register()时所处理的事情。
// >>> 安装中 ( installing )：这个状态发生在 Service Worker 注册之后，表示开始安装。
// >>> 安装后 ( installed/waiting )：Service Worker 已经完成了安装，这时会触发install事件，在这里一般会做一些静态资源的离线缓存。如果还有旧的Service Worker正在运行，会进入waiting状态，如果你关闭当前浏览器，或者调用self.skipWaiting()，方法表示强制当前处在 waiting 状态的 Service Worker 进入 activate 状态。
// >>> 激活 ( activating )：表示正在进入activate状态，调用self.clients.claim()会来强制控制未受控制的客户端，例如你的浏览器开了多个含有Service Worker的窗口，会在不切的情况下，替换旧的 Service Worker 脚本不再控制着这些页面，之后会被停止。此时会触发activate事件。
// >>> 激活后 ( activated )：在这个状态表示Service Worker激活成功，在activate事件回调中，一般会清除上一个版本的静态资源缓存，或者其他更新缓存的策略。这代表Service Worker已经可以处理功能性的事件: 【fetch (请求)、sync (后台同步)、push (推送)，message（操作dom）。】
// >>> 废弃状态 ( redundant )：这个状态表示一个 Service Worker 的生命周期结束。

var cacheName = 'bs-0-2-0' // 定义缓存的key值
// 定义需要缓存的文件
var cacheFiles = [
  './lib/slider/slider.js',
  './lib/weui/weui.min.js',
  './lib/weui/weui.min.css'
]

// 标准的web worker的编程方式，由于运行在另一个全局上下文中（self），这个全局上下文不同于window，所以我们采用self.addEventListener()。
// Cache API是由Service Worker提供用来操作缓存的的接口，这些接口基于Promise来实现，包括了Cache和Cache Storage
// >>> Cache直接和请求打交道，为缓存的 Request / Response 对象对提供存储机制，
// >>> CacheStorage 表示 Cache 对象的存储实例，我们可以直接使用全局的caches属性访问Cache API。

// Cache相关API说明：
// >>> Cache.match(request, options) 返回一个 Promise对象，resolve的结果是跟 Cache 对象匹配的第一个已经缓存的请求。
// >>> Cache.matchAll(request, options) 返回一个Promise 对象，resolve的结果是跟Cache对象匹配的所有请求组成的数组。
// >>> Cache.addAll(requests) 接收一个URL数组，检索并把返回的response对象添加到给定的Cache对象。
// >>> Cache.delete(request, options) 搜索key值为request的Cache 条目。如果找到，则删除该Cache 条目，并且返回一个resolve为true的Promise对象；如果未找到，则返回一个resolve为false的Promise对象。
// >>> Cache.keys(request, options) 返回一个Promise对象，resolve的结果是Cache对象key值组成的数组。

// 监听install事件，安装完成后，进行文件缓存
self.addEventListener('install', function (e) {
  console.log('Service Worker 状态： install')
  // 找到 key 对应的缓存 并且 获得可以操作的cache对象
  var cacheOpenPromise = caches.open(cacheName).then(function (cache) {
    return cache.addAll(cacheFiles)
  })
  e.waitUntil(cacheOpenPromise) // 将promise对象传给event
})

// 监听activate（激活）事件，激活后通过cache的key来判断是否更新cache中的静态资源
// 一旦请求被Service Worker接管，浏览器的默认请求就不再生效了，
// 请求的发与不发，出错与否全部由自己的代码控制，当缓存失效或者发生内部错误时，及时调用fetch重新在发起请求。
self.addEventListener('active', function (e) {
  console.log('Service Worker 状态： active')
  // 遍历当前scope使用的key值
  var cachePromise = caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (key) {
      // 如果新获取到的key和之前缓存的key不一致，就删除之前版本的缓存
      if (key !== cacheName) {
        return caches.delete(key)
      }
    }))
  })
  e.waitUntil(cachePromise) // 将promise对象传给event
  return self.clients.claim() // 保证第一次加载fetch触发
})

// >>> 每当已安装的Service Worker页面被打开时，便会触发Service Worker脚本更新。
// >>> 当上次脚本更新写入Service Worker数据库的时间戳与本次更新超过24小时，便会触发Service Worker脚本更新。
// >>> 当sw-my.js文件改变时，便会触发Service Worker脚本更新。

// 更新流程与安装类似，只是在更新安装成功后不会立即进入active状态，更新后的Service Worker会和原始的Service Worker共同存在，并运行它的install，一旦新Service Worker安装成功，它会进入wait状态，需要等待旧版本的Service Worker进/线程终止。
// >>> self.skipWaiting()可以阻止等待，让新Service Worker安装成功后立即激活。
// >>> self.clients.claim()方法来让没被控制的 clients 受控，也就是设置本身为activate的Service Worker。

// 监听fetch事件来使用缓存数据
self.addEventListener('fetch', function (e) {
  console.log('现在正在请求：' + e.request.url)
  e.respondWith(
    // 判断当前请求是否需要缓存
    caches.match(e.request).then(function (cache) {
      return caches || fetch(e.request) // 有缓存就用缓存，没有就从新发请求获取
    }).catch(function (err) {
      console.log(err)
      return fetch(e.request) // 缓存报错还直接从新发请求获取
    })
  )
})

/* ============== */
/* push处理相关部分 */
/* ============== */
// 添加service worker对push的监听
self.addEventListener('push', function (e) {
  var data = e.data
  if (e.data) {
    data = data.json()
    console.log('push的数据为：', data)
    self.registration.showNotification(data.text)
  } else {
    console.log('push没有任何数据')
  }
})
/* ============== */
