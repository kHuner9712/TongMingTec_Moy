// =====================================
// MOY Backend PM2 Ecosystem 配置
// 说明：本文件只声明启动文件和 NODE_ENV。
//       数据库密码、JWT_SECRET 等敏感变量须从服务器环境变量或 .env 注入，
//       严禁在此文件中硬编码任何密钥。
//
// 使用方式：
//   pm2 start deploy/pm2/ecosystem.config.cjs
//   pm2 save
// =====================================

module.exports = {
  apps: [
    {
      name: "moy-backend",
      script: "./backend/dist/main.js",
      cwd: "/var/www/moy",

      // 实例数量（生产建议 2，小规模 1）
      instances: 1,
      exec_mode: "fork",

      // 环境变量（仅声明非敏感项）
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
      },

      // 日志路径
      error_file: "/var/www/moy/logs/pm2-backend-error.log",
      out_file: "/var/www/moy/logs/pm2-backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // 进程管理
      max_restarts: 10,
      restart_delay: 5000,     // 5s 后重启
      max_memory_restart: "512M",

      // 监听文件变更自动重载（生产建议关闭）
      watch: false,

      // 退出超时
      kill_timeout: 10000,

      // 启动等待
      wait_ready: true,
      listen_timeout: 15000,
    },
  ],
};
