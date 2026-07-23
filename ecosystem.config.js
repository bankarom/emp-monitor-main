module.exports = {
  apps: [
    {
      name: "admin-api",
      script: "npm",
      args: "run start:dev",
      cwd: "./Backend/admin",
      watch: false,
    },
    {
      name: "store-logs-api",
      script: "npm",
      args: "run start:dev",
      cwd: "./Backend/store-logs-api",
      watch: false,
    },
    {
      name: "desktop-api",
      script: "npm",
      args: "run start:dev",
      cwd: "./Backend/desktop",
      watch: false,
    },
    {
      name: "cronjobs",
      script: "npm",
      args: "run start:dev",
      cwd: "./Backend/cronjobs",
      watch: false,
    },
    {
      name: "productivity-report",
      script: "npm",
      args: "run start:dev",
      cwd: "./Backend/productivity_report",
      watch: false,
    },
    {
      name: "frontend",
      script: "npm",
      args: "run dev",
      cwd: "./Frontend",
      watch: false,
    }
  ]
};
