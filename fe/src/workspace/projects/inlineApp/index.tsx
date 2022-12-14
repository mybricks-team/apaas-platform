import React, { FC } from 'react';
import { useComputed } from 'rxui-t';

import { Content } from '..';
import WorkspaceContext, { T_App } from '../../WorkspaceContext';

// @ts-ignore
import styles from './index.less';

/** TODO: 采用微前端方式接入 */
const InlineApp = ({app}: {app: T_App}) => {

	return (
		<Content title={app.title}>
			<div className={styles.inlineAppContainer}>
			  {app.Element ? <app.Element /> : <iframe className={styles.inlineAppIframe} src={app.homepage} frameBorder="0"/>}
		  </div>
		</Content>
	);
};

export default InlineApp;
