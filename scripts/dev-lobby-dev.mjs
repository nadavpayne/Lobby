// Runs `next dev` on port 3200 against the lobby-dev database (.env.dev.local); .env.local stays untouched.
// Variables already in the environment win over .env.local, so Next keeps these.
// (Not `node --env-file`: Next forwards Node flags to its workers, where --env-file is not allowed.)
import { spawn } from "node:child_process";

process.loadEnvFile(".env.dev.local");
process.env.NEXT_DIST_DIR = ".next-lobby-dev"; // own build folder: Next allows one dev server per folder
spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", "3200"], { stdio: "inherit", env: process.env })
  .on("exit", (code) => process.exit(code ?? 0));
