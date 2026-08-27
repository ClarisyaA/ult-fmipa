import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailableError } from "@/lib/error-utils";

export type ProfileStructureNodeType = "primary" | "standard" | "leaf";

export type ProfileStructureItem = {
  id: string;
  nodeId: string;
  content: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};

export type ProfileStructureNode = {
  id: string;
  parentIds: string[];
  label: string;
  nodeType: ProfileStructureNodeType;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  items: ProfileStructureItem[];
  children: ProfileStructureNode[];
};

export type ProfileStructureEdge = { parentId: string; childId: string };

export type ProfileStructureLayout = {
  levels: ProfileStructureNode[][];
  edges: ProfileStructureEdge[];
};

export type ProfileStructureSettings = {
  id: string;
  title: string;
  subtitle: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type ProfileStructureSettingsInput = {
  title: string;
  subtitle?: string | null;
  actor?: string | null;
};

export type ProfileStructureNodeInput = {
  parentIds?: string[] | string | null;
  label: string;
  nodeType?: string | null;
  sortOrder?: number | string | null;
  isActive?: boolean | string | null;
  actor?: string | null;
};

export type ProfileStructureItemInput = {
  nodeId: string;
  content: string;
  sortOrder?: number | string | null;
  isActive?: boolean | string | null;
  actor?: string | null;
};

export type ProfileStructureItemUpdateInput = {
  content: string;
  sortOrder?: number | string | null;
  isActive?: boolean | string | null;
  actor?: string | null;
};

type SettingsRecord = {
  ID: bigint | number | string;
  TITLE: string;
  SUBTITLE: string | null;
  UPDATED_AT: Date | string | null;
  UPDATED_BY: string | null;
};

type NodeRecord = {
  ID: bigint | number | string;
  PARENT_ID: bigint | number | string | null;
  LABEL: string;
  NODE_TYPE: string;
  SORT_ORDER: number;
  IS_ACTIVE: boolean | number;
  CREATED_AT: Date | string;
  UPDATED_AT: Date | string | null;
  CREATED_BY: string | null;
  UPDATED_BY: string | null;
};

type NodeParentEdgeRecord = {
  NODE_ID: bigint | number | string;
  PARENT_ID: bigint | number | string;
};

type ItemRecord = {
  ID: bigint | number | string;
  NODE_ID: bigint | number | string;
  CONTENT: string;
  SORT_ORDER: number;
  IS_ACTIVE: boolean | number;
  CREATED_AT: Date | string;
  UPDATED_AT: Date | string | null;
  CREATED_BY: string | null;
  UPDATED_BY: string | null;
};

export class ProfileStructureValidationError extends Error {
  statusCode = 400;
}

export class ProfileStructureConflictError extends Error {
  statusCode = 409;
}

export class ProfileStructureTableUnavailableError extends Error {
  statusCode = 503;

  constructor() {
    super(
      "Tabel CMS struktur profil belum tersedia. Jalankan migration 010_create_profile_structure_cms.sql dan 012_add_profile_structure_node_multi_parent.sql."
    );
    this.name = "ProfileStructureTableUnavailableError";
  }
}

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function assertValidId(id: string) {
  if (!/^\d+$/.test(id)) {
    throw new ProfileStructureValidationError("ID tidak valid.");
  }
}

function normalizeNodeType(value: string | null | undefined): ProfileStructureNodeType {
  if (value === "primary" || value === "leaf" || value === "standard") {
    return value;
  }
  return "standard";
}

function requiredLabel(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    throw new ProfileStructureValidationError("Label node wajib diisi.");
  }

  return trimmed.slice(0, 150);
}

function requiredTitle(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    throw new ProfileStructureValidationError("Judul section wajib diisi.");
  }

  return trimmed.slice(0, 150);
}

function optionalSubtitle(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed.slice(0, 255) : null;
}

function requiredContent(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    throw new ProfileStructureValidationError("Isi baris wajib diisi.");
  }

  return trimmed.slice(0, 255);
}

function normalizeBoolean(value: boolean | string | null | undefined, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true" || value === "1" || value === "on";
  return fallback;
}

function normalizeSortOrder(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  const trimmed = typeof value === "string" ? value.trim() : "";

  if (!trimmed) {
    return 0;
  }

  const numeric = Number(trimmed);

  if (!Number.isFinite(numeric)) {
    throw new ProfileStructureValidationError("Urutan harus berupa angka.");
  }

  return Math.trunc(numeric);
}

function optionalActor(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed.slice(0, 100) : null;
}

function normalizeParentIds(value: string[] | string | null | undefined): string[] {
  const list = Array.isArray(value) ? value : value == null ? [] : [value];
  const ids = list
    .map((entry) => entry?.trim() ?? "")
    .filter((entry) => entry && entry !== "root" && entry !== "none");

  ids.forEach(assertValidId);
  return Array.from(new Set(ids));
}

function isMissingProfileStructureTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    /ult_profile_structure_(settings|nodes|node_items|node_parents)/.test(message) &&
    (message.includes("doesn't exist") ||
      message.includes("does not exist") ||
      message.includes("1146"))
  );
}

function warnReadError(message: string, error?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    if (error) console.warn(message, error);
    else console.warn(message);
  }
}

function handleReadError(error: unknown) {
  if (isMissingProfileStructureTableError(error)) {
    warnReadError(
      "Tabel CMS struktur profil belum tersedia. Jalankan migration 010_create_profile_structure_cms.sql."
    );
    return;
  }

  if (isDatabaseUnavailableError(error)) {
    warnReadError("Database CMS struktur profil sementara tidak tersedia.", error);
    return;
  }

  throw error;
}

async function hasProfileStructureTables() {
  try {
    const rows = await prisma.$queryRaw<Array<{ tableCount: bigint | number }>>`
      SELECT COUNT(*) AS tableCount
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN (
          'ult_profile_structure_settings',
          'ult_profile_structure_nodes',
          'ult_profile_structure_node_items',
          'ult_profile_structure_node_parents'
        )
    `;

    return Number(rows[0]?.tableCount ?? 0) === 4;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      warnReadError("Database CMS struktur profil sementara tidak tersedia.", error);
      return false;
    }

    throw error;
  }
}

async function ensureProfileStructureTablesAvailable() {
  if (!(await hasProfileStructureTables())) {
    throw new ProfileStructureTableUnavailableError();
  }
}

function toItem(record: ItemRecord): ProfileStructureItem {
  return {
    id: String(record.ID),
    nodeId: String(record.NODE_ID),
    content: record.CONTENT,
    sortOrder: Number(record.SORT_ORDER),
    isActive: Boolean(record.IS_ACTIVE),
    createdAt: toIso(record.CREATED_AT) ?? "",
    updatedAt: toIso(record.UPDATED_AT),
    createdBy: record.CREATED_BY,
    updatedBy: record.UPDATED_BY,
  };
}

function toNode(
  record: NodeRecord,
  items: ProfileStructureItem[],
  parentIds: string[]
): ProfileStructureNode {
  return {
    id: String(record.ID),
    parentIds,
    label: record.LABEL,
    nodeType: normalizeNodeType(record.NODE_TYPE),
    sortOrder: Number(record.SORT_ORDER),
    isActive: Boolean(record.IS_ACTIVE),
    createdAt: toIso(record.CREATED_AT) ?? "",
    updatedAt: toIso(record.UPDATED_AT),
    createdBy: record.CREATED_BY,
    updatedBy: record.UPDATED_BY,
    items,
    children: [],
  };
}

function toSettings(record: SettingsRecord): ProfileStructureSettings {
  return {
    id: String(record.ID),
    title: record.TITLE,
    subtitle: record.SUBTITLE,
    updatedAt: toIso(record.UPDATED_AT),
    updatedBy: record.UPDATED_BY,
  };
}

// Every node appears exactly once, placed in the row for its computed depth,
// instead of nested under a single parent — this is what lets the renderer
// draw one child box centered under multiple parent boxes (fan-in), which a
// nested tree cannot express without either duplicating the box or arbitrarily
// picking one parent. It's a strict generalization of a tree (a tree is just
// a DAG where every non-root node has exactly one incoming edge), so existing
// single-parent data lays out identically aside from the draw mechanism.
function buildNodeLayout(nodes: ProfileStructureNode[]): ProfileStructureLayout {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges: ProfileStructureEdge[] = [];

  nodes.forEach((node) => {
    node.parentIds.forEach((parentId) => {
      if (byId.has(parentId)) {
        edges.push({ parentId, childId: node.id });
      }
    });
  });

  // Longest-path level assignment via fixed-point relaxation. The org chart
  // is tiny (dozens of nodes), so this is cheap; the nodes.length+1 pass cap
  // guards against a cycle that somehow slipped past assertParentIsValid
  // instead of looping forever.
  const level = new Map<string, number>(nodes.map((node) => [node.id, 0]));
  for (let pass = 0; pass <= nodes.length; pass += 1) {
    let changed = false;
    for (const node of nodes) {
      const parentLevels = node.parentIds
        .filter((parentId) => byId.has(parentId))
        .map((parentId) => level.get(parentId) ?? 0);
      const target = parentLevels.length ? Math.max(...parentLevels) + 1 : 0;
      if (target !== level.get(node.id)) {
        level.set(node.id, target);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const levels: ProfileStructureNode[][] = [];
  nodes.forEach((node) => {
    const lv = level.get(node.id) ?? 0;
    (levels[lv] ??= []).push(node);
  });

  levels.forEach((row) => {
    row.sort((a, b) => a.sortOrder - b.sortOrder || Number(a.id) - Number(b.id));
  });

  return { levels, edges };
}

async function getNodeRecords(activeOnly: boolean) {
  if (!(await hasProfileStructureTables())) {
    return [];
  }

  try {
    return activeOnly
      ? await prisma.$queryRaw<NodeRecord[]>`
          SELECT * FROM ult_profile_structure_nodes
          WHERE IS_ACTIVE = 1
          ORDER BY SORT_ORDER ASC, ID ASC
        `
      : await prisma.$queryRaw<NodeRecord[]>`
          SELECT * FROM ult_profile_structure_nodes
          ORDER BY SORT_ORDER ASC, ID ASC
        `;
  } catch (error) {
    handleReadError(error);
    return [];
  }
}

async function getItemRecords(activeOnly: boolean) {
  if (!(await hasProfileStructureTables())) {
    return [];
  }

  try {
    return activeOnly
      ? await prisma.$queryRaw<ItemRecord[]>`
          SELECT * FROM ult_profile_structure_node_items
          WHERE IS_ACTIVE = 1
          ORDER BY SORT_ORDER ASC, ID ASC
        `
      : await prisma.$queryRaw<ItemRecord[]>`
          SELECT * FROM ult_profile_structure_node_items
          ORDER BY SORT_ORDER ASC, ID ASC
        `;
  } catch (error) {
    handleReadError(error);
    return [];
  }
}

async function getNodeParentEdgeRecords(): Promise<NodeParentEdgeRecord[]> {
  if (!(await hasProfileStructureTables())) {
    return [];
  }

  try {
    return await prisma.$queryRaw<NodeParentEdgeRecord[]>`
      SELECT NODE_ID, PARENT_ID FROM ult_profile_structure_node_parents
    `;
  } catch (error) {
    handleReadError(error);
    return [];
  }
}

async function getNodesWithItems(activeOnly: boolean) {
  const [nodeRecords, itemRecords, edgeRecords] = await Promise.all([
    getNodeRecords(activeOnly),
    getItemRecords(activeOnly),
    getNodeParentEdgeRecords(),
  ]);

  const itemsByNodeId = new Map<string, ProfileStructureItem[]>();
  itemRecords.forEach((record) => {
    const item = toItem(record);
    const list = itemsByNodeId.get(item.nodeId) ?? [];
    list.push(item);
    itemsByNodeId.set(item.nodeId, list);
  });

  const parentIdsByNodeId = new Map<string, string[]>();
  edgeRecords.forEach((record) => {
    const nodeId = String(record.NODE_ID);
    const list = parentIdsByNodeId.get(nodeId) ?? [];
    list.push(String(record.PARENT_ID));
    parentIdsByNodeId.set(nodeId, list);
  });

  return nodeRecords.map((record) =>
    toNode(
      record,
      itemsByNodeId.get(String(record.ID)) ?? [],
      parentIdsByNodeId.get(String(record.ID)) ?? []
    )
  );
}

async function getSettingsRecord() {
  if (!(await hasProfileStructureTables())) {
    return null;
  }

  try {
    const rows = await prisma.$queryRaw<SettingsRecord[]>`
      SELECT * FROM ult_profile_structure_settings ORDER BY ID ASC LIMIT 1
    `;
    return rows[0] ?? null;
  } catch (error) {
    handleReadError(error);
    return null;
  }
}

export async function getPublicProfileStructure() {
  const [settingsRecord, nodes] = await Promise.all([
    getSettingsRecord(),
    getNodesWithItems(true),
  ]);

  // Public tree must not surface active nodes whose only parents are
  // inactive (or missing) as false roots, so filter to only nodes with at
  // least one fully-active ancestor chain before building the layout. A
  // multi-parent node stays visible as long as ANY of its parent chains
  // is active.
  const activeIds = new Set(nodes.map((node) => node.id));
  const byId = new Map(nodes.map((node) => [node.id, node]));

  function isChainActive(node: ProfileStructureNode): boolean {
    if (node.parentIds.length === 0) return true;
    return node.parentIds.some((parentId) => {
      if (!activeIds.has(parentId)) return false;
      const parent = byId.get(parentId);
      return parent ? isChainActive(parent) : false;
    });
  }

  const visibleNodes = nodes.filter((node) => isChainActive(node));

  return {
    settings: settingsRecord ? toSettings(settingsRecord) : null,
    layout: buildNodeLayout(visibleNodes),
  };
}

export async function getAdminProfileStructureState() {
  const tableAvailable = await hasProfileStructureTables();

  if (!tableAvailable) {
    return { settings: null, nodes: [], layout: { levels: [], edges: [] }, unavailable: true };
  }

  const [settingsRecord, nodes] = await Promise.all([
    getSettingsRecord(),
    getNodesWithItems(false),
  ]);

  return {
    settings: settingsRecord ? toSettings(settingsRecord) : null,
    nodes,
    layout: buildNodeLayout(nodes),
    unavailable: false,
  };
}

export async function updateProfileStructureSettings(input: ProfileStructureSettingsInput) {
  await ensureProfileStructureTablesAvailable();

  const title = requiredTitle(input.title);
  const subtitle = optionalSubtitle(input.subtitle);
  const actor = optionalActor(input.actor);
  const existing = await getSettingsRecord();

  if (!existing) {
    await prisma.$executeRaw`
      INSERT INTO ult_profile_structure_settings (ID, TITLE, SUBTITLE, UPDATED_BY)
      VALUES (1, ${title}, ${subtitle}, ${actor})
    `;
  } else {
    await prisma.$executeRaw`
      UPDATE ult_profile_structure_settings
      SET TITLE = ${title}, SUBTITLE = ${subtitle}, UPDATED_BY = ${actor}, UPDATED_AT = CURRENT_TIMESTAMP
      WHERE ID = ${BigInt(existing.ID as string)}
      LIMIT 1
    `;
  }

  const updated = await getSettingsRecord();
  return updated ? toSettings(updated) : null;
}

export async function getProfileStructureNodeById(id: string) {
  assertValidId(id);

  if (!(await hasProfileStructureTables())) {
    return null;
  }

  try {
    const rows = await prisma.$queryRaw<NodeRecord[]>`
      SELECT * FROM ult_profile_structure_nodes WHERE ID = ${BigInt(id)} LIMIT 1
    `;

    if (!rows[0]) return null;

    const items = await prisma.$queryRaw<ItemRecord[]>`
      SELECT * FROM ult_profile_structure_node_items
      WHERE NODE_ID = ${BigInt(id)}
      ORDER BY SORT_ORDER ASC, ID ASC
    `;

    const edges = await prisma.$queryRaw<NodeParentEdgeRecord[]>`
      SELECT NODE_ID, PARENT_ID FROM ult_profile_structure_node_parents
      WHERE NODE_ID = ${BigInt(id)}
    `;

    return toNode(
      rows[0],
      items.map(toItem),
      edges.map((edge) => String(edge.PARENT_ID))
    );
  } catch (error) {
    handleReadError(error);
    return null;
  }
}

async function assertParentIsValid(parentIds: string[], selfId?: string) {
  for (const parentId of parentIds) {
    if (selfId && parentId === selfId) {
      throw new ProfileStructureConflictError("Node tidak bisa menjadi atasan dirinya sendiri.");
    }

    const parent = await getProfileStructureNodeById(parentId);
    if (!parent) {
      throw new ProfileStructureValidationError("Atasan (parent) tidak ditemukan.");
    }
  }

  if (!selfId) return;

  // Would linking any of these candidate parents make selfId its own
  // ancestor? Walk upward via parentIds from each candidate; diamonds
  // (shared ancestors reached through multiple paths) are expected now, so
  // a shared `visited` set avoids re-walking the same node repeatedly.
  async function isAncestorOfSelf(nodeId: string, visited: Set<string>): Promise<boolean> {
    if (nodeId === selfId) return true;
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);

    const node = await getProfileStructureNodeById(nodeId);
    if (!node) return false;

    for (const parentId of node.parentIds) {
      if (await isAncestorOfSelf(parentId, visited)) return true;
    }

    return false;
  }

  const visited = new Set<string>();
  for (const parentId of parentIds) {
    if (await isAncestorOfSelf(parentId, visited)) {
      throw new ProfileStructureConflictError(
        "Perubahan ini akan membuat struktur melingkar (circular hierarchy)."
      );
    }
  }
}

function normalizeNodeInput(input: ProfileStructureNodeInput) {
  return {
    parentIds: normalizeParentIds(input.parentIds),
    label: requiredLabel(input.label),
    nodeType: normalizeNodeType(input.nodeType),
    sortOrder: normalizeSortOrder(input.sortOrder),
    isActive: normalizeBoolean(input.isActive, true),
    actor: optionalActor(input.actor),
  };
}

// PARENT_ID stays populated as a non-authoritative "primary parent" cache
// (first entry of parentIds) — the junction table is the source of truth for
// hierarchy; see database/migrations/012_add_profile_structure_node_multi_parent.sql.
async function syncNodeParentEdges(nodeId: string, parentIds: string[], actor: string | null) {
  await prisma.$executeRaw`
    DELETE FROM ult_profile_structure_node_parents WHERE NODE_ID = ${BigInt(nodeId)}
  `;

  for (const parentId of parentIds) {
    await prisma.$executeRaw`
      INSERT INTO ult_profile_structure_node_parents (NODE_ID, PARENT_ID, CREATED_BY)
      VALUES (${BigInt(nodeId)}, ${BigInt(parentId)}, ${actor})
    `;
  }
}

export async function createProfileStructureNode(input: ProfileStructureNodeInput) {
  await ensureProfileStructureTablesAvailable();
  const data = normalizeNodeInput(input);
  await assertParentIsValid(data.parentIds);

  const primaryParentId = data.parentIds[0] ?? null;

  await prisma.$executeRaw`
    INSERT INTO ult_profile_structure_nodes (
      PARENT_ID, LABEL, NODE_TYPE, SORT_ORDER, IS_ACTIVE, CREATED_BY
    ) VALUES (
      ${primaryParentId ? BigInt(primaryParentId) : null},
      ${data.label},
      ${data.nodeType},
      ${data.sortOrder},
      ${data.isActive ? 1 : 0},
      ${data.actor}
    )
  `;

  const rows = await prisma.$queryRaw<Array<{ ID: bigint | number | string }>>`
    SELECT ID FROM ult_profile_structure_nodes ORDER BY ID DESC LIMIT 1
  `;
  const newId = rows[0] ? String(rows[0].ID) : null;

  if (newId) {
    await syncNodeParentEdges(newId, data.parentIds, data.actor);
  }

  return newId ? getProfileStructureNodeById(newId) : null;
}

export async function updateProfileStructureNode(id: string, input: ProfileStructureNodeInput) {
  assertValidId(id);
  await ensureProfileStructureTablesAvailable();

  const existing = await getProfileStructureNodeById(id);
  if (!existing) {
    return null;
  }

  const data = normalizeNodeInput(input);
  await assertParentIsValid(data.parentIds, id);

  const primaryParentId = data.parentIds[0] ?? null;

  await prisma.$executeRaw`
    UPDATE ult_profile_structure_nodes
    SET
      PARENT_ID = ${primaryParentId ? BigInt(primaryParentId) : null},
      LABEL = ${data.label},
      NODE_TYPE = ${data.nodeType},
      SORT_ORDER = ${data.sortOrder},
      IS_ACTIVE = ${data.isActive ? 1 : 0},
      UPDATED_BY = ${data.actor},
      UPDATED_AT = CURRENT_TIMESTAMP
    WHERE ID = ${BigInt(id)}
    LIMIT 1
  `;

  await syncNodeParentEdges(id, data.parentIds, data.actor);

  return getProfileStructureNodeById(id);
}

export async function deleteProfileStructureNode(id: string, options?: { cascade?: boolean }) {
  assertValidId(id);
  await ensureProfileStructureTablesAvailable();

  const existing = await getProfileStructureNodeById(id);
  if (!existing) {
    return false;
  }

  // A descendant only needs to be deleted alongside `id` if, once `id` is
  // removed, it has zero parents left — a child that survives via another
  // parent outside this subtree (e.g. shares a second parent unrelated to
  // `id`) must not be touched. Computed as a two-phase fixed point over the
  // full node set: first collect everything reachable from `id` via child
  // edges (candidates), then mark a candidate deletable once every one of
  // its parents is itself either `id` or already marked deletable.
  const allNodes = await getNodesWithItems(false);
  const byId = new Map(allNodes.map((node) => [node.id, node]));

  const candidates = new Set<string>();
  (function collectDescendants(nodeId: string) {
    allNodes.forEach((node) => {
      if (node.parentIds.includes(nodeId) && !candidates.has(node.id)) {
        candidates.add(node.id);
        collectDescendants(node.id);
      }
    });
  })(id);

  const deleting = new Set<string>([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const candidateId of candidates) {
      if (deleting.has(candidateId)) continue;
      const node = byId.get(candidateId);
      if (node && node.parentIds.every((parentId) => deleting.has(parentId))) {
        deleting.add(candidateId);
        changed = true;
      }
    }
  }

  const otherIdsToDelete = [...deleting].filter((deleteId) => deleteId !== id);

  if (otherIdsToDelete.length > 0 && !options?.cascade) {
    throw new ProfileStructureConflictError(
      `Node ini masih memiliki ${otherIdsToDelete.length} node turunan yang akan ikut terhapus. ` +
        `Pindahkan/lepas turunan yang masih dipakai node lain, atau gunakan hapus beserta turunan.`
    );
  }

  // Junction-table FKs are ON DELETE CASCADE, so deleting a node row already
  // clears its edge rows in both directions — no manual edge cleanup needed.
  for (const otherId of otherIdsToDelete) {
    await prisma.$executeRaw`DELETE FROM ult_profile_structure_nodes WHERE ID = ${BigInt(otherId)} LIMIT 1`;
  }

  await prisma.$executeRaw`DELETE FROM ult_profile_structure_nodes WHERE ID = ${BigInt(id)} LIMIT 1`;
  return true;
}

export async function createProfileStructureItem(input: ProfileStructureItemInput) {
  await ensureProfileStructureTablesAvailable();
  assertValidId(input.nodeId);

  const node = await getProfileStructureNodeById(input.nodeId);
  if (!node) {
    throw new ProfileStructureValidationError("Node tidak ditemukan.");
  }

  const content = requiredContent(input.content);
  const sortOrder = normalizeSortOrder(input.sortOrder);
  const isActive = normalizeBoolean(input.isActive, true);
  const actor = optionalActor(input.actor);

  await prisma.$executeRaw`
    INSERT INTO ult_profile_structure_node_items (NODE_ID, CONTENT, SORT_ORDER, IS_ACTIVE, CREATED_BY)
    VALUES (${BigInt(input.nodeId)}, ${content}, ${sortOrder}, ${isActive ? 1 : 0}, ${actor})
  `;

  return getProfileStructureNodeById(input.nodeId);
}

async function getItemById(id: string) {
  assertValidId(id);

  const rows = await prisma.$queryRaw<ItemRecord[]>`
    SELECT * FROM ult_profile_structure_node_items WHERE ID = ${BigInt(id)} LIMIT 1
  `;

  return rows[0] ? toItem(rows[0]) : null;
}

export async function updateProfileStructureItem(id: string, input: ProfileStructureItemUpdateInput) {
  assertValidId(id);
  await ensureProfileStructureTablesAvailable();

  const existing = await getItemById(id);
  if (!existing) {
    return null;
  }

  const content = requiredContent(input.content);
  const sortOrder = normalizeSortOrder(input.sortOrder);
  const isActive = normalizeBoolean(input.isActive, existing.isActive);
  const actor = optionalActor(input.actor);

  await prisma.$executeRaw`
    UPDATE ult_profile_structure_node_items
    SET CONTENT = ${content}, SORT_ORDER = ${sortOrder}, IS_ACTIVE = ${isActive ? 1 : 0},
      UPDATED_BY = ${actor}, UPDATED_AT = CURRENT_TIMESTAMP
    WHERE ID = ${BigInt(id)}
    LIMIT 1
  `;

  return getProfileStructureNodeById(existing.nodeId);
}

export async function deleteProfileStructureItem(id: string) {
  assertValidId(id);
  await ensureProfileStructureTablesAvailable();

  const existing = await getItemById(id);
  if (!existing) {
    return false;
  }

  await prisma.$executeRaw`DELETE FROM ult_profile_structure_node_items WHERE ID = ${BigInt(id)} LIMIT 1`;
  return true;
}

export function getProfileStructureApiErrorStatus(error: unknown) {
  if (
    error instanceof ProfileStructureValidationError ||
    error instanceof ProfileStructureConflictError ||
    error instanceof ProfileStructureTableUnavailableError
  ) {
    return { message: error.message, statusCode: error.statusCode };
  }

  return null;
}
