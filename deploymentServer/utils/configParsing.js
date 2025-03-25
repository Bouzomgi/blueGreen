const fs = require("fs").promises;

const findCurrentBlue = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf8");
    const lines = data.split("\n");

    // Find the line containing #blue
    const blueLine = lines.find((line) => line.includes("#blue"));

    if (blueLine) {
      if (blueLine.toLowerCase().includes("primary")) {
        console.log("Current blue environment is primary");
        return "primary";
      } else if (blueLine.toLowerCase().includes("secondary")) {
        console.log("Current blue environment is secondary");
        return "secondary";
      } else {
        throw new Error("unexpected nginx config");
      }
    } else {
      throw new Error("could not find blue env line");
    }
  } catch (err) {
    throw new Error("could not read file");
  }
};

const getAlternateEnv = (env) => {
  if (env == "primary") {
    console.log("Alternate environment is secondary");
    return "secondary";
  } else if (env == "secondary") {
    console.log("Alternate environment is primary");
    return "primary";
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
  findCurrentBlue,
  getAlternateEnv,
  findTestRoute,
};
