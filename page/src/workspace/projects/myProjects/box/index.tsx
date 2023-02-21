import React, {FC, useCallback, useState} from 'react';
import {observe, useComputed} from '@mybricks/rxui';
import Ctx from '../Ctx';

import styles from './index.less';

const Box: FC = () => {
	const ctx = observe(Ctx, {from: 'parents'});
	const [loading, setLoading] = useState(false);
	
	const latestPath = useComputed(() => {
		return ctx.path[ctx.path.length - 1];
	});
	const publish = useCallback(() => {
		console.log('latestPath', latestPath);
		setLoading(true);
	}, [latestPath]);
	
  return (
	  <div className={styles.rightBox}>
		  <div className={styles.title}>项目管理</div>
		  <button className={styles.publish} disabled={loading} onClick={publish}>发布项目</button>
	  </div>
  );
};

export default Box;