module.exports = {
  apps: [
    {
      name: "index",
      script: "./index.js",
      instances: 1,
      exec_mode: "cluster",
      watch: false,
      env: {
        "MYBRICKS_PLATFORM_ADDRESS": ""
      }
    }
  ]
}