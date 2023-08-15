import React, {FC, useCallback, useEffect, useState} from 'react';
import {message, Modal} from 'antd';
import axios from "axios";
import {observe} from "@mybricks/rxui";
import AppCtx from "../../../../AppCtx";
import {getApiUrl} from "../../../../../utils";

import styles from './module-center-modal.less';

interface ModuleCenterModal {
	projectId: number;
	visible: boolean;
	installedModuleList: Array<{ id: number; version: string; name: string }>;
	onClose(): void;
	onFinish(): void;
}

interface Module {
	id: number;
	name: string;
	version: string;
	description?: string;
	creator_name: string;
	create_time: string;
}

const ModuleCenterModal: FC<ModuleCenterModal> = props => {
	const { visible, onClose, onFinish, projectId, installedModuleList } = props;
	const appCtx = observe(AppCtx, {from: 'parents'});
	const [moduleList, setModuleList] = useState<Module[]>([]);
	const [moduleId, setModuleId] = useState(-1);
	
	useEffect(() => {
		if (visible) {
			axios({ method: "get", url: getApiUrl('/paas/api/module/list') }).then(res => {
				if (res.data.code === 1) {
					setModuleList(res.data.data || []);
				}
			});
		} else {
			setModuleList([]);
		}
	}, [visible]);
	
	const install = useCallback((moduleId: number) => {
		setModuleId(moduleId);
		
		axios({ method: "post", url: getApiUrl('/paas/api/module/install'), data: { id: moduleId, projectId, userId: appCtx.user.id } })
			.then(res => {
				if (res.data.code === 1) {
					message.success('安装成功');
					onClose();
					onFinish();
				} else {
					message.error('安装失败');
				}
			})
			.catch((e) => {
				console.log(e)
				message.error('安装失败')
			})
			.finally(() => {
				setModuleId(-1)
			});
	}, [onClose, onFinish, projectId]);
	
  return (
	  <Modal title="模块中心" width={880} visible={visible} onCancel={onClose} mask maskClosable destroyOnClose footer={null}>
		  <div className={styles.container}>
			  {moduleList.map(module => {
				  const installing = module.id === moduleId;
					const installed = !!installedModuleList.find(m => m.id === module.id);
					
				  return (
						<div key={module.id} className={styles.module}>
							<div className={styles.moduleName}>模块名：{module.name}</div>
							<div className={styles.moduleVersion}>版本：{module.version}</div>
							<div>发布时间：{module.create_time}</div>
							<div
								className={`${styles.operateBox} ${installing ? styles.installing : ''} ${installed ? styles.installed : ''}`}
								onClick={(installed || installing) ? undefined : () => install(module.id)}
							>
								{installed ? '已安装' : (installing? '安装中...' : '安装')}
							</div>
						</div>
					);
			  })}
		  </div>
	  </Modal>
  );
};

export default ModuleCenterModal;