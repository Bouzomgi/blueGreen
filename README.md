# Red-Black Deployments

An implementation of Red-Black deployments using Docker, Nginx, Jinja2, and Ansible.

## 🚀 Instructions to Run

To start the application, run `docker compose up`

This will spin up the required containers, including a web server based on the Docker image generated from the microServer folder. This web server is brought up in a container considered the first red environment.

Once running, the application is in a stable state. You can interact with the web server by running `curl http://localhost/`

## 🔁 General Workflow

- Start the application
- Publish a new image for deployment
- Stand up a black environment by calling via `/deployment/deployBlack`
- Run integration tests against the black environment by hitting the `/test` route
  - ✅ If tests pass → switch traffic via `/deployment/switchTraffic`
  - ❌ If tests fail → destroy the black environment via `/deployment/destroyBlack`

## ⚙️ Detailed Workflow

### 🌱 1. Stand Up Black

To create a black environment for microServer once the application is running

1. Modify `/microServer/index.js` (e.g., change the `/` route's response message)

2. Build a new Docker image using `docker build -t micro-server ./microServer`

3. Stand up black using step 2's image via `curl http://localhost/deployment/deployBlack`
   - `deployBlack` automatically bases the black environment based on the latest image of `micro-server`

⚫️ The black environment will be accessible on the `/test` route

- `curl http://localhost/test` will hit the `/` route on the black environment, where you should see the modified response message.

🔴 The red environment will remain unchanged

- `curl http://localhost/`
  should still show the original response message.

💡 In practice, you can now run (not included) integration tests against the black environment via `/test` to verify the new deployment

Depending on if you intend to promote black to red or not, you can proceed to either step 2 or 3

### 🔀 2. Switch Traffic

If integration tests pass, you can promote the black environment to red by invoking

```bash
curl http://localhost/deployment/switchTraffic
```

This will

- Swap traffic from the red environment to the black environment
- Promote black to red
- Destroy the previous red deployment
- Remove the `/test` route

Now, when you access `curl http://localhost/`, you should see the updated response message from the new environment

### 🗑️ 3. Destroy Black

If the black environment introduces a regression, you can remove it by calling

```bash
curl http://localhost/deployment/destroyBlack
```

This will

- Tear down the black environment
- Remove the /test route
- Keep the current red environment unaffected

## 🔧 Features

### 🏷️ Custom image tags

You can specify a custom tag for the new image during black deployment:

```bash
curl "http://localhost/deployment/deployBlack?tag={YOUR_TAG}"
```

- If no tag is specified, it defaults to latest.

### 🔒 Authentication (optional)

You can specify an environment variable `AUTH_TOKEN` on the deployment server.
If this is set, any request to the `/deployment` routes will require a valid Bearer token.

Without `AUTH_TOKEN`:

```bash
curl http://localhost/deployment/deployBlack
```

With `AUTH_TOKEN` set:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost/deployment/deployBlack
```

## 🛠️ Technologies Used

- Docker: To run isolated environments in containers
- Nginx: To route web traffic between the environments and the deployment server
- Jinja2: To generate dynamic Nginx configuration files from a template
- Ansible: To render the Jinja2 templates to generate new Nginx configs

## 🧹 Cleanup Instructions

To stop and remove all containers, networks, and volumes specified in the docker compose, run
`docker compose down --volumes --remove-orphans`

Additionally, you may need to manually remove any webserver containers created by invoking `/deployment/deployBlack`
