require('./src/loadBytcode')
const index = require('./index.bytecode')

module.exports = {
  func1: index.sayHello,
  func2: index.external,
}