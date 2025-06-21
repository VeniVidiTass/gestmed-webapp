import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Services from '../views/Services.vue'
import BookService from '../views/BookService.vue'
import MyBookings from '../views/MyBookings.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/services',
      name: 'Services',
      component: Services
    },
    {
      path: '/book/:serviceId',
      name: 'BookService',
      component: BookService,
      props: true
    },
    {
      path: '/my-bookings',
      name: 'MyBookings',
      component: MyBookings
    }
  ]
})

export default router
