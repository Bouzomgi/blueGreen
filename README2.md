# Blue-Green Deployments

An implementation of Blue-Green deployments using Docker, Nginx, Jinja2, and Ansible.

## 🚀 Instructions to Run

To start the application, run:

`docker compose up`

This will spin up the required containers, including a web server based on the Docker image generated from the microServer folder.

Once running, the application is in a stable state. You can interact with the web server by running:

`curl http://localhost/`

## 🔥 General Workflow

- Publish a new image for deployment

- Stand up a green environment by calling via `/deployment/deployGreen`
- Run integration tests against the green environment by hitting the `/test` route
  - If tests pass, switch traffic via `deployment/switchTraffic`
  - If tests fail, destroy the green environment via `/deployment/destroyGreen`

## ⚙️ Detailed Workflow

### ✅ Stand Up Green

To create a green environment for microServer:

1. Modify `/microServer/index.js` (e.g., change the `/` route's response message)

2. Build a new Docker image:

`docker build -t micro-server ./microServer`

1. Stand up the green using step 2's image

`curl http://localhost/deployment/deployGreen`

The green environment will be accessible on the /test route.

`curl http://localhost/test`

This will hit the `/` route on the green environment, where you should see the modified response message.

The blue environment will remain unchanged:

`curl http://localhost/`

You should still see the original response message.

💡 In practice, you can now run integration tests against the green environment via /test to verify the new deployment.

Depending on if you intend to promote green to blue or not, you can proceed with step 2 or 3

### 🔄 2. Switch Traffic

If integration tests pass, you can promote the green environment to blue by invoking:

`curl http://localhost/deployment/switchTraffic`

This will:

- Swap traffic from the blue environment to the green environment
- Promote green to blue
- Destroy the previous blue deployment
- Remove the `/test` route

Now, when you access:

`curl http://localhost/`

You should see the updated response message from the new environment.

### 🗑️ 3. Destroy Green

If the green environment introduces a regression or fails tests, you can remove it by calling:

`curl http://localhost/deployment/destroyGreen`

This will:

- Tear down the green environment
- Remove the /test route
- Keep the current blue environment unaffected

## 🔧 Features

- Custom image tags:
  You can specify a custom tag for the new image during green deployment:
  `curl "http://localhost/deployment/deployGreen?tag={YOUR_TAG}"`
  If no tag is specified, it defaults to latest.

- Authentication (optional):
  You can specify an environment variable AUTH_TOKEN on the deployment server.
  If this is set, any request to the /deployment routes will require a valid Bearer token.

  Without AUTH_TOKEN:
  `curl http://localhost/deployment/deployGreen`

  With AUTH_TOKEN set:
  `curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost/deployment/deployGreen`

## 🛠️ Technologies Used

- Docker: To run isolated environments in containers
- Nginx: To route web traffic between the environments and the deployment server
- Jinja2: To generate dynamic Nginx configuration files from a template
- Ansible: To render the Jinja2 templates to generate new Nginx configs

## 🧹 Cleanup Instructions

To stop and remove all containers, networks, and volumes specified in the docker compose, run:

`docker compose down --volumes --remove-orphans`

Additionally, you may need to manually remove any webserver containers created by invoking `/deployment/deployGreen`.
