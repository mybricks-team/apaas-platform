const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

function traverseDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stats = fs.statSync(fullPath);
    
    // 如果当前文件是文件夹，则递归调用traverseDirectory函数
    if (stats.isDirectory()) {
      traverseDirectory(fullPath);
    } else {
      if(fullPath.endsWith('.js')) {
        let obfuscationResult = JavaScriptObfuscator.obfuscate(
          fs.readFileSync(fullPath, 'utf8'),
          {
              compact: false,
              controlFlowFlattening: true,
              controlFlowFlatteningThreshold: 1,
              numbersToExpressions: true,
              simplify: true,
              stringArrayShuffle: true,
              splitStrings: true,
              stringArrayThreshold: 1
          }
        );
        const obuseContent = obfuscationResult.getObfuscatedCode()
        fs.writeFileSync(fullPath, obuseContent);
      };
      
    }
  });
}
if(fs.existsSync(path.join(__dirname, './server/dist'))) {
  traverseDirectory(path.join(__dirname, './server/dist'));
} else {
  console.log('未构建，跳过！')
}
