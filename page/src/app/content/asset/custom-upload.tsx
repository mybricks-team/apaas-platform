import React, {FC, useCallback} from 'react';
import { Upload } from 'antd';
import { UploadIcon } from '@/app/components';

interface CustomUploadProps {
	onChange?(value: any): void;
}

const { Dragger } = Upload;
const CustomUpload: FC<CustomUploadProps> = props => {
	const { onChange } = props;
	const onCurChange = useCallback(({ fileList }) => onChange?.(fileList), [onChange]);

	return (
		<>
			<Dragger
				beforeUpload={() => false}
				name="file"
				multiple
				onChange={onCurChange}
			>
				<p className="ant-upload-drag-icon" style={{ color: '#40a9ff' }}>
					<UploadIcon width="48px" height="48px" />
				</p>
				<p className="ant-upload-text">点击选择文件或者拖动文件到这里上传</p>
			</Dragger>
		</>
	);
};

export default CustomUpload;
