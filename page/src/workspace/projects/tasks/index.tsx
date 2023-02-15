import css from './index.less'
import React, { useCallback, useMemo, useState } from "react";
import axios from "axios";
import { getApiUrl, eventOperation } from "../../../utils";
import { message, Popover, List } from "antd";
import { APPS, TaskTypeMap } from "../../constants";
import * as IconNormal from "../../../IconNormal";
// import { evt, useObservable } from "@mybricks/rxui";
import * as IconMy from "./icons-running.tsx";
import cx from "classnames";

// class Ctx {
//   user: { email }

//   taskAry
// }

// let ctx: Ctx

const RunningStatusMap = {
  RUNNING: 1,
  RUNNING_WITH_ERROR: 11,
  STOPPED: -1
}

// export default function Running({ user }) {
//   ctx = useObservable(Ctx, next => {
//     next({
//       user
//     })
//   })

//   return (
//     <div className={`${css.segment} ${css.running}`}>
//       <div className={css.title}>运行中的项目</div>
//       <Tasks />
//     </div>
//   )
// }

export default function Tasks({user}) {
  const [taskAry, setTaskAry] = useState<any[]>([]);
  const handleData = useCallback((list) => {
    let result = {}
    list.forEach(item => {
      const oldItem = result[item.fileId]
      if (!oldItem) {
        result[item.fileId] = item
      } else {
        let notTest;
        let notLatest = oldItem?._createTime < item._createTime;
        try {
          notTest = JSON.parse(item.metaInfo)?.cronConfig?.type !== TaskTypeMap.IMMEDIATE
        } catch (e) {
        }
        if (notTest && notLatest) {
          result[item.fileId] = item
        }
      }
    });
    console.log(result)
    return Object.values(result)
  }, [])

  useMemo(() => {
    axios({
      method: "post",
      url: getApiUrl('/api/task/getAllJobs'),
      data: { userId: user.email }
    }).then(({ data }) => {
      if (data.code === 1) {
        setTaskAry(handleData(data.data));
      } else {
        message.error(`获取数据发生错误：${data.message}`)
      }
    })
  }, [])

  return (
    <div className={css.files}>
      {
        taskAry ? taskAry.map((item, index) => {
          return (
            <TaskItem key={index} item={item} user={user}/>
          )
        }) : null
      }
    </div>
  )
}

function TaskItem({ item, user }) {
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [jobLogList, setJobLogList] = useState([]);
  const [runningStatus, setRunningStatus] = useState(item.runningStatus);
  const [status, setStatus] = useState(item.status)

  const openFile = useCallback(() => {
    window.location.href = `/app-${item.type}.html?fileId=${item.id}`
  }, []);

  const delFile = useCallback(() => {
    if (confirm('您确定要删除该项目吗?')) {
      axios({
        method: "post",
        url: getApiUrl('/api/task/deleteTask'),
        data: { id: item.id, userId: user.email }
      }).then(({ data }) => {
        if (data.code === 1) {
          setStatus(-1);
        } else {
          message.error(`删除项目错误：${data.message}`)
        }
      })
    }
  }, [])

  const run = useCallback((e) => {
    e.stopPropagation()
    axios({
      method: "post",
      url: getApiUrl('/api/task/run'),
      data: { id: item.id, userId: user.email }
    }).then(({ data }) => {
      if (data.code !== 1) {
        message.error(`启动任务失败：${data.message}`)
      } else {
        // item.runningStatus = 1
        setRunningStatus(1);
        message.info(`任务启动成功`)
      }
    })
  }, [])

  const stop = useCallback((e) => {
    e.stopPropagation()
    axios({
      method: "post",
      url: getApiUrl('/api/task/stop'),
      data: { id: item.id, userId: user.email }
    }).then(({ data }) => {
      if (data.code !== 1) {
        message.error(`启动任务失败：${data.message}`)
      } else {
        // item.runningStatus = RunningStatusMap.STOPPED
        setRunningStatus(RunningStatusMap.STOPPED);
        message.info(`任务停止成功`)
      }
    })
  }, [])


  const handleHoverChange = (open: boolean) => {
    setHovered(open);
    setClicked(false);
  };

  const handleClickChange = (open: boolean) => {
    setHovered(false);
    setClicked(open);
  };

  const appReg = APPS.find(app => app.type === item.type)

  // if (status === -1) {
  //   return <></>
  // }

  const renderIconArea = (item) => {
    if (runningStatus === RunningStatusMap.RUNNING) {
      return (
        <span className={css.run} onClick={stop}>
          {IconMy.Stop}
          {/* <span className={css.spinning}>
            {IconMy.Loading}
          </span> */}
        </span>
      )
    } else if (runningStatus === RunningStatusMap.RUNNING_WITH_ERROR) {
      return (
        <span className={css.run_error} onClick={stop}>
          {IconMy.Stop}
          {/* <span className={css.spinning}>
            {IconMy.Loading}
          </span> */}
        </span>
      )
    } else if (runningStatus === RunningStatusMap.STOPPED) {
      return (
        <span onClick={run}>
          {IconMy.Run}
        </span>
      )
    }
  }

  const logs = useMemo(() => {
    return jobLogList.map(raw => {
      let newContent = JSON.parse(raw.content)[0];
      return {
        ...raw,
        content: newContent,
        type: newContent.indexOf("异常") === -1 ? "success" : "error"
      }
    }).filter(raw => {
      return raw.content.indexOf('执行节点') === -1;
    });
  }, [jobLogList]);

  const onMore = useCallback((e, item) => {
    e.stopPropagation();
    setClicked(true);

    axios({
      method: "post",
      url: getApiUrl('/api/task/getLogsByFileId'),
      data: {
        fileId: item.fileId,
        userId: user.email,
        offset: 0,
        limit: 100,
      }
    }).then(({ data }) => {
      console.log(data)
      if (data.code === 1) {
        setJobLogList(data.data.logs)
      }
    });

  }, []);

  const onClose = useCallback((e, item) => {
    e.stopPropagation();
    setClicked(false);
  }, []);

  let fileCx = cx({
    [css.file]: true,
    [css.statusPendding]: runningStatus === RunningStatusMap.STOPPED,
    [css.statusOk]: runningStatus === RunningStatusMap.RUNNING,
    [css.statusError]: runningStatus === RunningStatusMap.RUNNING_WITH_ERROR,
    [css.clicked]: clicked
  });

  return (
    <div className={fileCx} onClick={openFile} style={{display: status === -1 ? 'none' : 'inline-flex'}}>

      <div className={css.snap}>
        {renderIconArea(item)}
        <span onClick={eventOperation(delFile).stop}>
          {IconNormal.Delete}
        </span>
      </div>

      <div className={css.body}>

        <div className={css.content}>
          <div className={css.typeIcon}>
            {appReg?.icon}
          </div>
          <div className={css.detail}>
            <div className={css.name}>
              {item.name}
            </div>
            <div className={css.path} data-content-start={item.path}>
              {item.createTime}
            </div>
          </div>
        </div>

        <div className={css.more} title="点击展开日志" onClick={(e) => { onMore(e, item); }}>{IconMy.More}</div>

      </div>

      <div className={css.foot} onClick={(e) => { e.stopPropagation(); }}>
        {logs.length ? logs.map((raw, index) => {
          let textCx = cx({
            [css.text]: true,
            [css.success]: raw.type === "success",
            [css.error]: raw.type === "error",
          });
          return (<div className={css.logItem} key={index}>
            <div className={textCx}>{raw.content}</div>
            <div className={css.timestamp}>{raw.createTime}</div>
          </div>)
        }) : "暂无日志"}
      </div>

      <div className={css.close} title="点击收起日志" onClick={(e) => { onClose(e, item); }}>{IconMy.More}</div>

    </div>
  )
}



// <Popover
//             className={css.popOverContent}
//             content={<div>单击展开所有日志</div>}
//             title="日志"
//             trigger="hover"
//             open={hovered}
//             onOpenChange={handleHoverChange}
//           >
//              <Popover
//               content={
//                 <List
//                   className={css.popOverContent}
//                   header={null}
//                   footer={null}
//                   bordered
//                   dataSource={jobLogList}
//                   renderItem={item => {
//                     if (item?.content.indexOf("执行节点结果") !== -1) {
//                       return null
//                     }


//                     let description = null;

//                     if (item?.content.indexOf("异常") !== -1) {
//                       description = <span style={{color: "red"}}>{item?.content}</span>
//                     } else {
//                       description = <span>{item?.content}</span>
//                     }

//                     return (
//                       <List.Item>
//                         <List.Item.Meta
//                           avatar={null}
//                           title={item?.createTime}
//                           description={description}
//                         />
//                       </List.Item>
//                     )
//                   }
//                   }
//                 />
//               }
//               title={`日志：${item.name}`}
//               trigger="click"
//               open={clicked}
//               onOpenChange={handleClickChange}
//             >
//               <div className={css.logIcon} onClick={showLog}>
//                 {IconMy.Logs}
//               </div>
//             </Popover> 
//           </Popover>