var Core = require('@alicloud/pop-core');
var smsconfig = require('../smsconfig');

// 创建请求 client 实例
var client = new Core({
  accessKeyId: smsconfig.accessKeyId,
  accessKeySecret: smsconfig.accessKeySecret,
  endpoint: 'https://dysmsapi.aliyuncs.com',
  apiVersion: '2017-02-25'
});

var SignName = smsconfig.signName;
var TemplateCode = smsconfig.templateCode;

module.exports = {
  // 发送手机验证码
  sendSms (data, succ, fail) {
    var s2msCode = Math.random().toString().slice(-6); // 随机获取6位数字
    var params  = {
      PhoneNumbers: data.phoneNum, // 需要发送的手机号
      SignName: SignName, // 短信签名名称
      TemplateCode: TemplateCode, // 模板code字符串
      TemplateParam: JSON.stringify({"code":s2msCode}) // 短信模板变量对应的实际值，JSON格式，将生成的随机数传进去
    };
    var requestOption = {
      method: 'POST'
    };
    // apiKey是SendSms
    client.request('SendSms', params, requestOption).then((result) => {
      console.log('发送手机验证码成功：', result);
      succ && succ(result);
    }, function (err) {
      console.log('发送手机验证码错误：', err);
      fail && fail(err);
    })
  },
  // 查看已发送的验证码
  checkCode (data, succ, fail) {
    var params = {
      PhoneNumber: data.phoneNum, // 需要验证的手机号
      SendDate: getFormatedDate(), // 短信发送日期，支持查询最近30天的记录。格式为yyyyMMdd，例如20181225
      PageSize: 40, // 指定每页显示的短信记录数量
      CurrentPage: 1 // 指定发送记录的的当前页码
    };
    var requestOption = {
      method: 'POST'
    };
    // apiKey是QuerySendDetails
    client.request('QuerySendDetails', params, requestOption).then((result) => {
      if (result.code === 'OK') {
        var detail = result.SmsSendDetailDTOs.SmsSendDetailDTO[0] || {};
        // 只筛选1分钟以内的数据
        if ((new Date() - new Date(detail.ReceiveDate)) < diffRange) {
          // 校验查询到的第一条最新的数据，使用正则表达式match到验证码，和用户输入的验证码进行对比
          if (detail.Content.match(pattern)[0] && (detail.Content.match(pattern)[0] === data.code)) {
            succ && succ({
              code: 0,
              msg: '验证成功'
            });
          } else {
            // 校验失败
            fail && fail({
              code: 1,
              msg: '验证失败'
            });
          }
        } else {
          // 校验失败 --- 验证码过期
          fail && fail({
            code: 1,
            msg: '验证失败'
          });
        }
      } else {
        // 校验失败
        fail && fail({
          code: 1,
          msg: '验证失败'
        });
      }
    }, (err) => {
      // api接口调用失败兼容
      console.log('校验短信验证码API err', err);
      fail && fail({
        code: 1,
        msg: '短信验证失败'
      });
    })
  }
}
