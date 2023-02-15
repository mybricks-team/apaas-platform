import React, { useCallback } from "react";
import css from "./styles.less";


export default function (props) {
  return (<div className={css.card}>
    <div className={css.head}>
      <div className={css.extraIcon}>vue</div>
      <div className={css.thumbnail}></div>
    </div>
    <div className={css.body}>
      <div className={css.type}>type</div>
      <div className={css.content}>
        <div className={css.title}>title titletitletitletitletitle</div>
        <div className={css.author}>authorauthorauthorauthor</div>
      </div>
    </div>
    <div className={css.foot}>
      <div className={css.extraInfo}>最后更新于</div>
    </div>
  </div>);
}