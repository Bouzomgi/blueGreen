#!/bin/bash

echo "Copying over base NGINX config..."
cp ./nginx/nginx.conf /etc/nginx/nginx.conf

echo "Running Ansible playbook to render NGINX config..."
ansible-playbook /app/server/render_nginx_template.yaml -e "red_env=alpha enable_test_route=false"

echo "Starting Node.js server..."
npm start