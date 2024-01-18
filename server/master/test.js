const pm2 = require('pm2');
const neighborIds = [];

pm2.connect(function () {
    // 列出正在运行的进程并获取它们的名称/ID
    pm2.list(function (err, processes) {
        for (const i in processes) {
            console.log('Id:', processes[i].pm_id, 'Name:', processes[i].name);

            if (processes[i].name === 'pm2-slave') {
                neighborIds.push(processes[i].pm_id);
            }
        }

        console.log('neighborIds: ', neighborIds);

        // 将信息发送到指定进程
        pm2.sendDataToProcessId(
            neighborIds[0],
            {
                type: 'process:msg',
                data: {
                    some: 'data',
                },
                topic: true,
            },
            function (err, res) {
                console.log('callback', err, res);
            }
        );
    });
});

// 接收信息
pm2.launchBus(function (err, pm2_bus) {
    pm2_bus.on('process:msg', function (packet) {
        console.log('pm2-master launchBus', packet);
    });
});