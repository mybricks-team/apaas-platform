import React, {FC, useState} from 'react';
import {Modal} from 'antd';

import styles from './module-center-modal.less';

interface ModuleCenterModal {
	visible: boolean;
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
	const { visible, onClose, onFinish } = props;
	const [moduleList, setModuleList] = useState<Module[]>([{ id: 1, name: '会员', version: '1.0.1', creator_name: 'leo', create_time: '2022-03-11 12:12:12' }]);
	
  return (
	  <Modal title="模块中心" width={880} visible={visible} onCancel={onClose} mask maskClosable destroyOnClose footer={null}>
		  <div className={styles.container}>
			  {moduleList.map(module => {
					return (
						<div key={module.id} className={styles.module}>
							<div className={styles.moduleName}>模块名：{module.name}</div>
							<div className={styles.moduleVersion}>版本：{module.version}</div>
							<div>发布时间：{module.create_time}</div>
							<div className={styles.operateBox}>安装</div>
						</div>
					);
			  })}
		  </div>
	  </Modal>
  );
};

export default ModuleCenterModal;