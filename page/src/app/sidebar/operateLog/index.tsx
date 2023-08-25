import React, {FC, useEffect, useMemo} from 'react';
import { Table } from 'antd';
import moment from 'moment';
import axios from 'axios';

import style from './index.less';

const OperateLog: FC = () => {
  const columns = useMemo(() => {
    return [
      {
        title: '操作端',
        dataIndex: 'type',
        render(_, item) {
          if (item.type === 10) {
            return '平台';
          } else if (item.type === 9) {
            return '应用(' + (item.logContent?.name || item.logContent?.namespace || '-') + ')';
          }

          return '-';
        },
      },
      {
        title: '操作类型',
        dataIndex: 'logContent.action',
        render(_, item) {
          if (item.type === 10) {
            return '更新平台';
          } else if (item.type === 9) {
            return item.logContent?.preVersion ? '更新应用' : '安装新应用';
          }

          return '-';
        },
      },
      {
        title: '更新内容',
        dataIndex: 'logContent.content',
        render(_, item) {
          return item.logContent?.content || '-';
        },
      },
      {
        title: '操作时间',
        dataIndex: 'createTime',
        render(createTime) {
          return createTime ? moment(createTime).format('YYYY-MM-DD HH:mm:ss') : '-';
        },
      },
      {
        title: '操作者',
        dataIndex: 'createName',
        render(createName) {
          return createName || '-';
        },
      },
    ];
  }, []);

  useEffect(() => {
    axios.get('/paas/api/system/operateLog', { params: { pageNum: 1, pageSize: 2 } });
  }, []);
  return (
    <div className={style.operateLogModal}>
      <Table columns={columns} dataSource={[{ type: 9, createTime: Date.now() }]} pagination={false} />
    </div>
  );
};

export default OperateLog;