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

export const proxyMiddleWare = (query: { namespaceMap: any }) => {
  const appRegs = [];
  const paasRegs = [];
  const prefixList = Object.keys(query?.namespaceMap)
  // console.log('@@@@@@', query.namespaceMap)
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
    appRegs.forEach(({reg, namespace}) => {
      if (reg.test(handleUrl)) {
        jumpPaas = true;
        // if(query?.namespaceMap?.[namespace]?.hasService) {
        //   handleUrl = handleUrl.replace(reg, "/");
        // } else {
        //   handleUrl = handleUrl.replace(reg, "/paas/");
        // }
        if(handleUrl.indexOf('api/domain') !== -1) {
          handleUrl = handleUrl.replace(reg, "/");
        } else {
          handleUrl = handleUrl.replace(reg, "/paas/");
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
