import React, {useCallback, useLayoutEffect} from "react";
import css from "./Navbar.less";
import {evt, observe, useObservable} from "@mybricks/rxui";

import {Modal} from "antd";
import {getApiUrl} from "./utils";
import {createPortal} from "react-dom";
import LoginCtx from "./LoginCtx";
//import Download from "./Download";

import axios from "axios";

export default function NavBar({curPage, loginRef}) {
  const ctx = useObservable(LoginCtx, next => {
    next(LoginCtx.init())
  }, {
    init(ctx) {
      if (loginRef) {
        loginRef({user: ctx.curUser})
      }
    }, to: 'children'
  })

  const login = useCallback(() => {
    ctx.showLogin()
  }, [])

  const logout = useCallback(() => {
    Modal.confirm({
      title: '您确定要退出登录吗?',
      onOk() {
        ctx.logout()
      }
    })
  }, [])

  return (
    <div className={css.navBar} >
      <div className={css.logo} onClick={e => {
        window.location.href = `/`
      }}>
        <img src={'./icon.png'}/>
        <span>Mybricks</span>
      </div>
      <div className={css.user}>
        {
          ctx.curUser ? (
            <>
              <a onClick={logout}>{ctx.curUser.email}</a>
            </>
          ) : (
            <a onClick={login}>登录</a>
          )
        }
      </div>
      <div className={css.navs}>
        <a href={'/workspace.html'}
           className={curPage === 'workspace' ? css.activeTab : ''}
           style={{marginRight: 'auto'}}>我的空间</a>
        <a href={'/material.html'} className={(curPage === 'material' ? css.activeTab : '') + " " + css.beta}>物料中心</a>
        <a href={'/ground.html'} className={curPage === 'ground' ? css.activeTab : ''}>搭建案例</a>
        {/*<a href={'/docs/index.html'}>文档中心</a>*/}
        <a className={css.docs} target={'_blank'} href={'https://mp.weixin.qq.com/mp/appmsgalbum?__biz=Mzg5OTg1OTYwOA==&action=getalbum&album_id=2664963833182224385'}>文档教程</a>
        <a className={css.docs} target={'_blank'} href={'https://mp.weixin.qq.com/mp/appmsgalbum?__biz=Mzg5OTg1OTYwOA==&action=getalbum&album_id=2591211948751650816'}>《企业级低代码》</a>
        {/*<Download/>*/}
      </div>
      {
        ctx._showLogin ? (
          <Login
            onClose={e => {
              ctx.hideLogin()
            }}

            onFinish={(user) => {
              ctx.login(user)
            }}
          />
        ) : null
      }
    </div>
  )
}


function Login({onClose, onFinish}) {
  const ctx = useObservable(class {
    action: 'new' | 'login' = 'login'

    email: string

    emailErr: string

    password: string

    psdErr: string

    registerErr: string

    serverErr: string

    reset() {
      this.emailErr = void 0
      this.psdErr = void 0
      this.serverErr = void 0
    }

    get errMsg() {
      return this.emailErr || this.psdErr || this.serverErr
    }
  })

  const doAction = useCallback(() => {
    const emailReg = /^\w{3,}(\.\w+)*@[A-z0-9]+(\.[A-z]{2,5}){1,2}$/
    if (!ctx.email || !ctx.email.match(emailReg)) {
      ctx.emailErr = `邮箱内容为空或格式错误`
      return
    }

    if (!ctx.password || ctx.password === '' || ctx.password.length < 6) {
      ctx.psdErr = `请输入合适的密码（6位及以上）`
      return
    }

    if (ctx.action === 'login') {
      axios({
        method: "post",
        url: getApiUrl('/api/user/login'),
        data: {email: ctx.email, psd: window.btoa(ctx.password)}
      }).then(({data}) => {
        if (data.code != 1) {
          ctx.serverErr = data.msg
        } else {
          let rData = data.data
          onFinish(rData)
        }
      })
    } else if (ctx.action === 'new') {
      axios({
        method: "post",
        url: getApiUrl('/api/user/register'),
        data: {email: ctx.email, psd: window.btoa(ctx.password)}
      }).then(({data}) => {
        if (data.code != 1) {
          ctx.serverErr = data.msg
        } else {
          let rData = data.data
          onFinish({
            id: rData.userId,
            email: ctx.email
          })
        }
      })
    }
  }, [])

  useLayoutEffect(() => {

  }, [])

  return createPortal(
    <div className={css.dialogBG}>
      <div className={css.dialogLogin} onClick={evt().stop}>
        <a className={css.close} onClick={onClose}>×</a>
        <div className={css.content}>
          <input type={'text'}
                 className={`${ctx.emailErr ? css.err : ''}`}
                 value={ctx.email}
                 onChange={e => {
                   ctx.email = e.target.value
                 }}
                 placeholder={'邮箱地址'}/>
          <input type={'password'}
                 className={`${ctx.psdErr ? css.err : ''}`}
                 value={ctx.password}
                 onChange={e => {
                   ctx.password = e.target.value
                 }}
                 onKeyDown={e => {
                   if (e.keyCode === 13) {
                     doAction()
                   }
                 }}
                 placeholder={'登录密码'}/>
          <button onClick={doAction}>{ctx.action === 'new' ? '注册新用户' : '登录'}</button>
          <div className={css.toolbar}>
            <span className={css.errMsg}>
              {ctx.errMsg}
            </span>
            <a onClick={e => {
              ctx.action = ctx.action === 'login' ? 'new' : 'login'
            }}>{ctx.action === 'login' ? '创建新账户' : '登录'}
            </a>
          </div>

        </div>
      </div>
    </div>, document.body
  )
}