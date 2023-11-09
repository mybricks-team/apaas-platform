const vm = require('vm');
const fs = require('fs').promises;
const _module = require('module');
const v8 = require('v8');
v8.setFlagsFromString('--no-lazy');

async function compileFile(filePath = './server/src/module-loader1.ts') {
    const code = await fs.readFile(filePath, 'utf-8');
    const script = new vm.Script(_module.wrap(code));
    const bytecode = script.createCachedData();
    await fs.writeFile('./server/src/module-loader.bytecode', bytecode);
}

compileFile();