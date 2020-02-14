var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var tokenUtil = require('./utils/token');
var config = require('./config');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var postRouter = require('./routes/post');
var likecommentRouter = require('./routes/likecomment');
var messageRouter = require('./routes/message');

// 初始化数据库连接
var mongoose = require('mongoose');
// 27017 默认端口
// 指定 useNewUrlParser: true 和 useCreateIndex: true 是为了消除警告，意思是这些接口在未来会被移除，这里需要做一下兼容。
mongoose.connect('mongodb://127.0.0.1:27017/wecircle', {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true
}).then(function () {
  console.log('数据库【wecircle】连接成功');
}).catch(function (err) {
  console.log('数据库【wecircle】连接失败：' + err);
});

var app = express();

// 跨域配置 本地调试使用
app.use(function(req, res, next) {
  // console.log(req.headers);
  // 允许localhost来源访问
  res.header("Access-Control-Allow-Origin", 'http://localhost:8080');
  // 允许设置返回的修改设置的header值
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, wec-access-token, Set-Cookie");
  // 允许在跨域请求中带上Cookie
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// app.use(): 可以生成一个拦截器，优先于我们路由里的 post 和 get 执行。
// next的参数: 表示这个拦截器逻辑结束了，可以进行后续的其他处理，比如get或者post的逻辑，而同时我们可以在拦截器里设置一些数据，挂在到request上，方便后续使用。

// 用户校验流程：
// >>> 用户请求接口时，检查是否有token。
// >>> 有token就将当前用户的信息挂在req对象上，方便后面的路由方法使用。
// >>> 同时这里有一个续期的逻辑，因为如果我们强制将token设置成一个死的时间，那么无论多久，当时间过了之后，用户的token必定会过期，所以这个是不完美的。
// >>> 我们将用户的token通过cookie的方式存放在客户端，这样每次请求时，我们将token从cookie里获取到放入http的headers即可。
// >>> 如果你想把token存储在客户端localStorage里，也是可以的，但是并不推荐这样做，原因是localStorage在某些场景下是不可用的，例如如果浏览器是隐私模式时，而token这种数据又是及其重要的，所以建议放在cookie里最好，同时过期的逻辑可以直接由cookie控制。
app.use(function (req, res, next) {
  // 获取token数据
  var token = req.headers['wec-access-token'] || 'xx';
  // 检查token是否有效（过期或非法）
  var user = tokenUtil.checkToken({token});
  if (user) {
    // 将当前用户的信息挂载到 req对象 上，方便之后的路由获取使用
    req.user = user;
    tokenUtil.setToken({user, res}); // 续期
    next(); // 继续下一步路由
  } else {
    // 需要登录态域名白名单
    if (config.tokenApi.join(',').indexOf(req.path) < 0) {
      next();
      return;
    }
    res.json({
      code: 1000,
      meg: '无效的token!'
    });
  }
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/post', postRouter);
app.use('/likecomment', likecommentRouter);
app.use('/message', messageRouter.router);

module.exports = app;
