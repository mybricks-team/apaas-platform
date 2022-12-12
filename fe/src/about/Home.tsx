import css from './Home.less';

import React from 'react';
import NavBar from "../Navbar";

//import hljs from 'highlight.js'
//import 'highlight.js/styles/atom-one-light.css'
import {Github, VScode} from "./Icons";

export default function App() {
  // useEffect(() => {
  //   hljs.configure({
  //     ignoreUnescapedHTML: true
  //   })
  //   const codes = document.querySelectorAll('pre code')
  //   codes.forEach((el) => {
  //     hljs.highlightElement(el as HTMLElement)
  //   })
  // }, [])
  //
  // const content = `
  // import Designer from '@mybricks/designer-spa';
  //
  // &lt;Designer config={config} ref={designerRef}/&gt;
  // `

  return (
    <div className={css.view}>
      <div className={css.groupQR}>
        <img src={'/mybricks-qrcode.jpeg'}/>
        关注Mybricks公众号
      </div>

      <div className={css.chat}>
        <img src={'/wechat.png'}/>
        添加到微信群
      </div>
      <NavBar/>

      <div className={css.slogan}>使用Mybricks引擎打造您自己的aPaaS平台</div>

      <div className={css.btns}>
        <button className={css.github} onClick={e => {
          window.location.href = 'https://github.com/mybricks/designer-spa-demo'
        }}>{Github}Demo源码
        </button>
        <button className={css.vscode} onClick={e => {
          window.location.href = 'https://marketplace.visualstudio.com/items?itemName=Mybricks.Mybricks&ssr=false#overview'
        }}>{VScode}开发环境
        </button>
      </div>
      {/*<pre className="language-jsx">*/}
      {/*  <code dangerouslySetInnerHTML={{__html: content}}/>*/}
      {/*  <button className={css.docs} onClick={e => {*/}
      {/*    window.location.href = 'https://github.com/mybricks/designer-spa-demo'*/}
      {/*  }}>查看详情</button>*/}
      {/*</pre>*/}

      <div className={css.showPic}>
        <img src={'/img.png'}/>
      </div>
      {/*<ShowDesigner/>*/}

      <div className={css.copyrights}>
        <a href={'https://github.com/mybricks'} target={'_blank'}>@2020 板砖团队</a>
        <a className={css.gov} href="https://beian.miit.gov.cn/" target="_blank">
          浙ICP备2020041363号
        </a>
      </div>
    </div>
  )
}

