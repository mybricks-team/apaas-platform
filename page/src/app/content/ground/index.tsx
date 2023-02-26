import React, {
	FC,
	useMemo,
	useState,
	useCallback
} from 'react'

import axios from 'axios'
import {message} from 'antd'
import {observe} from '@mybricks/rxui'

import { Content } from '..'
import AppCtx from '../../AppCtx'
import { Icon } from '../../components'

import css from './index.less'

const Ground: FC = () => {
	const [fileList, setFileList] = useState([])

	useMemo(() => {
		axios({
			method: 'get',
			url: '/api/ground/getAll'
		}).then(({data}) => {
			if (data.code === 1) {
				setFileList(data.data)
			} else {
				message.error(`获取数据发生错误：${data.message}`)
			}
		})
	}, [])

	return (
		<Content title="大家的分享">
			<div className={css.view}>
				<div className={css.files}>
					{fileList?.map((item, idx) => {
						return (
							<ProjectItem key={idx} item={item}/>
						)
					})}
				</div>
			</div>
		</Content>
	)
}

const ProjectItem = ({ item }) => {
	const appCtx = observe(AppCtx, {from: 'parents'})
	const APPSMap = appCtx.APPSMap;
	const appReg = APPSMap[item.extName];
	
	const open = useCallback((item) => {
		window.location.href = `${appReg.homepage}?id=${item.id}`;
	}, [appReg]);
	
	return (
		<div className={css.file} onClick={() => open(item)}>
			<div className={css.snap}>
				<Icon icon={item.icon || appReg?.icon}/>
			</div>
			<div className={css.tt}>
				<Icon icon={appReg?.icon} width={18}/>
				<div className={css.detail}>
					<div className={css.name}>
						{item.name}
					</div>
					<div className={css.path} data-content-start={item.path}>
						{item.createTime}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Ground;
