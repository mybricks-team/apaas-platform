const FileService = require('./file.service').default
const FileController = require('./file.controller').default

class RealFileModule {}

const FileModule = {
  module: RealFileModule,
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
}

module.exports = FileModule
