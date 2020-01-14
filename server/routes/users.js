var express = require('express');
var router = express.Router();

// 获取手机验证码
router.post('/phonecode', (req, res, next) => {
  // 调用阿里云短信接口
  sms.sendSms({
    phoneNum: req.body.phoneNum
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
router.post('signup', async (res, res, next) => {
  sms.checkCode({
    phoneNum: res.body.phoneNum,
    code: res.body.code
  }, async function (result) {
    if (result.code === 0) {
      // 是否是已存在的用户
      var user = await checkUser(req.body);
      if (!user) {
        // 如果不存在，则创建一个新的用户
        user = await createUser(req.body);
      }
      token.setToken({user, res});
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
  }, function (result) {
    // 验证码不合法返回错误信息
    res.json({
      code: 1,
      data: result.msg
    })
  })
})

module.exports = router;
