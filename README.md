- `docker compose up --build`
- `docker volume create app-nginx-config`
- `docker network create app-network`

Improvements:

- [] add capability to specify the new image-to-deploy's tag, defaulting to latest
- [] add a required security token to access the `/deployment` route
