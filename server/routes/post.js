var path = require('path');
var fs = require('fs');
var express = require('express');
var router = express.Router();
var multer = require('multer'); // 文件上传时自定义文件名和存储路径

var config = require('../config');
var ossconfig = require('../ossconfig');
var Post = require('../models/Post.js');
var Comment = require('../models/Comment.js');
var Like = require('../models/Like.js');

// multer.diskStorage 指定存储路径和文件名
var storage = multer.diskStorage({
  // 设置上传后文件路径，upload文件夹会自动创建。
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, '../public/upload/'));
  },
  // 给上传文件重命名，获取添加后缀名
  filename: function (req, file, cb) {
    var extname = path.extname(file.originalname); // 获取文件扩展名
    // 将保存文件名设置为 【字段名 + 时间戳 + 文件扩展名】，比如 logo-1478521468943.jpg
    cb(null, file.fieldname + '-' + Date.now() + extname);
  }
});

var upload = multer({ storage: storage });
var sizeOf = require('image-size'); // 用于获取任何图像文件的尺寸

// 根据post查询评论数据
var getCommentByPost = async function(post){
  return Comment.find({post:post._id}).populate('user').sort({'create':1}).exec();
};
// 根据post查询点赞数据
var getLikeByPost = async function(post){
  return Like.find({post:post._id}).populate('user').sort({'create':1}).exec();
};
// 根据post是否被当前用户点赞
var checkPostIsLike = function(likes,currentUserId){
  if (!currentUserId) return false;
  var flag = false;
  for (var i = 0 ; i < likes.length ; i++) {
    if (likes[i].user._id == currentUserId._id) {
      flag = true;
      break;
    }
  }
  return flag;
};

// 阿里云图片上传
// 1. 前端页面通过uploader组件将图片上传，进入这个方法。
// 2. 利用 multer 将图片存储在本地服务器上，并生成文件名。
// 3. 调用阿里云SDK的client.put()方法将图片上传到阿里云服务上。
// 4. 返回给前端的url是一个远端的域名的图片url地址。
// 5. 将本地存储的图片删除，本地不存图片，只作为一个临时图片上传，传完就删除。
router.post('/uploadimgaliyun', upload.single('image'), async function (req, res, next) {
  const OSS = require('ali-oss');
  const client = new OSS({
    region: ossconfig.region, // bucket所在的区域
    accessKeyId: ossconfig.accessKeyId, // accessKeyId
    accessKeySecret: ossconfig.accessKeySecret, // accessKeySecret，请各位使用自己的accessKeySecret
    bucket: ossconfig.bucket
  });
  var file = req.file; // 从请求中得到文件数据
  var dimensions = sizeOf(file.path); // 得到图片尺寸
  let result = await client.put(file.filename, file.path); // 调用阿里云接口上传
  res.json({ // 返回数据
    code:0,
    data:{
      url: result.url.replace('http:',''),
      size: dimensions
    }
  });
  fs.unlinkSync(file.path); // 删除临时图片文件
});

// 本地图片上传
// 1. 前端页面通过uploader组件将图片上传，进入这个方法。
// 2. 利用 multer 将图片存储在本地服务器上，并生成文件名和url地址。
// 3. 这时我们返回给前端的url是一个本地同域名的图片url地址。
router.post('/uploadimg', upload.single('image'), function (req, res, next) {
  var file = req.file; // 从请求中得到文件数据
  var dimensions = sizeOf(file.path); // 得到图片尺寸
  console.log('文件类型：%s', file.mimetype);
  console.log('原始文件名：%s', file.originalname);
  console.log('文件大小：%s', file.size);
  console.log('文件保存路径：%s', file.path);
  res.json({
    code: 0,
    data: {
      url: config.uploadPath + file.filename, // 本地的图片url地址
      size: dimensions
    }
  });
});

// 创建朋友圈 post
// 1. 前端页面将content内容和picList图片内容通过post方法传到后端。
// 2. 在后端通过获取当前用户的id同时将数据进行组装校验。
// 3. 调用Post.create()将数据保存。
router.post('/savepost', async function (req, res, next) {
  var userid = req.user._id; // 获取当前用户的id
  var p = {
    content: req.body.content,
    picList: req.body.picList,
    user: userid
  };
  try {
    // 调用PostModel的静态方法create
    // await方式返回保存后的Post对象，如果发生错误将会进入catch方法
    var result = await Post.create(p);
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

// 获取朋友圈列表数据
router.get('/getcirclepost', async function (req, res, next) {
  var pageSize = 5; // 分页 pageSize
  var pageStart = req.query.pageStart || 0; // 分页 pageSize pageStart
  var posts = await Post.find().skip(pageStart * pageSize).limit(pageSize).populate('user').sort({'create': -1}).exec();
  // skip: 接收一个整数参数，表示查询需要跳过的条数，通过此参数就可以设置查询的起始点下标。
  // limit: 接收一个整数参数，表示查询的条数。
  // populate(): 表示连接查询，参数是我们创建 PostModel 时用 ref 设置的外键字段。
  // sort(): 通过参数指定排序的字段，并使用 1 和 - 1 来指定排序的方式，其中 1 为升序排列，而 - 1 是用于降序排列。
  // exec(): 这个方法会返回一个 Promise，为了配合 await 使用。
  var result = [];
  for (var i = 0; i < posts.length; i++) {
    var comments = await getCommentByPost(posts[i]); // 根据 post 查 comments
    var likes = await getLikeByPost(posts[i]); // 根据 post 查 likes
    var post = JSON.parse(JSON.stringify(posts[i])); // 这里对数据做一次拷贝，否则无法直接给数据添加字段
    post.comments = comments || [];
    post.likes = likes || [];
    post.isLike = checkPostIsLike(likes, req.user); // 判断是否点过赞
    result.push(post);
  }
  res.json({
    code: 0,
    data: result
  });
})

module.exports = router;
