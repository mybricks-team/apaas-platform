import React, { useCallback } from 'react';
import { useComputed } from 'rxui-t';
import WorkspaceContext, { T_App, APP_MENU_ITEMS, APP_MENU_ITEM_ID } from '../WorkspaceContext';
import { OtherApps } from './otherApps';
import { GlobalConfig } from './globalConfig';

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
        <GlobalConfig user={user} />
      </div>
    </div>
  );
}

function Logo (): JSX.Element {
  return (
    <div className={css.logo}>
      <div>
        <img src={'/icon.png'} alt="" />
      </div>
      <span>My<i>B</i>ricks</span>
    </div>
  )
}

/** 菜单项面板 */
function AppMenusPanel (): JSX.Element {

  /** 菜单项点击 */
  const appMenuItemClick: (itemId: APP_MENU_ITEM_ID, app) => void = useCallback((itemId: APP_MENU_ITEM_ID, app) => {
    WorkspaceContext.setUrlQuery('path', itemId);
	  WorkspaceContext.selectedApp = app;
  }, []);
	
  /** 菜单项面板 */
  const Render: JSX.Element[] = useComputed(() => {
    return APP_MENU_ITEMS.map((app) => {
      const { namespace } = app;
	    
      return (
        <Item
          key={namespace}
          active={namespace === WorkspaceContext.selectedApp?.namespace}
          item={app}
          onClick={() => appMenuItemClick(namespace as APP_MENU_ITEM_ID, app)}
        />
      );
    });
  });

  return (
    <Catelog>
      {Render}
    </Catelog>
  );
}

interface ItemProps {
  active?: boolean;
  item?: T_App;
  onClick: () => void;
  iconStyle?: {[key: string]: any}

  Icon?: JSX.Element
  Title?: JSX.Element
}

export function Item ({item, active = false, onClick = () => {}, iconStyle = {}, Icon, Title}: ItemProps): JSX.Element {
  return (
    <div className={`${css.menuItem} ${active ? css.menuItemActive : ''}`}
      onClick={onClick}
    >
      <div className={css.menuIcon} style={iconStyle}>
        {Icon && Icon}
        {item && <img src={item.icon} width={20} height={20}/>}
      </div>
      <div className={css.menuLabel}>
        {Title && Title}
        {item && item.title}
      </div>
    </div>
  )
}

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
