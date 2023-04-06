module.exports = {
  apps: [
    {
      name: "index_flow",
      script: "./index_flow.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
      }
    }
  ]
}