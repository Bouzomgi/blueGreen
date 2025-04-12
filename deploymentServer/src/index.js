const express = require("express");
const { authenticateToken } = require("./authenticateToken");

const { findCurrentRed, getAlternateEnv } = require("./utils/configParsing");

const {
  createDockerContainer,
  destroyDockerContainer,
  restartNginx,
  doesContainerExist,
} = require("./utils/docker");

const { runAnsiblePlaybook } = require("./utils/ansible");

const app = express();
const PORT = process.env.PORT || 8000;

const nginxBackendFilePath = "/etc/nginx/conf.d/backend.conf";
const imageName = "micro-server";
const networkName = "app-network";

// health check route
app.get("/deployment/health", (req, res) => {
  return res.status(200).send("The deployment server is ok");
});

if (process.env.AUTH_TOKEN != undefined) {
  app.use(authenticateToken);
}

// stand up new test env
app.get("/deployment/deployBlack", async (req, res) => {
  try {
    const tag = req.query.tag || "latest";

    const currentRed = await findCurrentRed(nginxBackendFilePath);
    const currentBlack = getAlternateEnv(currentRed);
    const blackContainerName = `backend-${currentBlack}`;

    const doesBlackExist = await doesContainerExist(blackContainerName);
    if (doesBlackExist) {
      return res
        .status(400)
        .send("Cannot stand up black -- Black is already up");
    }

    await createDockerContainer(
      imageName,
      tag,
      blackContainerName,
      networkName
    );
    await runAnsiblePlaybook(currentRed, true);
    await restartNginx();

    return res.status(200).send("Successfully set up black environment");
  } catch (err) {
    return res
      .status(400)
      .send(`Failed to set up black environment: ${err.message}`);
  }
});

// switch traffic from current env to next and destroy black env
app.get("/deployment/switchTraffic", async (req, res) => {
  try {
    const currentRed = await findCurrentRed(nginxBackendFilePath);
    const currentBlack = getAlternateEnv(currentRed);

    const redContainerName = `backend-${currentRed}`;
    const blackContainerName = `backend-${currentBlack}`;

    const doesBlackExist = await doesContainerExist(blackContainerName);
    if (!doesBlackExist) {
      return res.status(400).send("Cannot switch traffic -- Black is not up");
    }

    await runAnsiblePlaybook(currentBlack, false);
    await restartNginx();
    // red is now the new black
    await destroyDockerContainer(redContainerName);

    return res.status(200).send("Successfully switched traffic");
  } catch (err) {
    return res.status(400).send(`Failed to switch traffic: ${err.message}`);
  }
});

// destroy black env
app.get("/deployment/destroyBlack", async (req, res) => {
  try {
    const currentRed = await findCurrentRed(nginxBackendFilePath);
    const currentBlack = getAlternateEnv(currentRed);
    const blackContainerName = `backend-${currentBlack}`;

    const doesBlackExist = await doesContainerExist(blackContainerName);
    if (!doesBlackExist) {
      return res.status(400).send("Cannot destroy black -- Black is not up");
    }

    await runAnsiblePlaybook(currentRed, false);
    await restartNginx();
    await destroyDockerContainer(blackContainerName);

    return res.status(200).send("Successfully destroyed black");
  } catch (err) {
    return res.status(400).send(`Failed to destroy black: ${err.message}`);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
