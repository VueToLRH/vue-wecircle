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
  }
]

const router = new VueRouter({
  routes,
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  }
})

export default router
