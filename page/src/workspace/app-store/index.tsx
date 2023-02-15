import React, {useEffect, useState} from 'react';
import {observe} from '@mybricks/rxui';
import {message} from 'antd';
import axios from 'axios';
import AppList from './components/app-list';
import WorkspaceContext, {T_App} from '../WorkspaceContext';

// @ts-ignore
// import css from './index.less';

const AppStore = () => {
	const wsCtx = observe(WorkspaceContext, {from: 'parents'})
	const [loading, setLoading] = useState(false);
	const [allApps, setAllApps] = useState<T_App[]>([]);
	const installedApps = wsCtx.InstalledAPPS;
	
	useEffect(() => {
		setLoading(true);
		
		axios('/api/apps/getLatestAllFromSource').then((res) => {
			if (res.data.code === 1) {
				setAllApps(res.data.data);
			} else {
				message.error(`获取数据发生错误：${res.data.message}`);
			}
		}).finally(() => {
			setLoading(false);
		});
	}, []);
	
	return (
		// <div className={css.viewContainer}>
		<AppList installedApps={installedApps} allApps={allApps} loading={loading}/>
		// </div>
	);
};
export default AppStore;
