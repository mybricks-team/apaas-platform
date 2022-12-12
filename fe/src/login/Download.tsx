import css from "./Download.less";
import React, {useCallback} from "react";
import LoginCtx from "./LoginCtx";
import {observe} from "@mybricks/rxui";
import {getApiUrl} from "../utils";
import axios from "axios";

export default function ({bigger}) {
  const loginCtx = observe(LoginCtx, {from: 'parents'})
  const download = useCallback(() => {
    if (!loginCtx.curUser) {
      loginCtx.showLogin()
    } else {
      axios({
        method: "post",
        url: getApiUrl('/api/product/download'),
        data: {
          version: '体验版',
          platform: navigator.platform
        }//navigator.userAgentData.platform
      }).then(({data}) => {
        if (data.code != 1) {
          loginCtx.showLogin()
        } else {
          let rData = data.data
          window.open(rData.url)
        }
      })
    }
  }, [])

  return (
    <a className={`${css.btn} ${bigger ? css.btnBig : ''}`}
       onClick={download}>免费下载</a>
  )
}