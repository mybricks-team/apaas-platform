import servicePlugin, { call as callConnectorHttp } from "@mybricks/plugin-connector-http";

export default function (ctx) {
  return {
    plugins: [servicePlugin()],
    comLibLoader(desc) {
      //加载组件库
      return new Promise((resolve, reject) => {
        resolve([
          `https://ali-ec.static.yximgs.com/udata/pkg/eshop/fangzhou/temp/editor.38d6d806c86dc72c.js`
          // `https://172.26.208.199:9001/editor.js`
        ]);
      });
    },
    pageContentLoader() {
      //加载页面内容
      return new Promise((resolve, reject) => {
        const content = ctx.fileItem.content;
        resolve(content ? JSON.parse(content) : null);
      });
    },
    toplView: {
      title: "交互",
      useStrict: true, //default is true
      cards: {
        // adder: {
        //   startWith: [
        //     {
        //       namespace: 'test.index0',
        //       outputId: 'amount'
        //     }
        //   ]
        // },
        main: {
          title: "任务",
          inputs: [
            {
              id: "onError",
              title: "当发生错误",
              schema: { type: "string" },
              connect(fn) {
                fn(1);
              },
            },
            {
              id: "start",
              title: "开始",
              schema: { type: "any" },
              connect(fn) {
                fn(1);
              },
            },
          ],
          // outputs: [
          //   {
          //     id: 'test',
          //     title: 'delIt',
          //     schema: {type: 'string'},
          //     connect(fn) {
          //       fn(1)
          //     }
          //   }
          // ],
        },
      },
      //vars: {},
      //fx: {}
    },
    editView: {
      items({ }, cate0, cate1, cate2) {
        cate0.title = `实例项目`;
        cate0.items = [
          {
            title: "名称",
            type: "Text",
            //options: {readOnly: true},
            value: {
              get: (context) => {
                return ctx.fileItem.name;
              },
              set: (context, v: any) => {
                ctx.setName(v);
              },
            },
          },
          // {
          //   title: '执行间隔',
          //   type: 'Text',
          //   //options: {readOnly: true},
          //   value: {
          //     get: (context) => {
          //       return ctx.fileItem.name
          //     },
          //     set: (context, v: any) => {
          //       ctx.setName(v)
          //     }
          //   }
          // },
          {
            title: "定时任务类型",
            type: "select",
            options: [
              {
                label: "每10秒执行",
                value: "*/10 * * * * *",
              },
              {
                label: "每20秒执行",
                value: "*/20 * * * * *",
              },
              {
                label: "每30秒执行",
                value: "*/30 * * * * *",
              },
              {
                label: "每1分钟执行",
                value: "0 0/1 * * * *",
              },
              {
                label: "每30分钟执行",
                value: "0 0/30 * * * *",
              },
              {
                label: "每天0点执行一次",
                value: "0 0 23 * * *",
              },
              {
                label: "每天0点、12点执行一次",
                value: "0 0 0,12 * * *",
              },
              {
                label: "每天8点、16点、0点执行一次",
                value: "0 0 0,8,16 * * *",
              },
              {
                label: "每天0点、6点、12点、18点执行一次",
                value: "0 0 0,6,12,18 * * *",
              },
              {
                label: "周一至周五的上午09:00触发",
                value: "0 0 9 * * MON-FRI",
              },
              {
                label: "周一至周五的下午17:00触发",
                value: "0 0 17 * * MON-FRI",
              },
              {
                label: "每月1号凌晨12点执行一次",
                value: "0 0 0 1 * *",
              },
            ],
            value: {
              get({ data }) {
                let val = ctx.expStr;
                if (!val) {
                  let content = ctx?.fileItem?.content || '{}'
                  const oldVal = JSON.parse(content)
                  val = oldVal?.cronConfig?.expStr || ''
                }
                return val;
              },
              set({ data, output }, value) {
                ctx.expStr = value;
              },
            },
          },
          {
            title: "分享到案例库",
            type: "switch",
            //options: {readOnly: true},
            value: {
              get: (context) => {
                return ctx.fileItem.shareType;
              },
              set: (context, v: any) => {
                ctx.share(v);
              },
            },
          },
        ];
      },
    },
    com: {
      env: {
        i18n(title) {
          //多语言
          return title;
        },
        callConnector(connector, params) {
          //调用连接器
          if (connector.type === "http") {
            //服务接口类型
            return callConnectorHttp({ script: connector.script, params });
          } else {
            return Promise.reject("错误的连接器类型.");
          }
        },
      },
      events: [
        //配置事件
        {
          type: "jump",
          title: "跳转到",
          exe({ options }) {
            const page = options.page;
            if (page) {
              window.location.href = page;
            }
          },
          options: [
            {
              id: "page",
              title: "页面",
              editor: "textarea",
            },
          ],
        },
      ],
    },
  };
}
