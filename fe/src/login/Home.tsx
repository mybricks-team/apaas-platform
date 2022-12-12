import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Github, VScode } from "./Icons";
import css from './Home.less';
import Logo from "../modules/Logo";
import { getApiUrl, getCookie, removeCookie, setCookie } from "../utils";
import { COOKIE_LOGIN_USER } from "../constants";
import { message } from "antd";

export default function App() {

  const [loading, setLoading] = useState(true);

  const [action, setAction] = useState({
    type: "signin",
    buttonText: "登录",
    toggleText: "创建新账户",
  });

  const [errInfo, setErrInfo] = useState({
    type: "",
    message: ""
  });


  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });


  useEffect(() => {
    let user = getCookie(COOKIE_LOGIN_USER);
    try {
      user = JSON.parse(user);
      if (user.id && user.email) {
        location.href = "./workspace.html";
        return;
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  }, []);

  const onSubmit = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const emailReg = /^\w{3,}(\.\w+)*@[A-z0-9]+(\.[A-z]{2,5}){1,2}$/
    if (!formData.email || !formData.email.match(emailReg)) {
      setErrInfo({
        type: "email",
        message: `邮箱内容为空或格式错误`
      });
      return;
    }

    if (!formData.password || formData.password === '' || formData.password.length < 6) {
      setErrInfo({
        type: "password",
        message: `请输入合适的密码（6位及以上）`
      });
      return
    }

    setErrInfo({
      type: "",
      message: ``
    });

    if (action.type === 'signin') {
      axios({
        method: "post",
        url: getApiUrl('/api/user/login'),
        data: { email: formData.email, psd: window.btoa(formData.password) }
      }).then(({ data }) => {
        if (data.code != 1) {
          setErrInfo({
            type: "",
            message: data.msg
          });
        } else {
          let user = data.data
          setCookie(COOKIE_LOGIN_USER, JSON.stringify(user), 30);
          message.success("登录成功");
          setTimeout(() => {
            location.href = "./workspace.html";
          }, 500);
        }
      })
    }

    if (action.type === 'signup') {
      axios({
        method: "post",
        url: getApiUrl('/api/user/register'),
        data: { email: formData.email, psd: window.btoa(formData.password) }
      }).then(({ data }) => {
        if (data.code != 1) {
          setErrInfo({
            type: "",
            message: data.msg
          });
        } else {
          let rData = data.data;

          setCookie(COOKIE_LOGIN_USER, JSON.stringify({
            id: rData.userId,
            email: formData.email
          }), 30);

          message.success("注册成功");
          setTimeout(() => {
            location.href = "./workspace.html";
          }, 500);
        }
      })
    }
  }, [formData]);


  const onToggleAction = useCallback((e) => {
    switch (action.type) {
      case "signin":
        setAction({
          type: "signup",
          buttonText: "创建新账户",
          toggleText: "登录",

        });
        break;
      case "signup":
        setAction({
          type: "signin",
          buttonText: "登录",
          toggleText: "创建新账户",
        });
        break;
    }
  }, [action]);


  const onChangeFormData = useCallback((e, key) => {
    let newData = {};
    newData[key] = e.target.value;

    setFormData(() => {
      return {
        ...formData,
        ...newData
      }
    });

  }, [formData]);

  const visibleSubmit = useMemo(() => {
    return !!formData.email && !!formData.password;
  }, [formData]);


  if (loading) {
    return null;
  }

  return (
    <div className={css.page}>

      {/* head */}
      <div className={css.head}>
        <Logo />
      </div>

      {/* body */}
      <div className={css.body}>


        <div className={css.entry}>
          <div className={css.aside}>
            <img className={css.banner} src="/banner.png" />
          </div>

          <div className={css.content}>

            <form onSubmit={onSubmit} className={css.form} method="post">

              <div className={css.title}>欢迎使用 Mybricks 低代码开发平台</div>

              <input
                type="text"
                className={errInfo.type === "email" ? css.err : ""}
                value={formData.email}
                onChange={(e) => { onChangeFormData(e, "email"); }}
                placeholder={'邮箱地址'} />

              <input
                type="password"
                className={errInfo.type === "password" ? css.err : ""}
                value={formData.password}
                onChange={(e) => { onChangeFormData(e, "password"); }}
                placeholder={'登录密码'} />

              <button className={`${css.submit} ${visibleSubmit && css.visible}`} onClick={onSubmit}>{action.buttonText}</button>

              <div className={css.toolbar}>
                <div className={css.errMsg}>{errInfo.message}</div>
                <div className={css.toggleButton} onClick={onToggleAction}>{action.toggleText}</div>
              </div>

            </form>

          </div>
        </div>

      </div>


      {/* foot */}
      <div className={css.foot}>
        <div className={css.links}>
          <a className={css.github} href="https://github.com/mybricks/designer-spa-demo" target="_blank">{Github}Demo源码</a>
          <a className={css.vscode} href="https://marketplace.visualstudio.com/items?itemName=Mybricks.Mybricks&ssr=false#overview" target="_blank">{VScode}组件开发</a>
          <a className={css.docs} href="https://mp.weixin.qq.com/mp/appmsgalbum?__biz=Mzg5OTg1OTYwOA==&action=getalbum&album_id=2664963833182224385" target="_blank">文档教程</a>
          <a className={css.docs} href="https://mp.weixin.qq.com/mp/appmsgalbum?__biz=Mzg5OTg1OTYwOA==&action=getalbum&album_id=2591211948751650816" target="_blank">《企业级低代码》</a>
          <a className={css.copyright} href="https://github.com/mybricks" target="_blank">@2020 板砖团队</a>
        </div>
      </div>

    </div>
  )
}
