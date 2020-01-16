var express = require('express');
var router = express.Router();
var User = require('../models/User');
var Message = require('../models/Message');
var Chat = require('../models/Chat');
var push = require('../utils/push');
var socket = require('../utils/socket');

// 添加消息
var addmsg = async function(myId, content, toUserId) {
  var chatId = '';
  // 首先需要查询是否已经有过聊天
  var list = await Chat.find({
    $or: [
      { $and: [{ fromUser: myId }, { toUser: toUserId }] },
      { $and: [{ fromUser: toUserId }, { toUser: myId }] }
    ]
  }).sort({ 'create': 1 }).exec();
  // >>> $and:参数是一个数组，表示条件的列表，是“并且”的关系，只有当条件都满足才可以。
  // >>> $or:参数是一个数组，表示条件的列表，是“或”的关系，只有当条件都满足1个就可以。
  if (list.length) {
    // 聊过天，记录 charId
    chatId = list[0]._id;
  } else {
    // 没有聊过天，则创建
    var chat = await Chat.create({
      params: { users: [ myId, toUserId ] },
      fromUser: myId,
      toUser: toUserId
    });
    chatId = chat._id;
  }
  // 添加一条消息
  var result = await Message.create({
    content: content,
    fromUser: myId, // 发送者的id，也就是当前登录用户的id
    chat: chatId, // 将之前的chatId外键存入的message里
    toUser: toUserId // 接收者的ID
  });
  // 更新chat的最新一条消息时间
  var updasteChat = await Chat.findByIdAndUpdate(chatId, {
    lastMsgTime: result.create
  }).exec();
  return result;
};

// 发送消息接口
// 1. 在每创建一条消息时，需要知道消息内容，和消息的发送者和接收者。
// 2. 在创建前，我们需要查询Chat，是否它们之间已经有过聊天(两个人的聊天只可能出现在1个聊天对象里面)，如果有就找到chatId，没有的话需要重新创建一个。
// 3. 在创建消息Message时需要关联聊天chatId，这样我们在后面查询每个人的聊天列表时，就可以根据chatId查询到了。
router.post('/addmsg', async (req, res, next) => {
  var myId = req.user._id; // 当前登录用户的id
  var content = req.body.content; // 发送的内容
  var toUserId = req.body.toUser; // 接收者的id
  try {
    var result = await addmsg(myId, content, toUserId);
    if (result._id) {
      // 消息通知
      if (result.content.type === 'str') {
        push(result.toUser, { title: '收到新消息', body: result.content.value });
      } else {
        push(result.toUser, { title: '收到新消息', body: '[图片]' });
      }
      var user = await User.findById(result.fromUser).exec();
      socket.sendMsg({ // socket实时消息
        id: toUserId,
        action: 'recieveMsg',
        data: {
          content: result.content,
          fromUser: user
        }
      });
      res.json({
        code: 0,
        data: result
      });
    }
  } catch (err) {
    res.json({
      code: 1,
      data: err
    });
  }
});

// 查询聊天记录接口
router.get('/getchathistory', async (req, res, next) => {
  try {
    var myId = req.user._id;
    // 根据发送者和接收着查询聊天记录
    var list = await Message.find({
      $or:[
        { $and: [ {fromUser: myId}, {toUser: req.query.toUser} ]},
        { $and: [ {fromUser: req.query.toUser}, {toUser: myId} ]}
      ]
    }).populate('fromUser').sort({'create':1}).exec();
    // 也可根据chatid查询
    // var list = await Message.find({
    //   chat: chatId
    // }).populate('fromUser').sort({'create':1}).exec();
    var result = [];
    for (var i = 0; i < list.length; i++) {
      var msg = JSON.parse(JSON.stringify(list[i]));
      if (req.user._id == msg.fromUser._id) {
        msg.mine = true;
      } else {
        msg.mine = false;
      }
      result.push(msg);
    }
    res.json({
      code: 0,
      data: result
    });
  } catch (err) {
    res.json({
      code: 1,
      data: err
    });
  }
})

module.exports = router;
