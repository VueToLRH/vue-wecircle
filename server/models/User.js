var mongoose = require('mongoose');

var Schema = mongoose.Schema; // 数据库集合的结构对象，类似于关系型数据库中的表结构

var UserSchema = new mongoose.Schema({
  nickname: { type: String, maxlength: 20 }, // 昵称
  avatar: String, // 头像
  bgurl: String, // 朋友圈背景图片
  phoneNum: String, // 电话号码
  desc: { type: String, maxlength: 20 ,default:''}, // 个性签名
  gender: String, // 性别
  params: { type: Schema.Types.Mixed, default:{'vip':0} }, // 用户额外信息
  update: { type: Date, default: Date.now }, // 更新日期
  create: { type: Date, default: Date.now }, // 创建日期
}, {
  timestamps: {
    createdAt: 'create',
    updatedAt: 'update'
  } // 表示添加了一个钩子，当 Model 发生创建和更新时，会自动赋值当前的时间戳到这两个字段。
});

// Node.js 里存入的是 GMT 标准时间，在读取的时候需要转换成当前的时区时间

module.exports = mongoose.model('User', UserSchema);
