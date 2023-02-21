import React, {FC, useCallback, useState} from 'react';
import {observe, useComputed} from '@mybricks/rxui';
import Ctx from '../Ctx';
import axios from 'axios';

import styles from './index.less';

const Box: FC = () => {
	const ctx = observe(Ctx, {from: 'parents'});
	const [loading, setLoading] = useState(false);
	
	const latestPath = useComputed(() => {
		return ctx.path[ctx.path.length - 1];
	});
	const publish = useCallback(async () => {
		setLoading(true);
		console.log('latestPath', latestPath, ctx.user);
		try {
			const allFilesRes = (await axios({
				method: 'post',
				url: '/paas/api/workspace/publish/module',
				data: {
					fileId: latestPath.id,
					email: ctx.user.email
				}
			})).data
			console.log('@@@@', allFilesRes)
		} catch(e) {
			
		}
	}, [latestPath]);
	
  return (
	  <div className={styles.rightBox}>
		  <div className={styles.title}>模块管理</div>
		  <button className={styles.publish} disabled={loading} onClick={publish}>发布项目</button>
	  </div>
  );
};

export default Box;