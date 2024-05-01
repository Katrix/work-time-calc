import { library, dom } from '@fortawesome/fontawesome-svg-core'
import {
  faPlus,
  faMinus,
  faClock,
  faPenToSquare,
  faSlash,
  faHourglassStart,
  faHourglassHalf,
  faHourglassEnd,
  faTimes
} from '@fortawesome/free-solid-svg-icons'

import '@fortawesome/fontawesome-svg-core/styles.css'

library.add(faPlus, faMinus, faClock, faPenToSquare, faSlash, faHourglassStart, faHourglassHalf, faHourglassEnd, faTimes)

dom.watch()
