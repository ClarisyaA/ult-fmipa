import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const validAppRoles = new Set(["ADMIN", "STAFF", "MAHASISWA"]);
const defaultAppRoleByPosition = {
  SUPER_USER: "ADMIN",
  PIMPINAN: "ADMIN",
  ADMIN: "ADMIN",
  OPERATOR: "STAFF",
  KRS: "STAFF",
  STAFF: "STAFF",
  MAHASISWA: "MAHASISWA",
};

function clean(value) {
  return String(value ?? "").trim().toUpperCase();
}

function defaultAppRoleForPosition(positionCode) {
  return defaultAppRoleByPosition[clean(positionCode)] ?? null;
}

function increment(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function printMap(title, map) {
  console.log(title);
  if (map.size === 0) {
    console.log("- None.");
    return;
  }

  for (const [key, count] of [...map.entries()].sort()) {
    console.log(`- ${key || "(blank)"}: ${count}`);
  }
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
    select: {
      USER_NAME: true,
      ACCESS_CODE: true,
      APP_ROLE: true,
    },
    orderBy: { USER_NAME: "asc" },
  });

  const byPosition = new Map();
  const byAppRole = new Map();
  const byDefault = new Map();
  const missingAppRole = [];
  const differentFromDefault = [];
  const invalidPosition = [];
  const invalidAppRole = [];
  const backfillPlan = new Map();

  for (const user of users) {
    const position = clean(user.ACCESS_CODE);
    const appRole = clean(user.APP_ROLE);
    const defaultAppRole = defaultAppRoleForPosition(position);

    increment(byPosition, position);
    increment(byAppRole, appRole);

    if (defaultAppRole) {
      increment(byDefault, `${position} -> ${defaultAppRole}`);
    } else {
      invalidPosition.push(user);
    }

    if (!appRole) {
      missingAppRole.push(user);
      if (defaultAppRole) {
        increment(backfillPlan, `${position} -> APP_ROLE ${defaultAppRole}`);
      }
      continue;
    }

    if (!validAppRoles.has(appRole)) {
      invalidAppRole.push(user);
      continue;
    }

    if (defaultAppRole && appRole !== defaultAppRole) {
      differentFromDefault.push({ ...user, defaultAppRole });
    }
  }

  console.log("Role/access audit dry-run");
  console.log("=========================");
  console.log(`Total data_users: ${users.length}`);
  console.log("");
  printMap("Counts by ACCESS_CODE / posisi:", byPosition);
  console.log("");
  printMap("Counts by APP_ROLE:", byAppRole);
  console.log("");
  printMap("Default APP_ROLE by posisi:", byDefault);
  console.log("");
  console.log("Users with empty APP_ROLE:");
  if (missingAppRole.length === 0) {
    console.log("- None.");
  } else {
    for (const user of missingAppRole) {
      console.log(`- ${user.USER_NAME}: ${user.ACCESS_CODE}`);
    }
  }
  console.log("");
  console.log("Users with APP_ROLE different from default:");
  if (differentFromDefault.length === 0) {
    console.log("- None.");
  } else {
    for (const user of differentFromDefault) {
      console.log(
        `- ${user.USER_NAME}: posisi ${user.ACCESS_CODE}, APP_ROLE ${user.APP_ROLE}, default ${user.defaultAppRole}`,
      );
    }
  }
  console.log("");
  console.log("Invalid position / ACCESS_CODE:");
  if (invalidPosition.length === 0) {
    console.log("- None.");
  } else {
    for (const user of invalidPosition) {
      console.log(`- ${user.USER_NAME}: ${user.ACCESS_CODE}`);
    }
  }
  console.log("");
  console.log("Invalid APP_ROLE:");
  if (invalidAppRole.length === 0) {
    console.log("- None.");
  } else {
    for (const user of invalidAppRole) {
      console.log(`- ${user.USER_NAME}: ${user.APP_ROLE}`);
    }
  }
  console.log("");
  printMap("Backfill plan for APP_ROLE only:", backfillPlan);
  console.log("");
  console.log("Dry-run only. ACCESS_CODE and APP_ROLE were not changed.");
} finally {
  await prisma.$disconnect();
}
