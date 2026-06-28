import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 13306),
  user: process.env.DB_USER ?? "ult_user",
  password: process.env.DB_PASSWORD ?? "ult_password",
  database: process.env.DB_NAME ?? "fmipa_sbpk",
  connectionLimit: 5,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaLogLevels: Array<"query" | "error" | "warn"> =
  process.env.PRISMA_QUERY_LOG === "true"
    ? ["query", "error", "warn"]
    : ["error", "warn"];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: prismaLogLevels,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}