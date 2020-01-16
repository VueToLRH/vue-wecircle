var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ChatSchema = new mongoose.Schema({
  params: { type: Schema.Types.Mixed }, // 聊天相关的参数，例如背景图片等等
  isDel: { type: Boolean,required:true,default:false }, // 是否删除
  lastMsgTime: { type: Date, default: Date.now }, // 最近一条消息的时间
  fromUser: { type: Schema.Types.ObjectId, ref: 'User',required:true }, // 聊天的发起者
  toUser: { type: Schema.Types.ObjectId, ref: 'User',required:true }, // 聊天的接收者
  create: { type: Date, default: Date.now },
  update: { type: Date, default: Date.now },
}, {
  timestamps:{ createdAt: 'create',updatedAt:'update' }
});

module.exports = mongoose.model('Chat', ChatSchema);

// 预留了 isDel 字段
// 一般在数据库中，做删除操作分为软删除(逻辑删除)和硬删除(物理删除)：
// 逻辑删除：即标记删除，设置一个状态字段，判断删除，该类删除主要使用于一些，用户删除，但是可能网站还会使用到的一些数据，也包含，用户删除以后还想去恢复的一部分数据。
// 物理删除：即直接删除该数据。这类的删除适用于使用之后，无意义的数据，比如我们现在注册发送的验证码等类型的数据。
// 对于聊天数据这种场景，后续如果有多终端登录的情况下，删除还是需要采用软删除的，所以这里添加了isDel字段。
