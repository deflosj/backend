const { execSync } = require("node:child_process");

function run(command) {
  execSync(command, { stdio: "inherit" });
}

function tryRun(command) {
  try {
    execSync(command, { stdio: "inherit" });
  } catch {
    // Intentionally ignored: command may fail when not applicable (e.g. migration already applied)
  }
}

if (process.env.VERCEL) {
  run("npm run prisma:generate");
  // If the migration previously failed it will be re-applied with the fixed SQL.
  // This is a no-op once the migration has been successfully applied.
  tryRun('npm exec -- prisma migrate resolve --rolled-back "20260528122243_new"');
  run("npm exec -- prisma migrate deploy");
  run("npm run build:ts");
} else {
  run("npm run build:ts");
}