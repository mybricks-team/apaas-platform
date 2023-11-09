import * as fs from 'fs';
import * as path from 'path';

/** 删除文件/文件夹 */
export const removeFile = filePath => {
	const stat = fs.statSync(filePath);

	if (stat.isDirectory()) {
		const pathList = [filePath];
		const rmdirPathList = [];

		while(pathList.length) {
			const folderPath = pathList.shift();
			const files = fs.readdirSync(folderPath);

			for (const file of files) {
				const curFilePath = path.join(folderPath, file);
				const stat = fs.statSync(curFilePath);

				if (stat.isDirectory()) {
					pathList.push(curFilePath);
				} else {
					fs.unlinkSync(curFilePath);
				}
			}

			rmdirPathList.push(folderPath);
		}

		for (let i = rmdirPathList.length - 1; i >= 0; i--) {
			fs.rmdirSync(rmdirPathList[i]);
		}
	} else {
		fs.unlinkSync(filePath);
	}
};