var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var SubscriptionSchema = new mongoose.Schema({
  subscription: { type: String, required:true },
  userid: { type: String, unique: true }, // 注意这里不用 ref 外键
  update: { type: Date, default: Date.now },
  create: { type: Date, default: Date.now },
},{
  timestamps: { createdAt: 'create', updatedAt:'update' }
});
// subscription:字段是一个字符串，会将前端传的对象JSON.stringify()一下。
// userid：这个字段是标识那个用户，采用 unique:true 表明唯一性，
// >>> 这里不用 ref 外键是为了可控，为了后续可能会给没登录过的用户也推送一些消息，
// >>> 当前项目只会在发送聊天消息时推送，就要求用户必须是登录过的。

module.exports = mongoose.model('Subscription', SubscriptionSchema);
