# hooker

A simple webhook server for executing shell scripts.

### How to run the application locally

For local development, you can use Docker, so you don't need to install dependencies locally. However, you must run the application on a host in production since service will execute commands on the host.

Commands for local development:
1. Run `docker-compose build` to build an image
2. Run `docker-compose up -d hooker` to run service

The application should be available at `localhost:46657`.

To see application logs, run `docker-compose logs -f hooker`.

If you change the dependencies of application, run `docker-compose build` again.

If you changed code, run `docker-compose restart hooker` to rerun application with a new code.

To stop all services, run `docker-compose stop`, to stop all running containers or `docker-compose down` to stop and remove all containers.

### Supported services:
- Gitea 1.1.2+
- GitLab 7.5+
