var express = require('express');
var router = express.Router();
var token = require('../utils/token');
var config = require('../config');
var User = require('../models/User');
var sms = require('../utils/sms');

// 获取手机验证码
router.post('/phonecode', (req, res, next) => {
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

// 注册
// 1. 首先判断前端的验证码是否正确。
// 2. 正确的话，其次判断是否是一个新用户，如果是就创建一个用户并返回前端登录成功。如果不是新用户，就查出用户信息并返回前端登录成功。
// 3. 失败的话，就返回登录失败。
router.post('/signup', async (req, res, next) => {
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

module.exports = router;
