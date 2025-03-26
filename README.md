# Blue Green Deployments

An implementation of blue green deployments using Docker, Nginx, Jinja2, and Ansible.

## Instructions to Run

To stand up the application, run

`docker compose up`

This will stand up a webserver container from a docker image generated from the `microServer` folder.

The application is now in a stable state -- interact with the webserver using `curl http://localhost/`.

### General Workflow

- Publish new image for deployment
- Stand up new green using `/deployment/deployGreen`
- Run integration tests against green through the `/test` route
  - If integration tests pass, call `/deployment/switchTraffic` to swap blue and green
  - If integration tests fail, call `/deployment/destroyGreen` to tear down the current green

### Stand Up Green

To create a new green environment of `microServer`, first modify `/microServer/index.js` (perhaps most simply by tweaking the `/` routes' response message) and create a new image using `docker build -t micro-server ./microServer`. Now stand up the environment by hitting `curl http://localhost/deployment/deployGreen`. This will create a container from the latest version of micro-server.

Access this green environment on the `/test` route. For example, `curl http://localhost/test/` will hit the `/` route on the green environment. You should see your altered response message here.

The blue environment should be unchanged. The response from `curl http://localhost/` should stay the same as the call from before.

In practice, the user can now run integration tests against the `/test` route to ensure no regression has occurred.

### Switch Traffic

If integration tests have passed, we are comfortable to replace the current blue environment with green, and designate the green environment as the new blue.

To flip traffic from the blue environment to the green, invoke `curl http://localhost/deployment/switchTraffic`. This effectively turns the green environment to blue. It automatically destroys the previous blue deployment and eliminates the `/test` route.

Now, invoking `curl http://localhost/` should show the altered response message.

### Destroy Green

If integration tests have failed, we know a regression has been introduced and our green environment is not ready to be promoted to blue. The green environment should then be decommissioned.

To delete the green environment, invoke `curl http://localhost/deployment/destroyGreen`. This will destroy the green container and eliminate the `/test` route.

## Features

- can specify the new image-to-deploy's tag (defaulting to `latest`) using the url argument `/deployGreen?tag={YOUR_TAG_VALUE}`
- can specify an optional environment variable `AUTH_TOKEN` on the deployment server, which will require any requests on the route `/deployment` to include a matching Bearer token. If this environment variable is not set, no authorization token will be necessary to access the `/deployment` routes

## Technologies

This implementation uses

- Docker to run each environment
- Nginx to route web traffic between the environments and the deployment server
- Jinja2 to generate new Nginx configuration files via a template
- Ansible to trigger the Jinja2 nginx config generation
