import React, {FC, useCallback, useMemo, useState} from 'react';
import {message} from 'antd';
import axios from 'axios';
import {useComputed} from 'rxui-t';
import WorkspaceContext from '../WorkspaceContext';
import FileIcon from '../icon/file-icon';

// @ts-ignore
import css from './index.less';

const Ground: FC = () => {
	const [fileList, setFileList] = useState([]);
	useMemo(() => {
		axios({
			method: 'get',
			url: '/api/ground/getAll'
		}).then(({data}) => {
			if (data.code === 1) {
				setFileList(data.data);
			} else {
				message.error(`获取数据发生错误：${data.message}`)
			}
		})
	}, []);
	
	return (
		<div className={css.view}>
			<div className={css.files}>
				{fileList?.map((item, idx) => {
					return (
						<ProjectItem key={idx} item={item}/>
					)
				})}
			</div>
		</div>
	);
};

const ProjectItem = ({ item }) => {
	const APPSMap = useComputed(() => WorkspaceContext.APPSMap);
	const appReg = APPSMap[item.extName];
	
	const open = useCallback((item) => {
		window.location.href = `${appReg.homepage}?id=${item.id}`;
	}, [appReg]);
	
	return (
		<div className={css.file} onClick={() => open(item)}>
			<div className={css.snap}>
				<FileIcon urlIcon={item.icon} icon={appReg?.icon}/>
			</div>
			<div className={css.tt}>
				<FileIcon icon={appReg?.icon} width={18}/>
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