import React, { useEffect } from 'react';
import { loadMicroApp } from 'qiankun';
import { uniqueId } from 'lodash-es'

import styles from './index.less';

export function MicroApp({ entry }: { entry: string }) {
	const id = `microapp-${uniqueId()}`
	useEffect(() => {
		const microApp = loadMicroApp({
			name: entry,
			entry,
			container: `#${id}`
		});
		return () => {
			microApp?.unmount()
		}
	}, [])

	return (
		<div className={styles.microAppContainer} id={id}></div>
	)
}