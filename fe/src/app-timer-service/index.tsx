//import {createRoot} from 'react-dom/client'
import {createRoot,render} from '@mybricks/rxui'
import axios from "axios"

axios.defaults.withCredentials = true

import App from "./App";

const div = document.createElement('div')
div.style.height = '100%'
div.style.overflow = 'hidden'
document.body.append(div)
createRoot(div).render(<App/>)