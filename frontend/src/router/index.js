import Vue from 'vue'
import VueRouter from 'vue-router'
import IndexPage from '@/components/IndexPage'
import MainPage from "@/components/MainPage";

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Start',
    component: IndexPage
  },
  {
    path: '/recommend',
    name: 'Recommendation',
    component: MainPage
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
