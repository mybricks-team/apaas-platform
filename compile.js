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


    // const code1 = await fs.readFile('./server/src/hh1.ts', 'utf-8');
    // const script1 = new vm.Script(_module.wrap(code1));
    // const bytecode1 = script1.createCachedData();
    // await fs.writeFile('./server/src/hh.bytecode', bytecode1);

    const fileModule = await fs.readFile('./server/src/module/file/file.module.ts', 'utf-8');
    const script2 = new vm.Script(_module.wrap(fileModule));
    const bytecode2 = script2.createCachedData();
    await fs.writeFile('./server/src/module/file/file.module.bytecode', bytecode2);
}

compileFile();