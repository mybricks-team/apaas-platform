module.exports = {
  apps: [
    {
      name: "index_master",
      script: "./index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        "MYBRICKS_PLATFORM_ADDRESS": "",
        "MYBRICKS_PRIVATE_APP_STORE": true,
        "MYBRICKS_NODE_MODE": "master",
        "MYBRICKS_RUN_MODE": "ecs",
        "TZ": "Asia/Shanghai"
      }
    }
  ]
}