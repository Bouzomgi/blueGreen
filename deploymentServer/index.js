const express = require("express");

const {
  findCurrentBlue,
  getAlternateEnv,
  findTestRoute,
} = require("./utils/configParsing");

const {
  runDockerContainer,
  destroyDockerContainer,
  restartNginx,
} = require("./utils/docker");

const { runAnsiblePlaybook } = require("./utils/ansible");

const app = express();
const PORT = process.env.PORT || 8000;

const nginxRoute = "/etc/nginx/nginx.conf";
const imageName = "micro-server";
const networkName = "app-network";

// Health check route
app.get("/deployment/health", (req, res) => {
  res.status(200).send("The deployment server is ok");
});

// stand up new test env
app.get("/deployment/deployGreen", async (req, res) => {
  try {
    const currentBlue = await findCurrentBlue(nginxRoute);
    const currentGreen = getAlternateEnv(currentBlue);
    const greenContainerName = `backend-${currentGreen}`;
    await runDockerContainer(imageName, greenContainerName, networkName);
    await runAnsiblePlaybook(currentBlue, true);
    await restartNginx();

    res.status(200).send("Successfully set up green environment");
  } catch (err) {
    res.status(400).send(`Failed to set up green environment: ${err}`);
  }
});

// switch traffic from current env to next and destroy green env
//TODO: if there is no green, fail!
app.get("/deployment/switchTraffic", async (req, res) => {
  try {
    // add step to validate both envs are up
    const currentBlue = await findCurrentBlue(nginxRoute);
    const currentGreen = getAlternateEnv(currentBlue);
    const blueContainerName = `backend-${currentBlue}`;
    await runAnsiblePlaybook(currentGreen, false);
    await restartNginx();
    // blue is now the new green
    await destroyDockerContainer(blueContainerName);

    res.status(200).send("Successfully switched traffic");
  } catch (err) {
    res.status(400).send(`Failed to switch traffic: ${err}`);
  }
});

// destroy green env
//TODO: if there is no green, fail!
app.get("/deployment/destroyGreen", async (req, res) => {
  try {
    // add step to validate both envs are up
    const currentBlue = await findCurrentBlue(nginxRoute);
    const currentGreen = getAlternateEnv(currentBlue);
    const greenContainerName = `backend-${currentGreen}`;
    await runAnsiblePlaybook(currentBlue, false);
    await restartNginx();
    await destroyDockerContainer(greenContainerName);

    res.status(200).send("Successfully destroyed green");
  } catch (err) {
    res.status(400).send(`Failed to destroy green: ${err}`);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
