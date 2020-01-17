/* eslint-disable */

import * as OfflinePluginRuntime from 'offline-plugin/runtime'
import service from '@/utils/service'

OfflinePluginRuntime.install({
  onUpdateReady: () => {
    OfflinePluginRuntime.applyUpdate()  // 更新完成之后，调用applyUpdate即 skipwaiting()方法
    // self.skipWaiting()可以阻止等待，让新Service Worker安装成功后立即激活。
  },
  onUpdated: () => {
    weui.confirm('发现新版本，是否更新？', () => {
      window.location.reload() // 刷新页面
    }, () => {}, { title: '' })
  }
})

if (!navigator.serviceWorker) {
  weui.topTips('请使用指定浏览器，体验前沿技术')
}

// Web Push前端逻辑
navigator.serviceWorker && navigator.serviceWorker.ready.then((registration) => {
  // publicKey和后台的publicKey对应保持一致
  const publicKey = 'BAWz0cMW0hw4yYH-DwPrwyIVU0ee3f4oMrt6YLGPaDn3k5MNZtqjpYwUkD7nLz3AJwtgo-kZhB_1pbcmzyTVAxA' // 和后台保持一致
  // 获取订阅请求（浏览器会弹出一个确认框，用户是否同意消息推送）
  try {
    if (window.PushManager) {
      // 1. 通过registration.pushManager.getSubscription()先要确定用户是否已经订阅过，就是是否已经获取过标识，
      // 然后得到的subscription就是我们要的标识。（后面将subscription代替标识）。
      registration.pushManager.getSubscription().then(subscription => {
        // 如果用户没有订阅 并且是一个登录用户
        // 通过registration.pushManager.subscribe()可以拿到subscription，在调用这个方法的时候，浏览器就会询问用户是否接受订阅
        if (!subscription && window.localStorage.getItem('cuser')) {
          const subscription = registration.pushManager.subscribe({
            userVisibleOnly: true, // 表明该推送是否需要显性地展示给用户，即推送时是否会有消息提醒。如果没有消息提醒就表明是进行“静默”推送。在Chrome中，必须要将其设置为true，否则浏览器就会在控制台报错
            applicationServerKey: urlBase64ToUint8Array(publicKey)// web-push定义的客户端的公钥，用来和后端的web-push对应，需要进行一次转换
          })
            .then(function (subscription) {
              // 用户同意
              weui.topTips('获取到subscription')
              // console.log(JSON.stringify(subscription))
              if (subscription && subscription.endpoint) {
                // 通过 service 发请求到后台存储, 存入数据库。对于每一个客户端来说subscription都是唯一的。
                let resp = service.post('users/addsubscription', {
                  subscription: JSON.stringify(subscription)
                })
              }
            })
            .catch(function (err) {
              // 用户不同意或者生成失败
              weui.topTips(err)
            })
        } else { // 用户已经订阅过
          weui.topTips('已经订阅过')
        }
      })
    }
  } catch (err) {
    console.log(err)
  }
})

function urlBase64ToUint8Array (base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
