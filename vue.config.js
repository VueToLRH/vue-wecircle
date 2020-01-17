// const OfflinePlugin = require('offline-plugin')

module.exports = {
  publicPath: '/',
  lintOnSave: true,
  assetsDir: 'static',
  devServer: {
    hot: false
  },
  configureWebpack: {
    // plugins: [
    //   // Service Worker每次构建完之后，每个文件的md5都会改变，所以我们每次在写缓存文件列表时，都需要手动的的修改
    //   // 解决方法：可使用 offline-plugin 完善
    //   // offline-plugin插件会自动扫描webpack构建出来的dist目录里的文件，对这些文件配置缓存列表。
    //   new OfflinePlugin({
    //     // 要求触发ServiceWorker事件回调
    //     ServiceWorker: {
    //       events: true, // 指定了要触发Service Worker事件的回调，这个main.js里的配置是相对应的，只有这里设置成true，那边的回调才会触发。
    //       entry: './public/sw-push.js' // push事件逻辑写在另外一个文件里面
    //     },
    //     updateStrategy: 'all', // 指定了缓存策略选择全部更新，另外一种是增量更新changed
    //     // excludes 指定一些不需要缓存的文件列表
    //     excludes: ['**/*.map', '**/*.svg', '**/*.png', '**/*.jpg', '**/sw-push.js', '**/sw-my.js'],
    //     // 添加index.html的更新
    //     rewrites (asset) {
    //       if (asset.indexOf('index.html') > -1) {
    //         return './index.html'
    //       }
    //       return asset
    //     }
    //   })
    // ]
  }
}
