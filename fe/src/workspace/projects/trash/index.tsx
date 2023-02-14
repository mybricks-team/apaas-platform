import React, {FC, useCallback, useMemo, useState} from 'react'
import {useComputed} from '@mybricks/rxui';
import axios from 'axios';
import {message} from 'antd';
import moment from 'moment';
import WorkspaceContext from '../../WorkspaceContext';
import {Content} from '../index';
import FileIcon from '../../icon/file-icon';
import {IconRecover} from '../../icon';

import styles from '../myProjects/projects/index.less';

const Trash: FC = () => {
	const user = useComputed(() => WorkspaceContext.user);
	const [fileList, setFileList] = useState([]);
	const fetchTrashes = useCallback(() => {
		axios({
			method: 'get',
			url: '/api/workspace/trashes',
			params: { userId: user.email }
		}).then(({data}) => {
			if (data.code === 1) {
				setFileList(data.data);
			} else {
				message.error(`获取数据发生错误：${data.message}`)
			}
		});
	}, [user]);
	
	useMemo(() => {
		fetchTrashes();
	}, []);
	
	return (
		<Content title="回收站">
			<div className={styles.view}>
				<div className={styles.files}>
					{fileList?.map((item, idx) => {
						return (
							<ProjectItem key={idx} item={item} user={user} refresh={fetchTrashes} />
						)
					})}
				</div>
			</div>
		</Content>
	);
};

const ProjectItem = ({ item, user, refresh }) => {
	const APPSMap = useComputed(() => WorkspaceContext.APPSMap);
	const appReg = APPSMap[item.extName];
	const recover = useCallback((event) => {
		event.stopPropagation();
		
		axios({
			method: 'post',
			url: '/api/workspace/recoverFile',
			data: { userId: user.email, id: item.id }
		}).then(({data}) => {
			if (data.code === 1) {
				message.success('文件恢复成功');
				refresh();
			} else {
				message.error('文件恢复失败，请稍候再试');
			}
		}).catch(() => {
			message.error('文件恢复失败，请稍候再试');
		})
	}, [item, user]);
	
	return (
		<div className={styles.file}>
			<div className={styles.snap}>
				<FileIcon urlIcon={item.icon} icon={appReg?.icon}/>
			</div>
			<div className={styles.tt}>
				<FileIcon icon={appReg?.icon} width={18}/>
				<div className={styles.detail}>
					<div className={styles.name}>
						{item.name}
					</div>
					<div className={styles.path} data-content-start={item.path}>
						将于 {moment(item.startTime).add(15, 'days').format('YYYY-MM-DD HH:mm')} 清理
					</div>
				</div>
				
				<div className={styles.btns}>
          <span onClick={recover}>
            <IconRecover width={32} height={32}/>
          </span>
				</div>
			</div>
		</div>
	);
};

export default Trash;