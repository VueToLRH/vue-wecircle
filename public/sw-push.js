
// 用了offline-plugin之后，dist之后这个文件会合并在sw.js里

// 在 Service Worker 里注册push事件来接收push请求。
// 添加service worker对push的监听
self.addEventListener('push', function (e) {
  var data = e.data
  if (e.data) {
    data = data.json()
    e.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body || '', // 消息的实体，可以不传。
        icon: data.img || 'https://app.nihaoshijie.com.cn/img/icons/apple-touch-icon-180x180-1-touming.png', // 配置消息的图片，会出现在消息里面。
        // 配置消息的操作项，在结合notificationclick事件可以实现消息的点击交互。
        actions: [{
          action: 'go-in',
          title: '进入程序' // 消息的标题，属于必传的值。
        }]
      })
    )
  } else {
    console.log('push没有任何数据')
  }
})

// 在 Notification 添加点击事件实现完整消息流程
self.addEventListener('notificationclick', function (e) {
  var action = e.action
  e.waitUntil(
    // 获取所有clients
    self.clients.matchAll().then(function (clientList) {
      // 如果有窗口正在使用，就切换到这个窗口
      if (clientList.length > 0) {
        return clientList[0].focus()
      }
      // 如果需要进入程序就新开一个窗口
      if (action === 'go-in') {
        return self.clients.openWindow('https://app.nihaoshijie.com.cn/index.html#/mypage')
      }
    })
  )
  e.notification.close()
})
