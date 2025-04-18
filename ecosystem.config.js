module.exports = {
  apps: [
    {
      name: 'cdex-coin',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      env: {
        PORT: 3100,
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
