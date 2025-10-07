import { library, config } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon, FontAwesomeLayers, FontAwesomeLayersText } from '@fortawesome/vue-fontawesome'
import {
  faPlus,
  faMinus,
  faClock,
  faPenToSquare,
  faSlash,
  faHourglassStart,
  faHourglassHalf,
  faHourglassEnd,
  faTimes,
  faTimesCircle,
  faSpinner,
  faFolderTree,
  faFolder,
  faFile,
  faCalendar
} from '@fortawesome/free-solid-svg-icons'

config.autoAddCss = false

library.add(
  faPlus,
  faMinus,
  faClock,
  faPenToSquare,
  faSlash,
  faHourglassStart,
  faHourglassHalf,
  faHourglassEnd,
  faTimes,
  faTimesCircle,
  faSpinner,
  faFolderTree,
  faFolder,
  faFile,
  faCalendar
)

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('FontAwesomeIcon', FontAwesomeIcon)
  nuxtApp.vueApp.component('FontAwesomeLayers', FontAwesomeLayers)
  nuxtApp.vueApp.component('FontAwesomeLayersText', FontAwesomeLayersText)
})
