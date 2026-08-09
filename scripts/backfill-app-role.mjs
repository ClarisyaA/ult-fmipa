import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const apply = process.argv.includes("--apply");
const defaultAppRoleByPosition = {
  SUPER_USER: "ADMIN",
  PIMPINAN: "ADMIN",
  ADMIN: "ADMIN",
  OPERATOR: "STAFF",
  KRS: "STAFF",
  STAFF: "STAFF",
};

function clean(value) {
  return String(value ?? "").trim().toUpperCase();
}

function defaultAppRoleForPosition(positionCode) {
  return defaultAppRoleByPosition[clean(positionCode)] ?? null;
}

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 13306),
  user: process.env.DB_USER ?? "ult_user",
  password: process.env.DB_PASSWORD ?? "ult_password",
  database: process.env.DB_NAME ?? "fmipa_sbpk",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

try {
  const users = await prisma.data_users.findMany({
    where: {
      OR: [{ APP_ROLE: null }, { APP_ROLE: "" }],
    },
    select: {
      USER_NAME: true,
      ACCESS_CODE: true,
    },
    orderBy: { USER_NAME: "asc" },
  });

  const updates = users
    .map((user) => ({
      username: user.USER_NAME,
      positionCode: user.ACCESS_CODE,
      appRole: defaultAppRoleForPosition(user.ACCESS_CODE),
    }))
    .filter((item) => item.appRole);

  console.log(
    `${apply ? "Applying" : "Dry-run"} APP_ROLE backfill for ${updates.length} user(s).`,
  );
  for (const item of updates) {
    console.log(`- ${item.username}: ${item.positionCode} -> ${item.appRole}`);
  }

  if (!apply) {
    console.log("No database rows were changed. Re-run with --apply to update APP_ROLE.");
  } else {
    await prisma.$transaction(
      updates.map((item) =>
        prisma.data_users.update({
          where: { USER_NAME: item.username },
          data: { APP_ROLE: item.appRole },
        }),
      ),
    );
    console.log("APP_ROLE backfill completed. ACCESS_CODE was not changed.");
  }
} finally {
  await prisma.$disconnect();
}
