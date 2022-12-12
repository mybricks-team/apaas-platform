//import {createRoot} from 'react-dom/client'
import {createRoot} from '@mybricks/rxui'
import axios from "axios"

axios.defaults.withCredentials = true

import Home from './Home'

const div = document.createElement('div')
document.body.append(div)
createRoot(div).render(<Home/>)