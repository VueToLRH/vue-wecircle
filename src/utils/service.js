import axios from 'axios'
import router from '../router'
import { getCookie } from './cookie'

const baseURL = process.env.NODE_ENV === 'production' ? '/' : '//localhost:3000/'

let service = axios.create({
  baseURL: baseURL,
  withCredentials: true, // axios默认是发送请求的时候不会带上cookie的，需要通过设置withCredentials: true来解决。
  timeout: 3000 // 请求超时时间
})

// 添加request拦截器
service.interceptors.request.use(config => {
  return config
}, err => {
  Promise.reject(err)
})

// 添加respone拦截器
service.interceptors.response.use(response => {
  if (response.data.code === 1000) {
    router.push({
      path: 'login',
      name: 'login',
      params: {}
    })
    weui.toTips('请先登录')
    // 发现登录过期，将本地缓存的用户信息清除
    window.localStorage.removeItem('cuser')
  } else if (response.data.code !== 0) {
    weui.toTips(response.data.msg || '接口请求失败')
  }
  return response.data
}, err => {
  return Promise.reject(err.response)
})

// GET请求
function get (url, params = {}) {
  return service({
    url: url,
    method: 'get',
    headers: {
      'wec-access-token': getCookie('token')
    },
    params
  })
}

// POST请求
function post (url, data = {}) {
  let sendObj = {
    url: url,
    method: 'post',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'wec-access-token': getCookie('token')
    },
    data: data
  }
  return service(sendObj)
}

// put方法（resfulAPI常用）
function put (url, data = {}) {
  return service({
    url: url,
    method: 'put',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    data: JSON.stringify(data)
  })
}

export default {
  get,
  post,
  put,
  baseURL,
  token: getCookie('token')
}
