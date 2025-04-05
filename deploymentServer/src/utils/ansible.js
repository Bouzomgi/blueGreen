const fs = require("fs");
const { exec } = require("child_process");

const runAnsiblePlaybook = async (env, testRoute) => {
  return new Promise((resolve, reject) => {
    const command = `ansible-playbook /app/server/render_nginx_template.yaml -e "red_env=${env}" -e "enable_test_route=${testRoute}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error.message);
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
      }
      console.log(
        `Ran ansible playbook with red_env=${env} and enable_test_route=${testRoute}`
      );
      resolve(stdout);
    });
  });
};

module.exports = {
  runAnsiblePlaybook,
};
