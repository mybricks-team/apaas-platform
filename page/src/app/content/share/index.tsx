import React, {
	FC,
	useMemo,
	useState,
	useCallback
} from 'react'

import axios from 'axios'
import {message, Pagination, List} from 'antd'
import {observe} from '@mybricks/rxui'

import { Content } from '..'
import AppCtx from '../../AppCtx'
import { Icon } from '../../components'

import css from './index.less'
const pageSize = 20;

const Share: FC = () => {
	const [fileList, setFileList] = useState([])
	const [total, setTotal] = useState(0)
	const [pageIndex, setPageIndex] = useState(0)
	useMemo(() => {
		axios({
			method: 'post',
			url: '/paas/api/share/getAll',
			data: {
				pageSize: pageSize,
				page: pageIndex
			}
		}).then(({data}) => {
			if (data.code === 1) {
				setFileList(data.data?.list)
				setTotal(data.data?.total)
			} else {
				message.error(`获取数据发生错误：${data.message}`)
			}
		})
	}, [pageIndex])

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
				<div style={{display: 'flex', justifyContent: 'flex-end'}}>
					<Pagination
						current={pageIndex + 1}
						total={total}
						pageSize={pageSize}
						hideOnSinglePage={true}
						showTotal={(total) => `Total: ${total} items`}
						onChange={(newPageIndex) => {
							setPageIndex(newPageIndex - 1)
						}}
					/>
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
				<div className={css.typeIcon}>
					<Icon icon={appReg?.icon} width={18} height={18}/>
				</div>
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

export default Share;
