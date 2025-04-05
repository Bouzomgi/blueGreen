const fs = require("fs").promises;

const findCurrentRed = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf8");
    const lines = data.split("\n");

    // Find the line containing #red
    const redLine = lines.find((line) => line.includes("#red"));

    if (redLine) {
      if (redLine.toLowerCase().includes("alpha")) {
        console.log("Current red environment is alpha");
        return "alpha";
      } else if (redLine.toLowerCase().includes("omega")) {
        console.log("Current red environment is omega");
        return "omega";
      } else {
        throw new Error("unexpected nginx config");
      }
    } else {
      throw new Error("could not find red env line");
    }
  } catch (err) {
    throw new Error("could not read file");
  }
};

const getAlternateEnv = (env) => {
  if (env == "alpha") {
    console.log("Alternate environment is omega");
    return "omega";
  } else if (env == "omega") {
    console.log("Alternate environment is alpha");
    return "alpha";
  } else {
    throw new Error(`unexpected env name with ${env}`);
  }
};

// Function to parse the file and check for test route
const findTestRoute = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf8");
    const lines = data.split("\n");
    const testRouteExists = lines.includes("location /test");
    console.log(`test route exists is ${testRouteExists}`);
    return testRouteExists;
  } catch (err) {
    throw new Error("could not read file");
  }
};

module.exports = {
  findCurrentRed,
  getAlternateEnv,
  findTestRoute,
};
