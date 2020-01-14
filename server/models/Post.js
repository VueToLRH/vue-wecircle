var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PostSchema = new mongoose.Schema({
  content: { type: String, required: true }, // 朋友圈文本内容
  picList: { type: Schema.Types.Mixed }, // 朋友圈图片内容
  create: { type: Date, default: Date.now }, // 创建时间
  update: { type: Date, default: Date.now }, // 更新时间
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true } // 朋友圈的Users外键属性，标识谁发的朋友圈
  // ref表示关联 User，相当于 Post 里有一列是 user，它的值是 User 的 ObjectId(userid)
  // 在后面的查询时，可以通过 populate() 轻松获取到 Post关联 的 User对象信息。
  // required：true 表示此列为必填项，如果在创建时没有，将会报错。
}, {
  timestamps: {
    createdAt: 'create',
    updatedAt: 'update'
  }
});

module.exports = mongoose.model('Post', PostSchema);
