# 朋友圈移动Web App

## 项目描述

本项目使用Vue+WeUI开发客户端页面，Express+MongoDB开发服务段接口。

项目主要包括登陆页、朋友圈发布、朋友圈评论、私信聊天、个人信息展示页等。

## 如何运行

+ 克隆代码：`https://github.com/VueToLRH/vue-wecircle.git`
+ 安装依赖：`npm install`
+ 客户端运行：`npm run serve`
+ 服务端运行：`node .\server\bin\www`
+ 打包：`npm run build`
+ ESlint检查：`npm run lint`

## 基础知识

+ 屏幕适配方案：`vw方案`
+ 滚动组件 [scrollView](./src/components/scrollView/index.vue) 开发
+ 用户验证方式：[JSON Web Token](./readme/JSON_Web_Token.md)
+ 跨域配置：[具体实现参考服务端app.js中的配置](./server/app.js)

## 使用插件/模块

+ [postcss-px-to-viewport](https://github.com/evrone/postcss-px-to-viewport/blob/master/README_CN.md)：用于进行px和vw之间的转换，具体配置[postcss.config.js](./postcss.config.js)
+ [svg-captcha](https://github.com/produck/svg-captcha/blob/HEAD/README_CN.md)：第三方验证码模块，提供基于SVG图片格式的验证码(相对于一般图片SVG格式更不容易被机器人识别)。[具体使用参考：server/routes/users.js](./server/routes/users.js)
+ [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken#readme)：`JSON Web Token`方案的实现

## 项目展示

![app01](./readme/images/app01.png)
![app02](./readme/images/app02.png)
![app03](./readme/images/app03.png)
![app04](./readme/images/app04.png)
![app05](./readme/images/app05.png)
![app06](./readme/images/app06.png)
![app07](./readme/images/app07.png)
![app08](./readme/images/app08.png)
