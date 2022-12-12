import React, { FC } from 'react';
import { useComputed } from 'rxui-t';
import WorkspaceContext from '../WorkspaceContext';

// @ts-ignore
import styles from './index.less';

/** TODO: 采用微前端方式接入 */
const InlineApp: FC = () => {
	const InlineApp = useComputed(() => WorkspaceContext.selectedApp);
	
  return (
	  <div className={styles.inlineApp}>
		  <div className={styles.title}>{InlineApp.title}</div>
		  <div className={styles.inlineAppContainer}>
			  {InlineApp.Element ? <InlineApp.Element /> : <iframe className={styles.inlineAppIframe} src={InlineApp.homepage} frameBorder="0"/>}
		  </div>
	  </div>
  );
};

export default InlineApp;