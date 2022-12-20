import React, { useMemo, useCallback } from 'react';
import { useComputed } from 'rxui-t';

import { OtherApps } from './otherApps';
import { SystemMenus } from './systemMenus';
import WorkspaceContext, { APP_MENU_ITEMS, APP_DEFAULT_ACTIVE_MENUID } from '../WorkspaceContext';

// @ts-ignore
import css from './Docker.less';

/** Docker (左侧边栏) */
export default function Docker(): JSX.Element {
  const { user } = WorkspaceContext;

  return (
    <div className={css.docker}>
      <Logo />
      <div className={css.body}>
        <OtherApps />
        <AppMenusPanel />
        <SystemMenus />
      </div>
    </div>
  );
}

/** logo */
function Logo (): JSX.Element {
  /** 点击logo */
  const logoClick: () => void = useCallback(() => {
    WorkspaceContext.setUrlQuery("path", APP_DEFAULT_ACTIVE_MENUID)
  }, []);

  return (
    <div className={css.logo} onClick={logoClick}>
      <div>
        <img src={'/icon.png'} alt="" />
      </div>
      <span>My<i>B</i>ricks</span>
    </div>
  )
}

/** 菜单项面板 */
function AppMenusPanel (): JSX.Element {
	
  /** 菜单项面板 */
  const Render: JSX.Element[] = useComputed(() => {
    return APP_MENU_ITEMS.map((app) => {
      const { icon, title, namespace } = app;
	    
      return (
        <Item
          key={namespace}
          icon={icon}
          title={title}
          namespace={namespace}
        />
      );
    });
  });

  return (
    <Catelog style={{ flex: 1 }}>
      <div>
	      {Render}
      </div>
	
	    <div style={{ marginTop: 'auto' }}>
		    <Item
			    icon="https://assets.mybricks.world/icon/163921.png"
			    title="回收站"
			    namespace="trash"
		    />
	    </div>
    </Catelog>
  );
}

// interface ItemProps {
//   active?: boolean;
//   item?: T_App;
//   onClick: () => void;
//   iconStyle?: {[key: string]: any}

//   Icon?: JSX.Element
//   Title?: JSX.Element
// }

/**
 * 菜单项组件入参
 */
interface ItemProps {
  /** 图标 */
  icon: JSX.Element | string;
  /** 名称 */
  title: JSX.Element | string;
  /** 唯一标识，用于决定是否能够展现选中状态 */
  namespace?: string;
  /** 自定义点击事件 */
  onClick?: () => void;
}

/** 菜单项封装 */
export function Item ({icon, title, namespace, onClick}: ItemProps): JSX.Element {
  
  // title 标题
  // icon 图标

  // namespace 命名空间 唯一标识，若传入namespace 那么才有可能被聚焦 active
  // onClick 点击事件，未传入即默认！

  /** 菜单项点击 */
  const itemClick: () => void = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      WorkspaceContext.setUrlQuery('path', namespace);
    }
  }, []);

  /** 是否被选中，未传入命名空间永远为否 */
  const className = useComputed(() => {
    let className = css.menuItem;
    if (namespace) {
      const { urlQuery: { path } } = WorkspaceContext;
      if (path === namespace) {
        className = className + ` ${css.menuItemActive}`;
      }
    }
    return className;
  });

  /** 菜单项信息 */
  const ItemInfo: JSX.Element = useMemo(() => {
    return (
      <>
        <div className={css.menuIcon}>
          {typeof icon === "string" ? <img src={icon} width={20} height={20}/> : icon}
        </div>
        <div className={css.menuLabel}>
          {title}
        </div>
      </>
    );
  }, [title, icon]);

  return (
    <div
      className={className}
      onClick={itemClick}
    >
     {ItemInfo}
    </div>
  )
}

// export function Item ({item, active = false, onClick = () => {}, iconStyle = {}, Icon, Title}: ItemProps): JSX.Element {
//   return (
//     <div className={`${css.menuItem} ${active ? css.menuItemActive : ''}`}
//       onClick={onClick}
//     >
//       <div className={css.menuIcon} style={iconStyle}>
//         {Icon && Icon}
//         {item && <img src={item.icon} width={20} height={20}/>}
//       </div>
//       <div className={css.menuLabel}>
//         {Title && Title}
//         {item && item.title}
//       </div>
//     </div>
//   )
// }

/** 分组 */
export function Catelog ({style = {}, children}): JSX.Element {
  return (
    <div className={css.catelog} style={style}>
      <div className={css.menuPanel}>
        {children}
      </div>
    </div>
  );
}
