import { defineConfig } from "prisma/config";
import { listLocalDatabases } from "@prisma/adapter-d1";

// CLI-only datasource (the running app uses the D1 binding via the adapter, see
// server/utils/prisma.ts). Points Prisma CLI at the wrangler-managed local D1
// sqlite and fails hard if it hasn't been created yet.
const localDbs = listLocalDatabases();
if (localDbs.length === 0) {
  throw new Error("No local D1 database found. Run `yarn db:recreate-local` first.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: `file:${localDbs[localDbs.length - 1]}`,
  },
});