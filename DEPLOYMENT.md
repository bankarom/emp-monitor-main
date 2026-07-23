# EmpMonitor Deployment Guide

This guide outlines the steps required to deploy the EmpMonitor system on a production server. The architecture consists of multiple Node.js backend services, a React frontend, and a desktop agent.

## Server Prerequisites

- **OS:** Ubuntu 22.04 LTS (Recommended)
- **Memory:** Minimum 4GB RAM
- **Storage:** 50GB+ (SSD recommended for MongoDB/MySQL)

### Required Software
1. **Node.js** (v18.x or v20.x)
2. **MongoDB** (v6.0+)
3. **MySQL** (v8.0+)
4. **Redis** (v7.0+)
5. **Nginx** (Reverse Proxy)
6. **PM2** (Process Manager for Node.js)

---

## 1. System Setup & Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
```

## 2. Database Installation

### Install MongoDB
Follow the official MongoDB documentation to install MongoDB Community Edition for Ubuntu. Ensure it is running and accessible on port `27017`.

### Install MySQL
```bash
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation
```
Create the database and user:
```sql
CREATE DATABASE empmonitor;
CREATE USER 'emp_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON empmonitor.* TO 'emp_user'@'localhost';
FLUSH PRIVILEGES;
```
Import any existing SQL schema into the `empmonitor` database if required.

## 3. Clone Repository & Setup Environment

```bash
git clone <repository_url> emp-monitor
cd emp-monitor
```

### Configure `.env` Files
You must create and configure `.env` files for each service. Reference the existing `.env.example` files in the repository. Ensure database credentials match what you created in step 2.

- `Backend/admin/.env`
- `Backend/desktop/.env`
- `Backend/store-logs-api/.env`
- `Backend/productivity_report/.env`
- `Backend/cronjobs/.env`

## 4. Install Dependencies & Build Frontend

```bash
# Install backend dependencies
cd Backend/admin && npm install
cd ../desktop && npm install
cd ../store-logs-api && npm install
cd ../productivity_report && npm install
cd ../cronjobs && npm install

# Build frontend
cd ../../Frontend
npm install
npm run build
```

## 5. Start Backend Services with PM2

Start each backend service using PM2 from the project root:

```bash
# Admin API (Port 8000)
pm2 start npm --name "emp-admin" -- run start:prod --prefix Backend/admin

# Desktop API (Port 8001)
pm2 start npm --name "emp-desktop" -- run start:prod --prefix Backend/desktop

# Store Logs API (Port 8002)
pm2 start npm --name "emp-logs" -- run start:prod --prefix Backend/store-logs-api

# Productivity Report (Port 8003)
pm2 start npm --name "emp-productivity" -- run start:prod --prefix Backend/productivity_report

# Cronjobs (Port 8004)
pm2 start npm --name "emp-cron" -- run start:prod --prefix Backend/cronjobs

# Save PM2 configuration to start on boot
pm2 save
pm2 startup
```

## 6. Nginx Configuration

Install Nginx and configure it to serve the frontend and route API requests.

```bash
sudo apt install -y nginx
```

Create a new Nginx configuration file: `/etc/nginx/sites-available/empmonitor`

```nginx
server {
    listen 80;
    server_name yourdomain.com; # Replace with your domain

    # Frontend (React build)
    location / {
        root /path/to/emp-monitor/Frontend/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Admin API
    location /api/admin/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Desktop API
    location /api/desktop/ {
        proxy_pass http://localhost:8001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Store Logs API
    location /api/logs/ {
        proxy_pass http://localhost:8002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/empmonitor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. Desktop Agent Distributable (.exe)

To build the executable for the Desktop Agent, you need to run `electron-builder` on a Windows machine.

1. Navigate to the `ElectronAgent` folder.
2. Ensure you have installed the dependencies: `npm install`
3. Run the build script: `npm run build`
4. The distributable `.exe` file will be generated in the `ElectronAgent/dist` folder. You can distribute this file to employees.
