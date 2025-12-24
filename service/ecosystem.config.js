/**
 * PM2 Ecosystem Configuration
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 restart guess-cspro-service
 *   pm2 logs guess-cspro-service
 *   pm2 stop guess-cspro-service
 *   pm2 delete guess-cspro-service
 */
module.exports = {
  apps: [
    {
      name: "guess-cspro-service",
      script: "./dist/index.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
