import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getRequiredEnvironmentVariable(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }

  return value;
}

const adapter = new PrismaMariaDb({
  host: getRequiredEnvironmentVariable("DATABASE_HOST"),
  port: Number(process.env.DATABASE_PORT || "3306"),
  user: getRequiredEnvironmentVariable("DATABASE_USER"),
  password: getRequiredEnvironmentVariable("DATABASE_PASSWORD"),
  database: getRequiredEnvironmentVariable("DATABASE_NAME"),
  connectionLimit: 5,
  acquireTimeout: 30_000,
connectTimeout: 30_000,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
