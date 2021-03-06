import Vue from 'vue'
import VueRouter from 'vue-router'

import login from '@/components/login'
import wecircle from '@/views/wecircle'
import publish from '@/views/publish'
import mypage from '@/views/mypage'
import personpage from '@/views/personpage'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'wecircle',
    component: wecircle
  },
  {
    path: '/login',
    name: 'login',
    component: login
  },
  {
    path: '/publish',
    name: 'publish',
    component: publish
  },
  {
    path: '/mypage',
    name: 'mypage',
    component: mypage
  },
  {
    path: '/personpage',
    name: 'personpage',
    component: personpage
  },
  {
    path: '/changenickname',
    name: 'changenickname',
    component: () => import(/* webpackChunkName: "changenickname" */ '@/views/changenickname')
  },
  {
    path: '/changedesc',
    name: 'changedesc',
    component: () => import(/* webpackChunkName: "changenickname" */ '@/views/changedesc')
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import(/* webpackChunkName: "chat" */ '@/views/chat')
  },
  {
    path: '/chatlist',
    name: 'chatlist',
    component: () => import(/* webpackChunkName: "chatlist" */ '@/views/chatlist')
  }
]

const router = new VueRouter({
  routes,
  // 只是用于 body 滚动的情况，局部滚动是不适合
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  }
})

export default router
