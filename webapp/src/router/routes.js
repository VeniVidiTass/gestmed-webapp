import Home from '../views/Home.vue'
import Dashboard from '../views/Dashboard.vue'
import Patients from '../views/Patients.vue'
import Doctors from '../views/Doctors.vue'
import Calendar from '../views/Calendar.vue'
import ALive from '../views/ALive.vue'

export default [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/patients',
    name: 'Patients',
    component: Patients
  },
  {
    path: '/doctors',
    name: 'Doctors',
    component: Doctors
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar
  },
  {
    path: '/a-live',
    name: 'ALive',
    component: ALive
  }
]
