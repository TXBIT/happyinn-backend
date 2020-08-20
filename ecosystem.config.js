module.exports = {
  apps : [{
    name: 'API',
    script: 'index.js',
    instances: 'max',
    "exec_mode" : "cluster",
    max_memory_restart: '1G',
    max_restarts: 10,
    autorestart: false, // to make eb know application false
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }],
};
