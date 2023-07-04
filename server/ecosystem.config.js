module.exports = {
  apps: [
    {
      name: "index",
      script: "./index.js",
      instances: 1,
      exec_mode: "cluster",
      watch: false,
      exp_backoff_restart_delay: 100,
      
      wait_ready: true,
      listen_timeout: 30 * 1000,
      env: {
        // "MYBRICKS_PLATFORM_ADDRESS": "http://block.yunzhiyuan100.com/"
      }
    }
  ]
}