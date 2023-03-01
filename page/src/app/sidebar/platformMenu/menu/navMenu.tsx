import React, { useMemo, useCallback } from 'react';

import { useComputed, useObservable } from '@mybricks/rxui';

import ItemList from './itemList';
import NavSwitch from './navSwitch';
import { Item } from '../..';

// @ts-ignore
import css from './navMenu.less';

export type Child = {[key: string]: {
  open: boolean;
  child: Child;
}}
export interface MenuCtx {
  open: boolean;
  loading: boolean;
  items: Array<any>;
  switchOnly: boolean;
  getFiles: (...args: any) => Promise<any>;
  onClick: (...args: any) => void;
}

interface Props {
  id: string | null;
  namespace?: string;
  icon: JSX.Element | string | ((...args: any) => JSX.Element);
  name: string;
  child?: {open: boolean, child: Child};
  level?: number;
  focusable?: boolean;
  switchOnly?: boolean;
  CustomList?: ({menuCtx, child}: {menuCtx: MenuCtx, child: Child}) => JSX.Element;
  getFiles: (...args: any) => Promise<any>;
  onClick: (...args) => void;
  suffix?: React.ReactNode
}

/**
 * 
 * @param {Object} props 
 * @param {Object} props.id              唯一值
 * @param {string} props.name            名称
 * @param {string} props.icon            图标
 * @param {boolean} props.child          子节点是否展开
 * @param {boolean} props.level          层级
 * @param {boolean} props.focusable      可被点中
 * @param {boolean} props.switchOnly     仅最为开关
 * @param {JSX.Element} props.CustomList 自定义列表
 * @returns 
 */
export default function NavMenu ({
  id,
  icon,
  name,
  child,
  level = 1,
  namespace,
  focusable = true,
  switchOnly = false,
  CustomList,
  getFiles,
  onClick,
  suffix
}: Props): JSX.Element {
  const menuCtx: MenuCtx = useObservable({
    open: child?.open || false,
    loading: false,
    items: [],
    switchOnly,
    getFiles,
    onClick
  });

  useMemo(() => {
    if (!child) return;

    if (menuCtx.open) {
      // 默认是展开话，设置loading为true，拉子节点
      menuCtx.loading = true;
    }
  }, []);

  const Switch: JSX.Element = useMemo(() => {
    return !child ? (<></>) : (
      <NavSwitch
        id={id}
        child={child}
        menuCtx={menuCtx}
      />
    );
  }, []);

  const List: JSX.Element = useMemo(() => {
    return !child ? (<></>) : (
      <RenderList id={id} CustomList={CustomList} level={level} child={child} menuCtx={menuCtx} />
    );
  }, []);

  const navClick: () => void = useCallback(() => {
    if (focusable) {
      onClick(id);
    }

    if (!child) return;

    if (!menuCtx.open && !switchOnly) {
      menuCtx.loading = true;
    } else {
      menuCtx.open = true;
      child.open = true;
    }
  }, []);

  return (
    <>
      <Item
        prefix={Switch}
        suffix={suffix}
        icon={icon}
        title={name}
        namespace={namespace}
        onClick={navClick}
      />
      {List}
    </>
  );
}

function RenderList ({id, CustomList, level, child, menuCtx}): JSX.Element {
  return useComputed(() => {
    if (menuCtx.open) {
      return (
        <div style={{marginLeft: level * 28}}>
          {CustomList ? <CustomList menuCtx={menuCtx} child={child.child} /> : <ItemList id={id} child={child.child} menuCtx={menuCtx} />}
        </div>
      );
    }

    return <></>;
  });
}
