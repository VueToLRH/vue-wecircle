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
  res.header("Access-Control-Allow-Origin", 'http://localhost:8080');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, wec-access-token, Set-Cookie");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

// app.use 是 Express拦截器 的方法
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

module.exports = app;
