import {createRoot} from 'react-dom/client'
import axios from "axios"

axios.defaults.withCredentials = true

import Docs from './docs/Docs'

const div = document.createElement('div')
document.body.append(div)
createRoot(div).render(<Docs/>)