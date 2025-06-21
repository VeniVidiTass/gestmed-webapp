import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'

import 'primeicons/primeicons.css'
import './style.css'

import App from './App.vue'
import router from './router'
import { useAppStore } from './stores/app.js'

// PrimeVue Components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import Calendar from 'primevue/calendar'
import FloatLabel from 'primevue/floatlabel'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import Rating from 'primevue/rating'
import Image from 'primevue/image'
import Divider from 'primevue/divider'
import Timeline from 'primevue/timeline'
import Avatar from 'primevue/avatar'
import Chip from 'primevue/chip'

import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark',
      cssLayer: false
    }
  }
})
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

// Register PrimeVue components
app.component('Button', Button)
app.component('InputText', InputText)
app.component('Textarea', Textarea)
app.component('Select', Select)
app.component('Card', Card)
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Dialog', Dialog)
app.component('Toast', Toast)
app.component('ConfirmDialog', ConfirmDialog)
app.component('Calendar', Calendar)
app.component('FloatLabel', FloatLabel)
app.component('ProgressSpinner', ProgressSpinner)
app.component('Tag', Tag)
app.component('Rating', Rating)
app.component('Image', Image)
app.component('Divider', Divider)
app.component('Timeline', Timeline)
app.component('Avatar', Avatar)
app.component('Chip', Chip)

// Initialize app store and theme
const appStore = useAppStore()
appStore.initializeTheme()

app.mount('#app')
