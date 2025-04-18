#!/bin/bash

# Install sshpass if not already installed
if ! command -v sshpass &> /dev/null; then
    echo "Installing sshpass..."
    sudo apt-get update && sudo apt-get install -y sshpass
fi

# Server details
SERVER="162.33.178.121"
PASSWORD="Helloza@0863932415C"
USER="root"

echo "Deploying to server..."

# SSH into server and execute commands
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $USER@$SERVER << 'EOF'
    cd /root/cdex-coin
    echo "Pulling latest changes..."
    git pull

    echo "Installing dependencies..."
    npm install

    echo "Building project..."
    npm run build

    echo "Starting/Restarting PM2 process..."
    pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js

    echo "Deployment completed successfully!"
EOF
