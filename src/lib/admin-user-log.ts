import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function cleanSearch(search?: string) {
  return search?.trim().slice(0, 80) || "";
}

function safeLimit(limit?: number) {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(limit, 1), MAX_LIMIT);
}

function safePage(page?: number) {
  if (!page || Number.isNaN(page)) {
    return 1;
  }

  return Math.max(page, 1);
}

function serializeDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function splitLogMessage(log: string) {
  const [module, ...rest] = log.split(":");

  if (rest.length === 0 || module.length > 40) {
    return {
      module: null,
      description: log,
    };
  }

  return {
    module: module.trim() || null,
    description: rest.join(":").trim() || log,
  };
}

export async function getAdminUserLogRows({
  search,
  page,
  limit,
}: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = cleanSearch(search);
  const take = safeLimit(limit);
  const currentPage = safePage(page);
  const where = query
    ? {
        OR: [
          { USER_NAME: { contains: query } },
          { LOG: { contains: query } },
        ],
      }
    : undefined;

  const [total, rows] = await Promise.all([
    prisma.log_users.count({ where }),
    prisma.log_users.findMany({
      where,
      select: {
        ID: true,
        USER_NAME: true,
        TIME: true,
        LOG: true,
      },
      orderBy: { TIME: "desc" },
      take,
      skip: (currentPage - 1) * take,
    }),
  ]);

  return {
    rows: rows.map((row) => {
      const parsed = splitLogMessage(row.LOG);

      return {
        id: row.ID.toString(),
        userName: row.USER_NAME,
        time: serializeDate(row.TIME),
        action: parsed.module ?? "Aktivitas",
        module: parsed.module,
        description: parsed.description,
        log: row.LOG,
      };
    }),
    total,
    page: currentPage,
    limit: take,
    pageCount: Math.max(Math.ceil(total / take), 1),
  };
}
