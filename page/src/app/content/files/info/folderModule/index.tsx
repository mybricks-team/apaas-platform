import React, {FC, useCallback, useState} from 'react';
import {observe, useComputed} from '@mybricks/rxui';
import axios from 'axios';
import {message} from "antd";
import Ctx from '../../Ctx';

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
			})).data;
			
			if (allFilesRes.code === -1) {
				message.error('发布失败');
			} else {
				message.success('发布成功');
			}
		} catch(e) {
			console.log('publish error', e);
			message.error('发布失败');
		}
		setLoading(false);
	}, [latestPath]);
	
  return (
	  <div className={styles.rightBox}>
		  <div className={styles.title}>模块管理</div>
		  <button className={styles.publish} disabled={loading} onClick={publish}>{loading ? '发布中...' : '发布模块'}</button>
	  </div>
  );
};

export default Box;