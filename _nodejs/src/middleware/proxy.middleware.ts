import { NextFunction, Request, Response } from "express";

export const proxyMiddleWare = (query: { prefixList: string[] }) => {
  console.log('进来了')
  const regs = [];
  query?.prefixList?.forEach((prefix) => {
    regs.push(new RegExp(`^/${prefix}/`));
  });
  return (req: Request, res: Response, next: NextFunction) => {
    let handleUrl = req.url;
    regs.forEach((reg) => {
      handleUrl = handleUrl.replace(reg, "/");
    });
    req.url = handleUrl;
    next();
  };
};
