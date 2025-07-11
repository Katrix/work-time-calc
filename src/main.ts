import { createApp } from 'vue'
import { FontAwesomeIcon, FontAwesomeLayers, FontAwesomeLayersText } from '@fortawesome/vue-fontawesome'
import { createBootstrap } from 'bootstrap-vue-next'

import App from '@/App.vue'

import '@/scss/app.scss'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

import '@/fontAwesomeLibrary'
import { createPinia } from 'pinia'

const app = createApp(App)
app.component('FontAwesomeIcon', FontAwesomeIcon)
app.component('FontAwesomeLayers', FontAwesomeLayers)
app.component('FontAwesomeLayersText', FontAwesomeLayersText)
app.use(createBootstrap())
app.use(createPinia())
app.mount('#app')
