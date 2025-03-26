const express = require("express");
const { authenticateToken } = require("./authenticateToken");

const { findCurrentBlue, getAlternateEnv } = require("./utils/configParsing");

const {
  createDockerContainer,
  destroyDockerContainer,
  restartNginx,
  doesContainerExist,
} = require("./utils/docker");

const { runAnsiblePlaybook } = require("./utils/ansible");

const app = express();
const PORT = process.env.PORT || 8000;

const nginxRoute = "/etc/nginx/nginx.conf";
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
app.get("/deployment/deployGreen", async (req, res) => {
  try {
    const tag = req.query.tag || "latest";

    const currentBlue = await findCurrentBlue(nginxRoute);
    const currentGreen = getAlternateEnv(currentBlue);
    const greenContainerName = `backend-${currentGreen}`;

    const doesGreenExist = await doesContainerExist(greenContainerName);
    if (doesGreenExist) {
      return res
        .status(400)
        .send("Cannot stand up green -- Green is already up");
    }

    await createDockerContainer(
      imageName,
      tag,
      greenContainerName,
      networkName
    );
    await runAnsiblePlaybook(currentBlue, true);
    await restartNginx();

    return res.status(200).send("Successfully set up green environment");
  } catch (err) {
    return res
      .status(400)
      .send(`Failed to set up green environment: ${err.message}`);
  }
});

// switch traffic from current env to next and destroy green env
app.get("/deployment/switchTraffic", async (req, res) => {
  try {
    const currentBlue = await findCurrentBlue(nginxRoute);
    const currentGreen = getAlternateEnv(currentBlue);

    const blueContainerName = `backend-${currentBlue}`;
    const greenContainerName = `backend-${currentGreen}`;

    const doesGreenExist = await doesContainerExist(greenContainerName);
    if (!doesGreenExist) {
      return res.status(400).send("Cannot switch traffic -- Green is not up");
    }

    await runAnsiblePlaybook(currentGreen, false);
    await restartNginx();
    // blue is now the new green
    await destroyDockerContainer(blueContainerName);

    return res.status(200).send("Successfully switched traffic");
  } catch (err) {
    return res.status(400).send(`Failed to switch traffic: ${err.message}`);
  }
});

// destroy green env
app.get("/deployment/destroyGreen", async (req, res) => {
  try {
    const currentBlue = await findCurrentBlue(nginxRoute);
    const currentGreen = getAlternateEnv(currentBlue);
    const greenContainerName = `backend-${currentGreen}`;

    const doesGreenExist = await doesContainerExist(greenContainerName);
    if (!doesGreenExist) {
      return res.status(400).send("Cannot destroy green -- Green is not up");
    }

    await runAnsiblePlaybook(currentBlue, false);
    await restartNginx();
    await destroyDockerContainer(greenContainerName);

    return res.status(200).send("Successfully destroyed green");
  } catch (err) {
    return res.status(400).send(`Failed to destroy green: ${err.message}`);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
