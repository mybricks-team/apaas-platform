module.exports = {
  apps: [
    {
      name: "index",
      script: "./index.js",
      instances: 1,
      exec_mode: "cluster",
      watch: true,
      env: {
        "MYBRICKS_PLATFORM_ADDRESS": "http://block.yunzhiyuan100.com/"
      }
    }
  ]
}