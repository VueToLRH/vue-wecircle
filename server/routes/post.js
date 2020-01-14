var path = require('path');
var fs = require('fs');
var express = require('express');
var router = express.Router();
var multer = require('multer');

var config = require('../config');
var ossconfig = require('../ossconfig');
var Post = require('../models/Post.js');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, '../public/upload/'));
  },
  filename: function (req, file, cb) {
    var extname = path.extname(file.originalname); // 获取文件扩展名
    // 将保存文件名设置为 【字段名 + 时间戳 + 文件扩展名】，比如 logo-1478521468943.jpg
    cb(null, file.fieldname + '-' + Date.now() + extname);
  }
});

var upload = multer({ storage: storage });
var sizeOf = require('image-size');

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
