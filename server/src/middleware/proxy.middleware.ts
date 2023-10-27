import { NextFunction, Request, Response } from "express";

const PAAS_PREFIX = [
  "/api/apps/",
  "/api/config/",
  "/api/file/",
  "/api/ground/",
  "/api/product/",
  "/api/system/",
  "/api/task/",
  "/api/user/",
  "/api/workspace/",
];

/*
  /mybricks-domain/api/domain/publish
  /mybricks-pc-page/api/config/get
  /mybricks-pc-page/paas/api/config/get
*/
export const proxyMiddleWare = (query: { namespaceMap: any }) => {
  const appRegs = [];
  const paasRegs = [];
  const prefixList = Object.keys(query?.namespaceMap)
  prefixList?.forEach((prefix) => {
    appRegs.push({
      reg: new RegExp(`^/${prefix}/`),
      namespace: prefix
    });
  });
  PAAS_PREFIX?.forEach((prefix) => {
    paasRegs.push(new RegExp(`^${prefix}`));
  });
  return (req: Request, res: Response, next: NextFunction) => {
    let handleUrl = req.url;
    let jumpPaas = false;

    let customPrefixList = Object.keys(global.MYBRICKS_MODULE_CUSTOM_PATH || {})
    customPrefixList?.forEach((prefix) => {
      if(req?.path?.startsWith(prefix)) {
        console.log('自定义业务接口：', req?.path)
        next()
        return
      }
    })

    appRegs.forEach(({reg, namespace}) => {
      if (reg.test(handleUrl)) {
        jumpPaas = true;
        if(query?.namespaceMap?.[namespace]?.hasService) {
          let isPaaSInterface = false
          PAAS_PREFIX.forEach(i => {
            if(handleUrl.indexOf(i) !== -1) {
              isPaaSInterface = true
            }
          })
          if(isPaaSInterface) {
            if(handleUrl.indexOf('/paas/') !== -1) {
              handleUrl = handleUrl.replace(reg, "/");
            } else {
              handleUrl = handleUrl.replace(reg, "/paas/");
            }
          } else {
            handleUrl = handleUrl.replace(reg, "/");
          }
        } else {
          if(handleUrl.indexOf('/paas/') !== -1) {
            handleUrl = handleUrl.replace(reg, "/");
          } else {
            handleUrl = handleUrl.replace(reg, "/paas/");
          }
        }
      }
    });
    if (!jumpPaas) {
      paasRegs.forEach((reg, index) => {
        const restPart = PAAS_PREFIX[index].split("/api/")?.[1];
        if (restPart) {
          handleUrl = handleUrl.replace(reg, `/paas/api/${restPart}`);
        }
      });
    }
    req.url = handleUrl;
    next();
  };
};
