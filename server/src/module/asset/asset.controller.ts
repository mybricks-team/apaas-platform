import {Body, Controller, Post, UploadedFile, UseInterceptors} from '@nestjs/common';
import {FileInterceptor} from "@nestjs/platform-express";
import AssetService, {AssetType} from '../asset/asset.service';

@Controller('/paas/api/asset')
export default class AssetController {
  assetService: AssetService;

  constructor() {
    this.assetService = new AssetService();
  }

  @Post('/publish')
  @UseInterceptors(FileInterceptor('file'))
  publishAsset(@Body() body, @UploadedFile() file) {
    const { type } = body;

    if (type === AssetType.APP) {
      const { name, namespace, version } = body;

      if (!name || !namespace || !version || !file) {
        return { code: -1, message: '参数 name、namespace、version、file 不能为空' };
      }
      return this.assetService.publishAPP(body, file);
    } else if (type === AssetType.MATERIAL) {}
  }
}
