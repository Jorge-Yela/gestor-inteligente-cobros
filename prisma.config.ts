import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local", override: true });

function getRequiredEnvironmentVariable(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }

  return value;
}

function getDatabaseUrl() {
  const url = new URL("mysql://localhost");

  url.hostname = getRequiredEnvironmentVariable("DATABASE_HOST");
  url.port = process.env.DATABASE_PORT || "3306";
  url.username = getRequiredEnvironmentVariable("DATABASE_USER");
  url.password = getRequiredEnvironmentVariable("DATABASE_PASSWORD").replace(/\\\$/g, "$");
  url.pathname = `/${getRequiredEnvironmentVariable("DATABASE_NAME")}`;

  return url.toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getDatabaseUrl(),
  },
});