// 私信聊天是一个对实时性要求比较高的场景，各种实现的方案：
// >>> 轮询（Polling）： 前端不断向后台发请求以，实时更新数据，不管后台数据是否有更新都会返回数据，后端程序编写比较容易。对服务器压力大。请求中有大半是无用，浪费带宽和服务器资源。适于小型应用。
// >>> 长轮询（Long Polling）：前端向后台发请求，后台数据如果还没有更新则不返回，直到后台数据更新了再返回给前端，前端收到后台返回的数据后才发下一次请求。在无消息的情况下不会频繁的请求。但是请求在后台一直悬挂，连接长时间保持，浪费资源。
// >>> WebSocket：是HTML5新增加的一种通信协议，目前流行的浏览器都支持这个协议，是基于TCP协议的协议。WebSocket 解决的第一个问题是，通过第一个 HTTP request 建立了 TCP 连接之后，之后的交换数据都不需要再发 HTTP request 了，使得这个长连接变成了一个真–长连接。

// 整个scoket聊天的流程：
// >>> 在后端项目server.js中，启动web-socket。
// >>> 在后端项目中，封装socket.js，来存储用户池，和发送事件逻辑。
// >>> 在后端项目中的message.js路由中，在发送节消息的接口中添加事件通知逻辑。
// >>> 在前端项目中的chat的index.vue中，处理后台的发送和接受逻辑。

var socketPoll = {}; // 存储当前聊天用户的池子
// 发送消息的接口采用的是 http 协议，在消息存储成功之后需要找到当前接收者的socket，
// 所以需要一个socketPoll池来保存每一个进入聊天的用户的socket，这里采用了JavaScript的对象Object，借助key的唯一性来存储。

// socket.on() 表示监听客户端的事件，当接收到客户端的事件时，执行里面的逻辑。
// sendMsg() 表示对socket.emit()方法的封装，
// >>> socket.emit()表示发送了一个 action 命令，携带 data 参数，客户端采用socket.on('action',function(){...})便可以接收到。
module.exports = {
  setSocket (socket) {
    // 用户进入聊天页面代表登陆
    socket.on('login', function (obj) {
      console.log(`用户${obj._id}进入聊天页面`);
      socketPoll[obj._id] = socket; // 将 用户id 和 当前用户 的socket存起来
    });
    // 用户离开聊天页面代表登出
    socket.on('loginout', function (obj) {
      delete socketPoll[obj._id]; // 将 该用户 从用户池中删除
    });
  },
  sendMsg (obj) {
    var currentSocket = socketPoll[obj._id]; // 根据 id，找到对应的socket
    if (currentSocket) {
      currentSocket.emit(obj.action, obj.data); // 向客户端推送消息
    }
  }
};
