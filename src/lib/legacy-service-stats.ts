import { Prisma } from "@prisma/client";

import { getPublicServices } from "@/lib/legacy-services";
import { prisma } from "@/lib/prisma";

const allowedSourceTables = new Set(
  getPublicServices().map((service) => service.sourceTable)
);

function quoteIdentifier(identifier: string) {
  return `\`${identifier.replaceAll("`", "``")}\``;
}

export async function getServiceRequestCount(sourceTable: string) {
  if (!allowedSourceTables.has(sourceTable)) {
    return null;
  }

  const result = await prisma.$queryRaw<{ total: bigint | number }[]>(
    Prisma.sql`SELECT COUNT(*) AS total FROM ${Prisma.raw(
      quoteIdentifier(sourceTable)
    )}`
  );

  const total = result[0]?.total ?? 0;

  return Number(total);
}
