const { execSync } = require("child_process");

function run(command) {
  execSync(command, { stdio: "inherit" });
}

if (process.env.VERCEL) {
  run("npm run prisma:generate");
  run("npm exec -- prisma migrate deploy");
  run("npm run build:ts");
  run("npm run db:seed");
} else {
  run("npm run build:ts");
}