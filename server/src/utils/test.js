const fs = require('fs');
const readline = require('readline');

async function readLargeFileReverse(filePath) {
    const bufferSize = 64 * 1024;
    const buffer = Buffer.alloc(bufferSize);
    const fileDescriptor = fs.openSync(filePath, 'r');

    let position = fs.statSync(filePath).size;

    // while (position > 0) {
    //     const bytesRead = fs.readSync(fileDescriptor, buffer, 0, bufferSize, position - bufferSize);
    //     const lines = buffer.toString('utf-8', 0, bytesRead).split('\n');
    //
    //     // 处理每个块中的行（从尾部到头部）
    //     for (let i = lines.length - 1; i >= 0; i--) {
    //         console.log(lines[i]);
    //     }
    //
    //     position -= bytesRead;
    // }

    const bytesRead = fs.readSync(fileDescriptor, buffer, 0, bufferSize, position - bufferSize);
    const lines = buffer.toString('utf-8', 0, bytesRead).split('\n');

    // 处理每个块中的行（从尾部到头部）
    for (let i = lines.length - 1; i >= 0; i--) {
        console.log(lines[i]);
    }

    position -= bytesRead;

    fs.closeSync(fileDescriptor);
}

const filePath = '/Users/leo/Project/apaas-platform/logs/application/application-20240201.log';
readLargeFileReverse(filePath);
