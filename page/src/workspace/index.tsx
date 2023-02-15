import React from "react";
import axios from 'axios';
//import { createRoot } from "react-dom/client";
import { createRoot } from "@mybricks/rxui";
import Workspace from './Workspace';

const div = document.createElement('div');
const root = createRoot(div);

axios.defaults.withCredentials = true;
document.body.append(div);
root.render(<Workspace />);
