# Docker Deployment Guide

This guide will help you containerize and deploy the **ClickClack** application using Docker.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running on your machine.
- A terminal (Command Prompt, PowerShell, or Terminal).
- A GitHub account for automated builds (optional but recommended).

## 1. Building the Docker Image Locally

The "image" is the blueprint for your application. It contains all the code, dependencies, and instructions needed to run.

Run the following command in the root directory of your project (where the `Dockerfile` is located):

```bash
docker build -t clickclack-app .
```

- `-t clickclack-app`: Tags (names) the image "clickclack-app".
- `.`: Tells Docker to look for the `Dockerfile` in the current directory.

*Note: This process might take a few minutes the first time as it downloads the Node.js environment and installs dependencies.*

## 2. Running the Container

Once the image is built, you can "spin up" a container instance of that image.

```bash
docker run -p 3000:3000 clickclack-app
```

- `-p 3000:3000`: Maps port 3000 on your computer (localhost) to port 3000 inside the container.
- `clickclack-app`: The name of the image we just built.

You should see output indicating the server is ready:
```
> Ready on http://localhost:3000
```

## 3. Accessing the Application

Open your web browser and visit:
[http://localhost:3000](http://localhost:3000)

## 4. Automated Builds with GitHub Actions (CI/CD)

We have configured a workflow to automatically build and publish your Docker image to the **GitHub Container Registry (GHCR)**.

### How it works
1.  **Push to Main**: When you push code to the `main` branch, GitHub will build a new image and tag it as `main`.
2.  **Create a Release**: When you create a release in GitHub (e.g., `v1.0.0`), GitHub will build and tag the image with that version number AND tag it as `latest`.

### Setup
The configuration file lives at `.github/workflows/docker-publish.yml`. No extra setup is required; it uses your existing GitHub credentials automatically.

### Where to find your image
After a successful build, your image will be available at:
`ghcr.io/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME:TAG`

For example: `ghcr.io/dimitri/clickclack:main`

## 5. Pulling and Running on Another Machine

To run your application on a server or a friend's computer, you don't need the source code—you just need Docker.

1.  **Log in to the registry** (only needed for private packages):
    ```bash
    echo $CR_PAT | docker login ghcr.io -u USERNAME --password-stdin
    ```
    *(Note: For public repositories, you can skip the login step.)*

2.  **Pull the image**:
    ```bash
    docker pull ghcr.io/YOUR_USERNAME/clickclack:main
    ```

3.  **Run it**:
    ```bash
    docker run -d -p 3000:3000 --name clickclack ghcr.io/YOUR_USERNAME/clickclack:main
    ```

## 6. Background Mode (Production Style)

To run the container in the background (so it doesn't occupy your terminal window):

```bash
docker run -d -p 3000:3000 --name clickclack-container clickclack-app
```

### Managing the Background Container

- **See running containers:** `docker ps`
- **Stop the container:** `docker stop clickclack-container`
- **Remove the container:** `docker rm clickclack-container`
- **View logs:** `docker logs clickclack-container`

## Troubleshooting

### "Port already in use"
If you see an error saying port 3000 is already allocated, make sure you aren't running `npm run dev` or another Docker container on that port.

```bash
# Maps localhost:4000 -> container:3000
docker run -p 4000:3000 clickclack-app
```
Then access at http://localhost:4000.
