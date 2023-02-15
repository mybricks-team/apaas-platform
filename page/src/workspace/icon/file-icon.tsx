import React from 'react';
import {getApiUrl} from '../../utils';

/** icon -> 如果有urlIcon则加载，否则使用默认icon */
const FileIcon = ({urlIcon, icon, big, width = 32}: {urlIcon?: string, icon?: string | ((...args: any) => JSX.Element), big?: boolean, width?: number}): JSX.Element => {
	return urlIcon ? (
		<img src={getApiUrl(urlIcon)} alt="" />
	) : (
		<div style={big ? {height: 140, display: 'flex', alignItems: 'center'} : {width, height: width}}>
			{typeof icon === 'string' ? (
				<img src={icon} width={'100%'} height={'100%'} alt="" />
			) : icon({width: '100%', height: '100%'})}
		</div>
	);
}

export default FileIcon;