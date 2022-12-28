import React, {
  useMemo,
  useState,
  useEffect,
  useCallback
} from 'react';
import { useComputed } from 'rxui-t';

import { OtherApps } from './otherApps';
import { SystemMenus } from './systemMenus';
import { eventOperation } from '../../utils';
import { usePanelItem, Props as PanelItemProps } from '../hooks/usePanelItem';
import WorkspaceContext, { 
  APP_MENU_ITEMS,
  APP_DEFAULT_ACTIVE_MENUID } from '../WorkspaceContext';

// @ts-ignore
import css from './Docker.less';

/** Docker (左侧边栏) */
export default function Docker(): JSX.Element {
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
    WorkspaceContext.setUrlQuery('path', APP_DEFAULT_ACTIVE_MENUID)
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
    <Catelog style={{ flex: '1 0 auto', height: 0, overflow: 'auto' }}>
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
  /** 弹窗/抽屉/... */
  modal?: PanelItemProps;

  prefix?: React.ReactNode;

  suffix?: React.ReactNode;
}

/** 菜单项封装 */
export function Item ({icon, title, namespace, onClick, modal, prefix, suffix}: ItemProps): JSX.Element {
  const [itemContext] = useState({
    /** 菜单项点击 */
    onClick() {
      if (onClick) {
        onClick();
      } else {
        WorkspaceContext.setUrlQuery('path', namespace);
      }
    }
  });

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
    <>
      <div
        className={className}
        style={{paddingLeft: prefix ? 5 : 5 + 14}}
        onClick={eventOperation(itemContext.onClick).stop}
      >
        <div className={css.left}>
          {prefix && <div>{prefix}</div>}
          {ItemInfo}
        </div>
       
        {suffix && <div className={css.right}>{suffix}</div>}
      </div>
      {modal && <Modal {...modal} itemContext={itemContext}/>}
    </>
  )
}

interface ModalProps extends PanelItemProps {
  itemContext: {
    onClick: Function;
  }
}

function Modal (props: ModalProps) {
  const { showPanel, Content } = usePanelItem(props);

  useEffect(() => {
    props.itemContext.onClick = showPanel;
  }, []);

  return Content;
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
