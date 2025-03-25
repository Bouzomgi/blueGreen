const Docker = require("dockerode");
const docker = new Docker();

const runDockerContainer = (imageName, containerName, networkName) => {
  return new Promise((resolve, reject) => {
    docker
      .createContainer({
        Image: `${imageName}:latest`,
        name: containerName,
        Tty: true,
        AttachStdin: false,
        AttachStdout: true,
        AttachStderr: true,
        NetworkingConfig: {
          EndpointsConfig: {
            [networkName]: {},
          },
        },
      })
      .then((container) => {
        console.log(`Created container with name ${containerName}`);
        return container.start().then(() => resolve(container));
      })
      .catch((error) => {
        reject(
          new Error(
            `Could not start container ${containerName}: ${error.message}`
          )
        );
      });
  });
};

const destroyDockerContainer = async (containerName) => {
  try {
    const container = docker.getContainer(containerName);

    // Check if the container exists
    await container.inspect().catch(() => {
      throw new Error(`Container ${containerName} does not exist.`);
    });

    await container.stop().catch(() => {}); // Ignore error if already stopped
    await container.remove();

    console.log(`Destroyed container with name ${containerName}`);
    return;
  } catch (error) {
    throw new Error(
      `Failed to destroy container ${containerName}: ${error.message}`
    );
  }
};

function restartNginx() {
  return new Promise(async (resolve, reject) => {
    const nginxContainerName = "traffic-controller";

    try {
      // Get the NGINX container by name
      const container = await docker.getContainer(nginxContainerName);

      // Execute the reload command inside the container
      const exec = await container.exec({
        Cmd: ["nginx", "-s", "reload"],
        AttachStdout: true,
        AttachStderr: true,
      });

      // Start the exec process and stream the output
      exec.start((err, stream) => {
        if (err) {
          return reject(`Failed to execute command: ${err.message}`);
        }

        let output = "";
        stream.on("data", (chunk) => {
          output += chunk.toString();
        });

        stream.on("end", () => {
          console.log("Nginx was reloaded");
          resolve(`NGINX reloaded successfully: ${output.trim()}`);
        });

        stream.on("error", (error) => {
          reject(`Stream error: ${error.message}`);
        });
      });
    } catch (error) {
      reject(`Failed to restart NGINX: ${error.message}`);
    }
  });
}

module.exports = {
  runDockerContainer,
  destroyDockerContainer,
  restartNginx,
};
