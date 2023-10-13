const vm = require('vm');
const fs = require('fs');
const path = require('path');
const v8 = require('v8');

v8.setFlagsFromString('--no-flush-bytecode');

let _flag_buf;

const HeaderOffsetMap = {
  'magic': 0,
  'version_hash': 4,
  'source_hash': 8,
  'flag_hash': 12
};
const headerUtils = {
  set(targetBuffer, type, sourceBuffer) {
    sourceBuffer.copy(targetBuffer, HeaderOffsetMap[type]);
  },
  get(buffer, type) {
    const offset = HeaderOffsetMap[type];
    return buffer.slice(offset, offset + 4);
  },
  buf2num(buf) {
    let ret = 0;
    ret |= buf[3] << 24;
    ret |= buf[2] << 16;
    ret |= buf[1] << 8;
    ret |= buf[0];
    return ret;
  }
};

function getReferenceFlagHash() {
  if (!_flag_buf) {
    const script = new vm.Script('');
    _flag_buf = headerUtils.get(script.createCachedData(), 'flag_hash');
  }
  return _flag_buf;
}

function validateString(value, name) {
  if (typeof value !== 'string') {
    throw new Error(`${name} is not string`);
  }
}

function makeRequireFunction(mod) {
  const Module = mod.constructor;

  const require = function require(path) {
    return mod.require(path);
  };

  require.resolve = function resolve(request, options) {
    validateString(request, 'request');
    return Module._resolveFilename(request, mod, false, options);
  };

  require.resolve.paths = function paths(request) {
    validateString(request, 'request');
    return Module._resolveLookupPaths(request, mod);
  };

  require.main = process.mainModule;
  require.extensions = Module._extensions;
  require.cache = Module._cache;

  return require;
}


function loadBytecode(filename) {
  const byteBuffer = fs.readFileSync(filename, null);
  let bytesource = '';

  try {
    bytesource = fs.readFileSync(filename.replace(/\.bytecode$/i, '.bytesource'), 'utf-8');
  } catch (e) { }

  headerUtils.set(byteBuffer, 'flag_hash', getReferenceFlagHash());

  const oldSourceHash = headerUtils.get(byteBuffer, 'source_hash');
  const sourceLength = headerUtils.buf2num(oldSourceHash);
  const dummySource = bytesource.length === sourceLength ? bytesource : '\u200b'.repeat(sourceLength);
  const script = new vm.Script(dummySource, {
    filename: filename,
    cachedData: byteBuffer
  });

  if (script.cachedDataRejected) {
    throw new Error('cannot load bytecode, check node version');
  }
  return script;
}

function execByteCode(filename) {
  const script = loadBytecode(filename);
  return script.runInThisContext();
}

(require('module'))._extensions['.bytecode'] = function loadModule(module, filename) {
  const wrapperFn = execByteCode(filename);
  const require = makeRequireFunction(module);
  wrapperFn.bind(module.exports)(module.exports, require, module, filename, path.dirname(filename));
};
