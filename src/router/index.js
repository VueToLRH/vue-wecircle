import Vue from 'vue'
import VueRouter from 'vue-router'

import login from '@/component/login'
import publish from '@/views/publish'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'login',
    component: login
  },
  {
    path: '/publish',
    name: 'publish',
    component: publish
  }
]

const router = new VueRouter({
  routes
})

export default router
