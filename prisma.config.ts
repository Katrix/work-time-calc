import { defineConfig } from "prisma/config";
import { listLocalDatabases } from "@prisma/adapter-d1";

function localDatasourceUrl(): string | undefined {
  let localDbs: string[];
  try {
    localDbs = listLocalDatabases();
  } catch {
    return undefined;
  }
  return localDbs.length > 0 ? `file:${localDbs[localDbs.length - 1]}` : undefined;
}

const url = localDatasourceUrl();

export default defineConfig({
  schema: "prisma/schema.prisma",
  ...(url ? { datasource: { url } } : {}),
});
