import React from 'react';
import css from "./styles.less";

export default function () {
  return (
    <div className={css.logo}>
      <img src={'/icon.png'} />
      <span>My<i>B</i>ricks</span>
    </div>
  )
}