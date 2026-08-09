import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

async function loadAdminReadonlyData(mockPrisma) {
  const raw = await source("src/lib/admin-readonly-data.ts");
  const patched = raw
    .replace('import { prisma } from "@/lib/prisma";', "const prisma = globalThis.__mockPrisma;")
    .replace(
      'import { STAFF_APP_ROLE_LABELS, STAFF_APP_ROLES } from "@/lib/roles";',
      'const STAFF_APP_ROLE_LABELS = { ADMIN: "Administrator", STAFF: "Staff" }; const STAFF_APP_ROLES = ["STAFF", "ADMIN"];',
    );
  const compiled = ts.transpileModule(patched, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const sandbox = {
    exports: {},
    globalThis: { __mockPrisma: mockPrisma },
    require,
  };

  vm.runInNewContext(compiled, sandbox);
  return sandbox.exports;
}

function makeUsers(total = 42) {
  return Array.from({ length: total }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return {
      USER_NAME: `user${number}`,
      FULL_NAME: `User ${number}`,
      EMAIL: `user${number}@example.test`,
      TELEPHONE: null,
      CONFIRMED: "1",
      ACCESS_CODE: index % 2 === 0 ? "OPERATOR" : "ADMIN",
      APP_ROLE: index % 2 === 0 ? "STAFF" : "ADMIN",
      UNIT_ID: 1,
    };
  });
}

function matchesWhere(row, where) {
  if (!where?.OR) return true;

  return where.OR.some((condition) =>
    Object.entries(condition).some(([field, rule]) =>
      String(row[field] ?? "").includes(rule.contains),
    ),
  );
}

function createPrismaMock(users = makeUsers()) {
  const calls = { count: [], findMany: [] };
  const prisma = {
    data_users: {
      async count(args) {
        calls.count.push(args);
        return users.filter((row) => matchesWhere(row, args.where)).length;
      },
      async findMany(args) {
        calls.findMany.push(args);
        const rows = users
          .filter((row) => matchesWhere(row, args.where))
          .sort((left, right) => left.USER_NAME.localeCompare(right.USER_NAME))
          .slice(args.skip, args.skip + args.take);
        return rows.map((row) =>
          Object.fromEntries(
            Object.entries(args.select)
              .filter(([, include]) => include)
              .map(([key]) => [key, row[key]]),
          ),
        );
      },
    },
  };

  return { prisma, calls };
}

test("user pagination helpers normalize defaults, allowed page sizes, and ranges", async () => {
  const { prisma } = createPrismaMock();
  const mod = await loadAdminReadonlyData(prisma);

  assert.equal(mod.safePage(undefined), 1);
  assert.equal(mod.safePage(0), 1);
  assert.equal(mod.safePage(-4), 1);
  assert.equal(mod.safePage(2.8), 2);
  assert.equal(mod.sanitizeUserPageSize(undefined), 20);
  assert.equal(mod.sanitizeUserPageSize(999), 20);
  assert.deepEqual(Array.from(mod.USER_PAGE_SIZE_OPTIONS), [10, 20, 50, 100]);
  for (const size of mod.USER_PAGE_SIZE_OPTIONS) {
    assert.equal(mod.sanitizeUserPageSize(size), size);
  }

  assert.deepEqual(plain(mod.getPaginationMeta({ page: 1, pageSize: 20, total: 42 })), {
    page: 1,
    pageSize: 20,
    total: 42,
    totalPages: 3,
    start: 1,
    end: 20,
    hasPreviousPage: false,
    hasNextPage: true,
  });
  assert.deepEqual(plain(mod.getPaginationMeta({ page: 3, pageSize: 20, total: 42 })), {
    page: 3,
    pageSize: 20,
    total: 42,
    totalPages: 3,
    start: 41,
    end: 42,
    hasPreviousPage: true,
    hasNextPage: false,
  });
  assert.deepEqual(plain(mod.getPaginationMeta({ page: 9, pageSize: 20, total: 0 })), {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
    start: 0,
    end: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });
});

test("getUserPage uses one shared search filter for count/findMany and database offset pagination", async () => {
  const { prisma, calls } = createPrismaMock();
  const mod = await loadAdminReadonlyData(prisma);
  const result = await mod.getUserPage({ search: "user22", page: 2, pageSize: 10 });

  assert.equal(result.pagination.total, 1);
  assert.equal(result.pagination.page, 1);
  assert.equal(result.rows[0].USER_NAME, "user22");
  assert.deepEqual(calls.count[0].where, calls.findMany[0].where);
  assert.equal(calls.findMany[0].skip, 0);
  assert.equal(calls.findMany[0].take, 10);
  assert.equal(JSON.stringify(calls.findMany[0].orderBy), '{"USER_NAME":"asc"}');
  assert.match(JSON.stringify(calls.findMany[0].where), /USER_NAME/);
  assert.match(JSON.stringify(calls.findMany[0].where), /FULL_NAME/);
  assert.match(JSON.stringify(calls.findMany[0].where), /EMAIL/);
});

test("getUserPage page 2 uses a different offset and never selects password-like fields", async () => {
  const { prisma, calls } = createPrismaMock();
  const mod = await loadAdminReadonlyData(prisma);
  const result = await mod.getUserPage({ page: 2, pageSize: 20 });
  const selectText = JSON.stringify(calls.findMany[0].select);

  assert.equal(result.rows.length, 20);
  assert.equal(result.rows[0].USER_NAME, "user21");
  assert.equal(calls.findMany[0].skip, 20);
  assert.equal(calls.findMany[0].take, 20);
  assert.doesNotMatch(selectText, /PASSWORD|TOKEN|SECRET/i);
});

test("search can find a user beyond the first default page because filtering happens before take", async () => {
  const { prisma } = createPrismaMock();
  const mod = await loadAdminReadonlyData(prisma);
  const result = await mod.getUserPage({ search: "user42" });

  assert.equal(result.pagination.total, 1);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].USER_NAME, "user42");
});

test("admin user list page keeps q/page/pageSize in URL state and resets page on form submit", async () => {
  const page = await source("src/app/admin/system/users/page.tsx");
  const searchFormBlock = page.slice(
    page.indexOf('<AdminSectionCard title="Pencarian">'),
    page.indexOf("</form>"),
  );

  assert.match(page, /searchParams: Promise<\{ q\?: string; page\?: string; pageSize\?: string \}>;/);
  assert.match(page, /params\.set\("page", String\(page\)\);/);
  assert.match(page, /params\.set\("pageSize", String\(pageSize\)\);/);
  assert.match(page, /params\.set\("q", q\?\.trim\(\) \?\? ""\);/);
  assert.match(searchFormBlock, /name="q"/);
  assert.match(searchFormBlock, /name="pageSize"/);
  assert.doesNotMatch(searchFormBlock, /name="page"/);
  assert.match(page, /aria-current="page"/);
  assert.match(page, /aria-label=\{`Buka halaman \$\{entry\}`\}/);
  assert.match(page, /aria-label="Buka halaman sebelumnya"/);
  assert.match(page, /aria-label="Buka halaman berikutnya"/);
  assert.match(page, /disabled=\{!pagination\.hasPreviousPage\}/);
  assert.match(page, /disabled=\{!pagination\.hasNextPage\}/);
});

test("compact page-number window and empty state are present", async () => {
  const page = await source("src/app/admin/system/users/page.tsx");

  assert.match(page, /function buildPageWindow/);
  assert.match(page, /result\.push\("ellipsis"\);/);
  assert.match(page, /rows\.length === 0 \? \(\s*<AdminEmptyState title="Data user tidak ditemukan" \/>/);
  assert.match(page, /Tidak ada data yang sesuai pencarian\./);
});

test("Admin-only enforcement for /admin and /api/admin is unchanged", async () => {
  const proxy = await source("src/proxy.ts");
  const api = await source("src/lib/admin-master-api.ts");

  assert.match(proxy, /isAdminPath && !isRole\(role, "ADMIN"\)/);
  assert.match(proxy, /jsonError\("Forbidden", 403\)/);
  assert.match(api, /requireRole\(\["ADMIN"\]\)/);
});

test("UserCreateButton still refreshes the current route after successful create", async () => {
  const actions = await source("src/components/admin/master-actions/admin-master-actions.tsx");

  assert.match(actions, /startTransition\(\(\) => router\.refresh\(\)\);/);
  assert.match(actions, /sendJson\("\/api\/admin\/system\/users", "POST"/);
});

test("no new pagination dependency was added to package.json", async () => {
  const pkg = JSON.parse(await source("package.json"));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const suspicious = Object.keys(allDeps).filter((name) =>
    /pagination|paginate/i.test(name),
  );

  assert.deepEqual(suspicious, []);
});
