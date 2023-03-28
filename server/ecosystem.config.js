module.exports = {
  apps: [
    {
      name: "index",
      script: "./index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      wait_ready: true,
      listen_timeout: 5000,
      kill_timeout: 3000,
      env: {
        // "MYBRICKS_PLATFORM_ADDRESS": "http://block.yunzhiyuan100.com/"
      }
    }
  ]
}