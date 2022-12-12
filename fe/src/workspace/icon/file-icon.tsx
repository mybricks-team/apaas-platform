import React from 'react';
import {getApiUrl} from '../../utils';

// @ts-ignore
import css from './index.less';

/** icon -> 如果有urlIcon则加载，否则使用默认icon */
const FileIcon = ({urlIcon, icon, big, width = 32}: {urlIcon?: string, icon?: string, big?: boolean, width?: number}): JSX.Element => {
	return urlIcon ? (
		<img src={getApiUrl(urlIcon)} alt="" />
	) : (
		<div className={css.typeIcon}>
			<div style={big ? {height: 140, display: 'flex', alignItems: 'center'} : {width, height: width}}>
				<img src={icon} width={'100%'} height={'100%'} alt="" />
			</div>
		</div>
	);
}

export default FileIcon;