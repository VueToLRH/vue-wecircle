var webpush = require('web-push');
var Subscription = require('../models/Subscription');

// 在第一次部署时只生产1次即可，后面不要在调用此方法
// var vapidKeys = webpush.generateVAPIDKeys()

var vapidKeys = {
  publicKey: 'BAWz0cMW0hw4yYH-DwPrwyIVU0ee3f4oMrt6YLGPaDn3k5MNZtqjpYwUkD7nLz3AJwtgo-kZhB_1pbcmzyTVAxA',
  privateKey: 'BJ_V2wtPYaVCl7EfGAkVxXB2ft9cTgw-b5lM2ggc8lo'
};

webpush.setVapidDetails(
  'mailto:example@yourdomain.org',//不需要邮箱通知的话这里可以随意填
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

module.exports = async function (userid, data) {
  // 国内使用的话，需要设置代理才行
  // 由于我们使用的推送服务器是基于谷歌的FCM，这个服务在国内是无法使用的（或者说有时可用有时不可用），
  // 所以我们需要设置一个代理，当然网上有很多免费的国外代理，可以在http://www.freeproxylists.net/zh/hk.html找找，如果想要稳定一点的可以掏钱买一个 VPN 服务。
  var option = {
    proxy: 'http://43.250.124.98:9001'
    // http://www.freeproxylists.net/zh/hk.html，https://www.baibianip.com/home/free.html 如果不能使用，请定期更换
  };
  // 从数据库中找到subscription
  var obj = await Subscription.findOne({
    userid: userid
  }).exec();
  console.log('检查是否有可推送的subscription');
  console.log(obj);
  if (obj && obj.subscription) {
    console.log('找到subscription 可以推送');
    // 调用webpush的sendNotification来发起推送通知
    webpush.sendNotification(JSON.parse(obj.subscription), JSON.stringify(data), option)
      .then(function () {
        console.log('subscription推送成功');
      })
      .catch(function (err) {
        console.error(err);
      });
  }
}
