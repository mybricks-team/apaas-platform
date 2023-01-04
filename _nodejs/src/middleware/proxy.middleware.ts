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

export const proxyMiddleWare = (query: { prefixList: string[] }) => {
  const appRegs = [];
  const paasRegs = [];
  query?.prefixList?.forEach((prefix) => {
    appRegs.push(new RegExp(`^/${prefix}/`));
  });
  PAAS_PREFIX?.forEach((prefix) => {
    paasRegs.push(new RegExp(`^${prefix}`));
  });
  return (req: Request, res: Response, next: NextFunction) => {
    let handleUrl = req.url;
    let jumpPaas = false;
    appRegs.forEach((reg) => {
      if (reg.test(handleUrl)) {
        jumpPaas = true;
        handleUrl = handleUrl.replace(reg, "/");
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
