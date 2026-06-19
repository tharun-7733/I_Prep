#!/bin/bash
# ==============================================================================
# FLAN-T5 Microservice Deployment Script (Amazon Linux 2023)
# Run this script using: sudo bash deploy_flan.sh
# ==============================================================================

set -e

echo "🚀 Starting FLAN-T5 Microservice deployment..."

echo "📦 Updating system packages..."
yum update -y
yum install -y python3 git

echo "🐍 Setting up Python virtual environment..."
cd /home/ec2-user/I_Prep/backend

if [ ! -d "venv_flan" ]; then
    python3 -m venv venv_flan
fi

source venv_flan/bin/activate
pip install -r requirements_flan.txt

echo "⚙️ Configuring systemd service to run FLAN-T5..."
cat <<EOF > /etc/systemd/system/flant5.service
[Unit]
Description=Gunicorn instance to serve FLAN-T5 Microservice
After=network.target

[Service]
User=ec2-user
Group=ec2-user
WorkingDirectory=/home/ec2-user/I_Prep/backend
Environment="PATH=/home/ec2-user/I_Prep/backend/venv_flan/bin"
# Timeout increased to 120s for model inference, preload models across workers
ExecStart=/home/ec2-user/I_Prep/backend/venv_flan/bin/gunicorn --workers 2 --timeout 120 --preload --bind 0.0.0.0:8001 flan_service:app

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl stop flant5 || true
systemctl start flant5
systemctl enable flant5

echo "✅ FLAN-T5 Deployment successful!"
echo "Make sure to open port 8001 in your EC2 Security Group so the main API can reach it."
