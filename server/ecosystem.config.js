module.exports = {
  apps: [
    {
      name: "index",
      script: "./index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        // "MYBRICKS_PLATFORM_ADDRESS": "http://block.yunzhiyuan100.com/"
      }
    }
  ]
}