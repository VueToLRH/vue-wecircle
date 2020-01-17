var express = require('express');
var router = express.Router();
var rateLimit = require("express-rate-limit"); // 基于Express路由的接口限频率的组件模块
var svgCaptcha = require('svg-captcha'); // 第三方验证码模块，提供基于SVG图片格式的验证码(相对于一般图片SVG格式更不容易被机器人识别)。

var config = require('../config');
var token = require('../utils/token');
var sms = require('../utils/sms');
var User = require('../models/User');
var Subscription = require('../models/Subscription');

// 创建用户
var createUser = function(data){
  console.log('createUser data', data)
  var nickname = '用户' + Date.now(); // 用户名采用当前时间戳
  var avatar = config.uploadPath + 'avatar/avatar'+ Math.ceil(Math.random() * 9 ) + '.jpg'; // 用户头像，随机使用9张里的其中一张
  var bg = config.uploadPath + 'bg/topbg' + Math.ceil(Math.random() * 4 ) + '.jpg'; // 背景图片，随机使用4张里的其中一张
  var gender = '1'; // 性别，先写死，后面可以修改
  return User.create({
    nickname: nickname,
    avatar: avatar,
    gender: gender,
    bgurl: bg,
    phoneNum: data.phonenum
  });
}

// 根据手机号判断是新用户还是老用户
var checkUser = function(data){
  return User.findOne({ phoneNum: data.phonenum }).exec();
}

// 验证码请求限制调用频率，同一ip，1分钟调用最多1次
var phonecodeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // x分钟调用最多1次
  max: 1, // 1分钟调用1次
  handler: function (req, res, next) {
    res.json({
      code: 1,
      msg: '请稍后请求'
    });
  }
});

// 登陆请求限制调用频率，同一ip，1分钟调用最多10次
var signupLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  // skip：表示如果此次登录是需要弹验证码的，先绕过限频逻辑，去校验验证码。
  skip: function (req, res) {
    // req.cookies.captcha：用来判断此次登录是否需要校验验证码，在 /captcha 路由中会去设置这个值。
    return req.cookies.captcha ? true : false;
  },
  // handler：接收一个方法，表示命中限频逻辑时的处理方法，这里给前端返回一个标志位 needCaptcha 用来弹验证码。
  handler: function (req, res, next) {
    res.json({
      code: 0,
      data: {
        code: 'needCaptcha'
      }
    })
  }
})

// 获取验证码图片
router.get('/captcha',  (req, res)=> {
  var captcha = svgCaptcha.create({
    ignoreChars:'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', // 排除字母，只用数字
    noise: 2 // 干扰线条的数量
  });
  // svgCaptcha.create(options)参数配置如下:
  // >>> size: 4 // 验证码长度
  // >>> ignoreChars: '0o1i' // 验证码字符中排除 0o1i
  // >>> noise: 1 // 干扰线条的数量
  // >>> color: true // 验证码的字符是否有颜色，默认没有，如果设定了背景，则默认有
  // >>> background: '#cc9966' // 验证码图片背景颜色
  // >>> noise: 2 // 干扰线条的数量
  res.cookie('captcha', captcha.text, {
    maxAge: 60 * 1000 * 30,// 设置到cookie里 时效30分钟
    httpOnly: true
  });
  res.type('svg'); //返回验证码图片
  res.status(200).send(captcha.data);
});

// 获取手机验证码
router.post('/phonecode', phonecodeLimiter, (req, res, next) => {
  // 校验Referer
  if (req.headers.referer) {
    if (req.headers.referer.indexOf('https://app.nihaoshijie.com.cn') > -1
      || req.headers.referer.indexOf('http://localhost') > -1) {
    } else {
      res.json({
        code:1,
        msg:'非法请求'
      });
      return
    }
  } else {
    res.json({
      code:1,
      msg:'非法请求'
    });
    return;
  }
  console.log('phonecode 接口：', req.body)
  // 调用阿里云短信接口
  sms.sendSms({
    phonenum: req.body.phonenum
  }, function (result) {
    res.json({
      code: 0,
      data: result
    });
  }, function (result) {
    res.json({
      code: 1,
      data: result
    });
  });
});

// 注册
// 1. 首先判断前端的验证码是否正确。
// 2. 正确的话，其次判断是否是一个新用户，如果是就创建一个用户并返回前端登录成功。如果不是新用户，就查出用户信息并返回前端登录成功。
// 3. 失败的话，就返回登录失败。
router.post('/signup', signupLimiter, async (req, res, next) => {
  // 如果cookie里有验证码，证明此次登录请求是需要验证码
  if (req.cookies.captcha) {
    if (!req.body.captcha) { // 如果没有输入验证码，返回前端需要输入验证码
      res.json({
        code: 0,
        data: {
          code: 'needCaptcha'
        }
      });
      return;
    }
    //验证验证码是否正确
    if (req.body.captcha.toLocaleLowerCase() !== req.cookies.captcha.toLocaleLowerCase()) {
      res.json({
        code:1,
        msg:'验证码错误'
      });
      return
    } else {
      res.clearCookie('captcha'); //验证码校验正确，清除cookie，下次就不需要输入验证码登录
    }
  }
  console.log('signup 请求数据：', req.body)
  sms.checkCode({
    phonenum: req.body.phonenum,
    code: req.body.code
  }, async function (result) {
      console.log('signup 接口：', result)
      if (result.code === 0) {
        // 是否是已存在的用户
        var user = await checkUser(req.body);
        if (!user) {
          // 如果不存在，则创建一个新的用户
          user = await createUser(req.body);
        }
        token.setToken({ user, res });
        // 返回当前用户信息
        res.json({
          code: 0,
          data: user
        });
      } else {
        // 验证码不合法返回错误信息
        res.json({
          code: 1,
          data: result.msg
        });
      }
    },
    function (result) {
      // 验证码不合法返回错误信息
      res.json({
        code: 1,
        data: result.msg
      });
    });
});

// 根据ID获取个人信息
router.get('/userinfo', async (req, res, next) => {
  try {
    var user = await User.findById(req.query.userId).exec();
    res.json({
      code: 0,
      data: user
    });
  } catch (err) {
    res.json({
      code: 1,
      data: err
    });
  }
});

// 更新个人信息
router.post('/update', async (req, res, next) => {
  try {
    var user = await User.findByIdAndUpdate(req.user._id, req.body).exec();
    res.json({
      code: 0,
      data: user
    });
  } catch (err) {
    res.json({
      code: 1,
      data: err
    });
  }
});

// 添加订阅信息
router.post('/addsubscription', async (req, res, next) => {
  var userid = req.user ? req.user._id : '';
  try {
    var result = await Subscription.create({
      subscription: req.body.subscription,
      userid: userid
    })
    res.json({
      code: 0,
      data: result
    });
  } catch (err) {
    res.json({
      code: 0,
      data: err.errmsg.indexOf('dup key') ? 'has scription' : err.errmsg // 说明用户已经订阅过
    })
  }
})

module.exports = router;
