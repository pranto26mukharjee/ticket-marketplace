// Runs during `vercel-build`. Creates/promotes an admin only when both
// ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD are provided for that
// single build (e.g. `vercel deploy --prod --build-env ADMIN_BOOTSTRAP_EMAIL=...`).
// Without them it does nothing, so normal deploys are unaffected.
import { spawnSync } from "node:child_process";

const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
const name = process.env.ADMIN_BOOTSTRAP_NAME || "Admin";

if (!email || !password) {
  console.log("bootstrap-admin: no ADMIN_BOOTSTRAP_* variables, skipping.");
  process.exit(0);
}

const result = spawnSync(process.execPath, ["scripts/create-admin.mjs", email, name, password], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
