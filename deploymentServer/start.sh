#!/bin/bash

echo "Running Ansible playbook to render NGINX config..."
ansible-playbook /app/server/render_nginx_template.yaml -e "blue_env=alpha enable_test_route=false"

echo "Starting Node.js server..."
npm start